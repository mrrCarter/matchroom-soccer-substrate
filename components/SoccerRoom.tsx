"use client";

import { useMemo, useState, useTransition } from "react";
import PitchMap from "./PitchMap";
import type { EvidenceSummary, Fixture, PrepRoomResponse } from "@/lib/types";

type SoccerRoomProps = {
  initialFixtures: Fixture[];
  initialPrep: PrepRoomResponse;
  initialSummary: EvidenceSummary;
  heroOnly?: boolean;
};

type Mode = "seed" | "manual";
type RequestState = {
  status: "idle" | "success" | "error";
  message: string;
};

function fixtureLabel(fixture: Fixture) {
  return `${fixture.homeTeam} vs ${fixture.awayTeam}`;
}

function formatDate(fixture: Fixture) {
  return fixture.time ? `${fixture.date} ${fixture.time}` : fixture.date;
}

function planMetricLabel(plan: PrepRoomResponse["plans"][number]) {
  return `${plan.fixture.competition} / ${plan.fixture.round}`;
}

function manualFixtureReady(fixture: Partial<Fixture>) {
  return Boolean(
    fixture.homeTeam?.trim() &&
      fixture.awayTeam?.trim() &&
      fixture.competition?.trim() &&
      fixture.date?.trim()
  );
}

const manualDefaults: [Partial<Fixture>, Partial<Fixture>] = [
  {
    homeTeam: "United States",
    awayTeam: "TBD opponent",
    competition: "Manual upcoming match",
    season: "2026",
    date: "2026-06-12",
    time: "19:00",
    venue: "Custom venue"
  },
  {
    homeTeam: "England",
    awayTeam: "TBD opponent",
    competition: "Manual upcoming match",
    season: "2026",
    date: "2026-06-13",
    time: "19:00",
    venue: "Custom venue"
  }
];

