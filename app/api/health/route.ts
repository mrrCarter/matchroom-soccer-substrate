import { NextResponse } from "next/server";
import { getEvidenceSummary, getFixtures, getHeroReplay } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const [fixtures, summary, replay] = await Promise.all([
    getFixtures(),
    getEvidenceSummary(),
    getHeroReplay()
  ]);

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    app: "matchroom-soccer-substrate",
    fixtures: {
      count: fixtures.length,
      source: fixtures[0]?.source,
      firstKickOffUtc: fixtures[0]?.kickOffUtc
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
