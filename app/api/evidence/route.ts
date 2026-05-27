import { NextResponse } from "next/server";
import {
  getAllDataFileProvenance,
  getDefaultFixturePair,
  getEvidenceSummary,
  getFixtures,
  getHeroReplay
} from "@/lib/data";
import { buildFixturePairLinks } from "@/lib/links";

export const dynamic = "force-dynamic";

export async function GET() {
  const [fixtures, summary, replay, files] = await Promise.all([
    getFixtures(),
    getEvidenceSummary(),
    getHeroReplay(),
    getAllDataFileProvenance()
  ]);
  const defaultPair = getDefaultFixturePair(fixtures);

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    claimBoundary:
      "Fixture facts come from the OpenFootball World Cup seed; tactical metrics come from the StatsBomb evidence match until opponent-specific event feeds are attached.",
    fixtures: {
      count: fixtures.length,
      source: fixtures[0]?.source ?? null,
      sourceUrl: fixtures[0]?.sourceUrl ?? null,
      nextKickoffUtc: defaultPair[0]?.kickOffUtc ?? null,
      defaultPair: defaultPair.map((fixture) => ({
        id: fixture.id,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        stage: fixture.stage,
        round: fixture.round,
        group: fixture.group,
        kickOffUtc: fixture.kickOffUtc,
        venue: fixture.venue
      })),
      links: buildFixturePairLinks(defaultPair)
    },
    evidence: {
      source: summary.source,
      match: summary.match,
      openingStat: summary.openingStat,
      topInsights: summary.topInsights,
      teams: summary.teams.map((team) => ({
        team: team.team,
        passes: team.passes,
        successfulPasses: team.successfulPasses,
        passCompletionPct: team.passCompletionPct,
        carries: team.carries,
        shots: team.shots,
        xg: team.xg,
        progressiveActions: team.progressiveActions,
        finalThirdEntries: team.finalThirdEntries,
        boxEntries: team.boxEntries,
        ballRecoveries: team.ballRecoveries,
        pressures: team.pressures,
        channelUsage: team.channelUsage,
        topChannel: team.topChannel,
        topChannelSharePct: team.topChannelSharePct,
        evidenceRefs: team.evidence
      }))
    },
    replay: {
      matchId: replay.matchId,
      label: replay.label,
      dominantChannel: replay.dominantChannel,
      computedFrom: replay.computedFrom,
      pointCount: replay.points.length
    },
    files,
    receipts: [
      `${fixtures.length} World Cup 2026 fixture rows loaded from the cached OpenFootball seed.`,
      `${summary.match.eventCount.toLocaleString()} StatsBomb event rows and ${summary.match.threeSixtyFrameCount.toLocaleString()} 360 frames summarized for ${summary.match.homeTeam} vs ${summary.match.awayTeam}.`,
      `${files.length} local data artifacts expose byte counts and SHA-256 hashes.`,
      summary.source.attribution
    ]
  });
}