export default function SoccerRoom({
  initialFixtures,
  initialPrep,
  initialSummary,
  heroOnly = false
}: SoccerRoomProps) {
  const [prep, setPrep] = useState(initialPrep);
  const [mode, setMode] = useState<Mode>("seed");
  const [query, setQuery] = useState("");
  const [fixtureIds, setFixtureIds] = useState<[string, string]>([
    initialPrep.plans[0]?.fixture.id ?? initialFixtures[0]?.id ?? "",
    initialPrep.plans[1]?.fixture.id ?? initialFixtures[1]?.id ?? ""
  ]);
  const [manualFixtures, setManualFixtures] = useState(manualDefaults);
  const [requestState, setRequestState] = useState<RequestState>({
    status: "idle",
    message: "Ready to build a two-match prep room."
  });
  const [isPending, startTransition] = useTransition();

  const fixtureById = useMemo(
    () => new Map(initialFixtures.map((fixture) => [fixture.id, fixture])),
    [initialFixtures]
  );

  const filteredFixtures = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return initialFixtures.slice(0, 42);
    }

    return initialFixtures
      .filter((fixture) =>
        [
          fixture.homeTeam,
          fixture.awayTeam,
          fixture.competition,
          fixture.group,
          fixture.round,
          fixture.venue,
          fixture.date
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 60);
  }, [initialFixtures, query]);

  const seedOptions = useMemo(() => {
    const pinned = fixtureIds
      .map((id) => fixtureById.get(id))
      .filter((fixture): fixture is Fixture => Boolean(fixture));
    return [...new Map([...pinned, ...filteredFixtures].map((fixture) => [fixture.id, fixture])).values()];
  }, [filteredFixtures, fixtureById, fixtureIds]);

  const selectedSeedFixtures = useMemo(
    () => fixtureIds.map((id) => fixtureById.get(id)).filter((fixture): fixture is Fixture => Boolean(fixture)),
    [fixtureById, fixtureIds]
  );

  const seedSelectionBlocked = mode === "seed" && (!fixtureIds[0] || !fixtureIds[1] || fixtureIds[0] === fixtureIds[1]);
  const manualSelectionBlocked = mode === "manual" && !manualFixtures.every(manualFixtureReady);
  const canShareSeedLink = mode === "seed" && selectedSeedFixtures.length === 2 && fixtureIds[0] !== fixtureIds[1];

  function updateManual(index: 0 | 1, field: keyof Fixture, value: string) {
    setManualFixtures((current) => {
      const next = [...current] as [Partial<Fixture>, Partial<Fixture>];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function buildRoom() {
    if (seedSelectionBlocked) {
      setRequestState({
        status: "error",
        message: "Select two different World Cup fixtures before building the prep room."
      });
      return;
    }

    if (manualSelectionBlocked) {
      setRequestState({
        status: "error",
        message: "Manual mode needs two matches with home team, away team, competition, and date."
      });
      return;
    }

    setRequestState({ status: "idle", message: "Building the prep room from the API..." });

    const body =
      mode === "seed"
        ? { fixtureIds }
        : {
            fixtures: manualFixtures.map((fixture, index) => ({
              ...fixture,
              id: `manual-${index + 1}`,
              source: "manual",
              status: "manual"
            }))
          };

    const response = await fetch("/api/brief", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
      setRequestState({
        status: "error",
        message: errorBody?.error ?? "Brief request failed. Check the fixture inputs and try again."
      });
      return;
    }

    const data = (await response.json()) as PrepRoomResponse;
    setPrep(data);
    setRequestState({
      status: "success",
      message: `Prep room rebuilt for ${data.plans.length} fixtures at ${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}.`
    });
  }

  async function copyShareLink() {
    if (!canShareSeedLink) {
      setRequestState({
        status: "error",
        message: "Select two different seeded fixtures before copying a share link."
      });
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("fixtureIds", fixtureIds.join(","));
    url.searchParams.delete("ids");
    window.history.replaceState(null, "", url.toString());

    const pairLabel = selectedSeedFixtures.map(fixtureLabel).join(" + ");

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(url.toString());
      setRequestState({
        status: "success",
        message: `Share link copied for ${pairLabel}.`
      });
    } catch {
      setRequestState({
        status: "success",
        message: "Share link is ready in the address bar. Clipboard access was unavailable."
      });
    }
  }

  if (heroOnly) {
    return (
      <div>
        <PitchMap replay={prep.replay} summary={initialSummary} />
        <div className="metric-strip" style={{ padding: "14px 0 0" }}>
          <div className="metric">
            <b>{initialSummary.match.eventCount.toLocaleString()}</b>
            <span>Event rows parsed</span>
          </div>
          <div className="metric">
            <b>{initialSummary.match.threeSixtyFrameCount.toLocaleString()}</b>
            <span>360 frames available</span>
          </div>
          <div className="metric">
            <b>{initialSummary.teams[1]?.progressiveActions ?? 0}</b>
            <span>Spain progressive actions</span>
          </div>
          <div className="metric">
            <b>{initialSummary.teams[1]?.boxEntries ?? 0}</b>
            <span>Spain box entries</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-grid">
      <aside className="panel">
        <div className="panel-title">
          <div>
            <h2>Fixture Input</h2>
            <p>World Cup seed or analyst-entered match context.</p>
          </div>
        </div>

        <div className="panel-pad stack">
          <div className="tab-row" role="group" aria-label="Fixture source">
            <button type="button" aria-pressed={mode === "seed"} onClick={() => setMode("seed")}>
              World Cup seed
            </button>
            <button type="button" aria-pressed={mode === "manual"} onClick={() => setMode("manual")}>
              Manual match
            </button>
          </div>

          {mode === "seed" ? (
            <>
              <div className="fixture-field">
                <label htmlFor="fixture-search">Search fixtures</label>
                <input
                  id="fixture-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Team, venue, date, group"
                />
              </div>
              {filteredFixtures.length === 0 ? (
                <div className="request-state" data-status="error">
                  No seeded fixtures match that search. Clear the search or use manual match mode.
                </div>
              ) : null}
              <div className="fixture-field">
                <label htmlFor="fixture-one">Match one</label>
                <select
                  id="fixture-one"
                  value={fixtureIds[0]}
                  onChange={(event) => setFixtureIds([event.target.value, fixtureIds[1]])}
                >
                  {seedOptions.map((fixture) => (
                    <option key={fixture.id} value={fixture.id}>
                      {fixtureLabel(fixture)} - {formatDate(fixture)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fixture-field">
                <label htmlFor="fixture-two">Match two</label>
                <select
                  id="fixture-two"
                  value={fixtureIds[1]}
                  onChange={(event) => setFixtureIds([fixtureIds[0], event.target.value])}
                >
                  {seedOptions.map((fixture) => (
                    <option key={fixture.id} value={fixture.id}>
                      {fixtureLabel(fixture)} - {formatDate(fixture)}
                    </option>
                  ))}
                </select>
              </div>
              {fixtureIds[0] === fixtureIds[1] ? (
                <div className="request-state" data-status="error">
                  Pick two different fixtures so the room can compare two match contexts.
                </div>
              ) : null}
            </>
          ) : (
            <div className="stack">
              {[0, 1].map((index) => (
                <div className="fixture-card" key={index}>
                  <strong>Manual match {index + 1}</strong>
                  <div className="manual-grid" style={{ marginTop: 10 }}>
                    <input
                      value={manualFixtures[index].homeTeam ?? ""}
                      onChange={(event) => updateManual(index as 0 | 1, "homeTeam", event.target.value)}
                      placeholder="Home team"
                    />
                    <input
                      value={manualFixtures[index].awayTeam ?? ""}
                      onChange={(event) => updateManual(index as 0 | 1, "awayTeam", event.target.value)}
                      placeholder="Away team"
                    />
                    <input
                      value={manualFixtures[index].competition ?? ""}
                      onChange={(event) => updateManual(index as 0 | 1, "competition", event.target.value)}
                      placeholder="Competition"
                    />
                    <input
                      value={manualFixtures[index].date ?? ""}
                      onChange={(event) => updateManual(index as 0 | 1, "date", event.target.value)}
                      placeholder="YYYY-MM-DD"
                    />
                    <input
                      value={manualFixtures[index].time ?? ""}
                      onChange={(event) => updateManual(index as 0 | 1, "time", event.target.value)}
                      placeholder="Kickoff time"
                    />
                    <input
                      value={manualFixtures[index].venue ?? ""}
                      onChange={(event) => updateManual(index as 0 | 1, "venue", event.target.value)}
                      placeholder="Venue"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="action-row">
            <button
              type="button"
              className="primary-button"
              disabled={isPending || seedSelectionBlocked || manualSelectionBlocked}
              onClick={() => startTransition(() => void buildRoom())}
            >
              {isPending ? "Building..." : "Build Prep Room"}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={!canShareSeedLink}
              onClick={() => void copyShareLink()}
            >
              Copy Share Link
            </button>
          </div>
          <div className="request-state" data-status={requestState.status} aria-live="polite">
            {requestState.message}
          </div>

          <div className="fixture-card">
            <strong>Evidence source</strong>
            <span>
              {initialSummary.match.competition} {initialSummary.match.season}:{" "}
              {initialSummary.match.homeTeam} vs {initialSummary.match.awayTeam},{" "}
              {initialSummary.match.stadium}
            </span>
          </div>
        </div>
      </aside>

      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Verified Prep Room</h2>
            <p>{prep.question}</p>
          </div>
          <button
            type="button"
            className="secondary-button"
            disabled={isPending || seedSelectionBlocked || manualSelectionBlocked}
            onClick={() => startTransition(() => void buildRoom())}
          >
            Refresh
          </button>
        </div>

        <PitchMap replay={prep.replay} summary={initialSummary} />

        <div className="metric-strip">
          {prep.plans.map((plan) => (
            <div className="metric" key={plan.fixture.id}>
              <b>{formatDate(plan.fixture)}</b>
              <span>{planMetricLabel(plan)}</span>
            </div>
          ))}
          <div className="metric">
            <b>{initialSummary.openingStat.value}</b>
            <span>{initialSummary.openingStat.label}</span>
          </div>
          <div className="metric">
            <b>{initialSummary.match.score}</b>
            <span>{initialSummary.match.homeTeam} vs {initialSummary.match.awayTeam}</span>
          </div>
        </div>

        <div className="insight-grid">
          {prep.plans.map((plan, index) => (
            <article className="insight" key={plan.fixture.id}>
              <h3>
                Match {index + 1}: {fixtureLabel(plan.fixture)}
              </h3>
              <p className="muted">{plan.dataStatus}</p>
              <p>{plan.scoutRead}</p>
              <ul>
                {plan.attackingPriorities.slice(0, 2).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}

          <article className="insight">
            <h3>Skeptic Check</h3>
            <p>{prep.plans[0]?.skepticCheck}</p>
            <ul>
              {prep.plans[0]?.defensivePriorities.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="insight">
            <h3>Coach Actions</h3>
            <ul>
              {prep.plans[0]?.coachActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="receipts">
          {prep.plans.flatMap((plan) =>
            plan.evidence.slice(0, 2).map((item) => (
              <div className="receipt" key={`${plan.fixture.id}-${item.eventId}`}>
                {item.minute}:{String(item.second).padStart(2, "0")} {item.team} {item.eventType} -{" "}
                {item.description}
              </div>
            ))
          )}
        </div>

        <div className="source-bar">
          {prep.receipts.join(" ")}
        </div>
      </section>
    </div>
  );
}
