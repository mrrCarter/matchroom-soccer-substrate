import type {
  EvidenceSummary,
  Fixture,
  FixturePlan,
  HeroReplay,
  PrepRoomResponse,
  TeamEvidence
} from "./types";

function firstTeam(summary: EvidenceSummary): TeamEvidence {
  return summary.teams[0];
}

function secondTeam(summary: EvidenceSummary): TeamEvidence {
  return summary.teams[1] ?? summary.teams[0];
}

function formatFixture(fixture: Fixture): string {
  return `${fixture.homeTeam} vs ${fixture.awayTeam}`;
}

function sourceStatus(fixture: Fixture): string {
  if (fixture.source === "manual") {
    return "Manual fixture context. Tactical claims remain anchored to the StatsBomb evidence seed until a team-specific event feed is connected.";
  }

  return "Verified fixture row from the World Cup seed. Tactical claims remain anchored to the StatsBomb evidence seed until a team-specific event feed is connected.";
}

function buildPlan(fixture: Fixture, summary: EvidenceSummary, slot: number): FixturePlan {
  const possessionTeam = slot % 2 === 0 ? secondTeam(summary) : firstTeam(summary);
  const pressureTeam = slot % 2 === 0 ? firstTeam(summary) : secondTeam(summary);
  const evidence = [
    ...possessionTeam.evidence.slice(0, 2),
    ...pressureTeam.evidence.slice(0, 2)
  ];

  return {
    fixture,
    dataStatus: sourceStatus(fixture),
    openingStat: summary.openingStat,
    scoutRead:
      `${formatFixture(fixture)} should be prepared against a possession side that can turn ` +
      `${possessionTeam.finalThirdEntries} final-third entries and ${possessionTeam.progressiveActions} progressive actions into repeatable pressure.`,
    skepticCheck:
      "The upcoming fixture row is real context, but the tactical model is evidence-seeded from Italy vs Spain. Treat this as the prep substrate until opponent-specific event data is attached.",
    attackingPriorities: [
      `Stress the ${possessionTeam.topChannel} channel in training because the evidence match shows ${possessionTeam.topChannelSharePct}% of ${possessionTeam.team} final-third entries there.`,
      `Build one first-touch escape pattern for pressure after regain; ${pressureTeam.team} logged ${pressureTeam.pressures} pressure events in the evidence match.`,
      `Track box-entry quality, not just volume: the evidence match has ${possessionTeam.boxEntries} box entries and ${possessionTeam.shots} shots for ${possessionTeam.team}.`
    ],
    defensivePriorities: [
      `Set a compact rest-defense rule when the ball enters the ${possessionTeam.topChannel} channel.`,
      `Trigger pressure on backward passes after the first final-third entry instead of chasing early circulation.`,
      `Keep the weak-side fullback connected when possession sequences cross midfield.`
    ],
    transitionPriorities: [
      `First outlet after regain should attack the space behind the active channel, not the nearest pass by habit.`,
      `Delay the second pass if the opponent counterpress arrives within three seconds.`,
      `Log every recovery that becomes a carry or pass into the final third for post-match verification.`
    ],
    coachActions: [
      "Create a 12-minute pattern block for channel denial and second-ball response.",
      "Assign one analyst to tag first pressure, escape pass, and final-third entry on the same possession chain.",
      "Use the evidence receipts below as the review checklist before expanding claims."
    ],
    evidence
  };
}

export function buildPrepRoomResponse(
  fixtures: Fixture[],
  summary: EvidenceSummary,
  replay: HeroReplay
): PrepRoomResponse {
  const selected = fixtures.slice(0, 2);

  return {
    generatedAt: new Date().toISOString(),
    question:
      selected.length === 2
        ? `Prepare for ${formatFixture(selected[0])} and ${formatFixture(selected[1])}.`
        : "Prepare two upcoming fixtures.",
    evidenceMatch: summary.match,
    plans: selected.map((fixture, index) => buildPlan(fixture, summary, index)),
    replay,
    receipts: [
      `${summary.match.eventCount.toLocaleString()} StatsBomb event rows parsed for ${summary.match.homeTeam} vs ${summary.match.awayTeam}.`,
      `${summary.match.threeSixtyFrameCount.toLocaleString()} StatsBomb 360 frames available for spatial context.`,
      summary.source.attribution,
      "Fixture facts and tactical inference are intentionally separated in the response."
    ]
  };
}
