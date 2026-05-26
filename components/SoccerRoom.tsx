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

function fixtureLabel(fixture: Fixture) {
  return `${fixture.homeTeam} vs ${fixture.awayTeam}`;
}

function formatDate(fixture: Fixture) {
  return fixture.time ? `${fixture.date} ${fixture.time}` : fixture.date;
}

function planMetricLabel(plan: PrepRoomResponse["plans"][number]) {
  return `${plan.fixture.competition} / ${plan.fixture.round}`;
}

const manualDefaults: [Partial<Fixture>, Partial<Fixture>] = [
  {
    homeTeam: "United States",
    awayTeam: "TBD opponent",
    competition: "Manual upcoming match",
    season: "2026",
    date: "2026-06-12",
    venue: "Custom venue"
  },
  {
    homeTeam: "England",
    awayTeam: "TBD opponent",
    competition: "Manual upcoming match",
    season: "2026",
    date: "2026-06-13",
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
  const [isPending, startTransition] = useTransition();

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

  function updateManual(index: 0 | 1, field: keyof Fixture, value: string) {
    setManualFixtures((current) => {
      const next = [...current] as [Partial<Fixture>, Partial<Fixture>];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function buildRoom() {
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
      throw new Error("Brief request failed");
    }

    const data = (await response.json()) as PrepRoomResponse;
    setPrep(data);
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
              <div className="fixture-field">
                <label htmlFor="fixture-one">Match one</label>
                <select
                  id="fixture-one"
                  value={fixtureIds[0]}
                  onChange={(event) => setFixtureIds([event.target.value, fixtureIds[1]])}
                >
                  {filteredFixtures.map((fixture) => (
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
                  {filteredFixtures.map((fixture) => (
                    <option key={fixture.id} value={fixture.id}>
                      {fixtureLabel(fixture)} - {formatDate(fixture)}
                    </option>
                  ))}
                </select>
              </div>
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
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="primary-button"
            disabled={isPending}
            onClick={() => startTransition(() => void buildRoom())}
          >
            {isPending ? "Building..." : "Build Prep Room"}
          </button>

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
          <button type="button" className="secondary-button" onClick={() => void buildRoom()}>
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
