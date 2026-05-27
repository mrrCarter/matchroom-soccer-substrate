import { NextResponse } from "next/server";
import { getDefaultFixturePair, getEvidenceSummary, getFixtures, getHeroReplay } from "@/lib/data";
import { buildFixturePairLinks } from "@/lib/links";

export const dynamic = "force-dynamic";

export async function GET() {
  const [fixtures, summary, replay] = await Promise.all([
    getFixtures(),
    getEvidenceSummary(),
    getHeroReplay()
  ]);
  const defaultPair = getDefaultFixturePair(fixtures);

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    app: "matchroom-soccer-substrate",
    fixtures: {
      count: fixtures.length,
      source: fixtures[0]?.source,
      sourceUrl: fixtures[0]?.sourceUrl,
      firstKickOffUtc: fixtures[0]?.kickOffUtc,
      nextKickoffUtc: defaultPair[0]?.kickOffUtc ?? null,
      defaultPair: defaultPair.map((fixture) => ({
        id: fixture.id,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        kickOffUtc: fixture.kickOffUtc,
        venue: fixture.venue
      })),
      links: buildFixturePairLinks(defaultPair)
    },
    evidence: {
      source: summary.source.name,
      matchId: summary.match.matchId,
      eventCount: summary.match.eventCount,
      threeSixtyFrameCount: summary.match.threeSixtyFrameCount,
      openingStat: summary.openingStat
    },
    replay: {
      pointCount: replay.points.length,
      computedFrom: replay.computedFrom
    }
  });
}
