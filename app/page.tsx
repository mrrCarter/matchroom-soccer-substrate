import SoccerRoom from "@/components/SoccerRoom";
import { buildPrepRoomResponse } from "@/lib/brief";
import { getDefaultFixturePair, getEvidenceSummary, getFixtures, getHeroReplay } from "@/lib/data";
import type { Fixture } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<{
    fixtureIds?: string | string[];
    ids?: string | string[];
    id?: string | string[];
  }>;
};

function paramToIds(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : [value ?? ""];
  return values.flatMap((item) => item.split(",")).map((id) => id.trim()).filter(Boolean);
}

function selectInitialFixtures(fixtures: Fixture[], requestedIds: string[]): Fixture[] {
  const uniqueIds = [...new Set(requestedIds)];
  if (uniqueIds.length !== 2) {
    return getDefaultFixturePair(fixtures);
  }

  const byId = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const selected = uniqueIds.map((id) => byId.get(id));

  return selected.every((fixture): fixture is Fixture => Boolean(fixture))
    ? selected
    : getDefaultFixturePair(fixtures);
}

export default async function Home({ searchParams }: PageProps) {
  const [fixtures, summary, replay] = await Promise.all([
    getFixtures(),
    getEvidenceSummary(),
    getHeroReplay()
  ]);
  const params = (await searchParams) ?? {};
  const requestedIds = [
    ...paramToIds(params.fixtureIds),
    ...paramToIds(params.ids),
    ...paramToIds(params.id)
  ];
  const selectedFixtures = selectInitialFixtures(fixtures, requestedIds);
  const initialPrep = buildPrepRoomResponse(selectedFixtures, summary, replay);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">MR</div>
          <div>
            <div className="brand-title">MatchRoom Soccer</div>
            <div className="brand-subtitle">Verified opponent preparation substrate</div>
          </div>
        </div>
        <div className="status-pill">
          <span className="status-dot" />
          Real fixture seed + StatsBomb evidence
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Soccer substrate</p>
          <h1>Prepare two upcoming matches from evidence, not vibes.</h1>
          <p className="lead">
            Pick World Cup fixtures or enter any upcoming match. MatchRoom keeps the fixture facts,
            tactical evidence, skeptic checks, and coach actions in one room.
          </p>
          <p className="contrast-line">
            Live-score apps tell you what happened. MatchRoom tells you what to do about it
            with the evidence.
          </p>
          <div className="stat-ribbon">
            <div className="stat-number">{summary.openingStat.value}</div>
            <div className="stat-copy">
              {summary.openingStat.text}
              <span>
                Computed from {summary.match.eventCount.toLocaleString()} StatsBomb events and{" "}
                {summary.match.threeSixtyFrameCount.toLocaleString()} 360 frames.
              </span>
            </div>
          </div>
        </div>

        <SoccerRoom
          initialFixtures={fixtures}
          initialPrep={initialPrep}
          initialSummary={summary}
          heroOnly
        />
      </section>

      <section className="room-section">
        <SoccerRoom initialFixtures={fixtures} initialPrep={initialPrep} initialSummary={summary} />
      </section>
    </main>
  );
}
