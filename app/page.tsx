import SoccerRoom from "@/components/SoccerRoom";
import { buildPrepRoomResponse } from "@/lib/brief";
import { getEvidenceSummary, getFixtures, getHeroReplay } from "@/lib/data";

export default async function Home() {
  const [fixtures, summary, replay] = await Promise.all([
    getFixtures(),
    getEvidenceSummary(),
    getHeroReplay()
  ]);
  const initialPrep = buildPrepRoomResponse(fixtures.slice(0, 2), summary, replay);

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
