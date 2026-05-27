import { NextResponse } from "next/server";
import { getDefaultFixturePair, getEvidenceSummary, getFixtures } from "@/lib/data";
import { buildFixturePairLinks } from "@/lib/links";
import type { Fixture } from "@/lib/types";

export const dynamic = "force-dynamic";

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

function splitFixtureIds(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function requestedFixtureIds(searchParams: URLSearchParams): string[] {
  return [
    ...splitFixtureIds(searchParams.get("fixtureIds")),
    ...splitFixtureIds(searchParams.get("ids")),
    ...searchParams.getAll("id").map((id) => id.trim())
  ].filter(Boolean);
}

type Selection = { fixtures: Fixture[] } | { error: NextResponse };

function selectSeedFixtures(seedFixtures: Fixture[], requestedIds: string[]): Selection {
  const byId = new Map(seedFixtures.map((fixture) => [fixture.id, fixture]));
  const uniqueIds = [...new Set(requestedIds)];

  if (uniqueIds.length !== requestedIds.length) {
    return { error: badRequest("Select two different fixtures.", { requestedIds }) };
  }

  const missingIds = uniqueIds.filter((id) => !byId.has(id));
  if (missingIds.length > 0) {
    return {
      error: badRequest("One or more fixture IDs were not found in the World Cup seed.", {
        missingIds
      })
    };
  }

  if (uniqueIds.length !== 2) {
    return { error: badRequest("Select exactly two fixtures.", { requestedIds }) };
  }

  return { fixtures: uniqueIds.map((id) => byId.get(id) as Fixture) };
}

function fixtureLabel(fixture: Fixture): string {
  return `${fixture.homeTeam} vs ${fixture.awayTeam}`;
}

function fixtureDetail(fixture: Fixture): string {
  const kickoff = fixture.kickOffUtc ? ` at ${fixture.kickOffUtc}` : "";
  const venue = fixture.venue ? ` in ${fixture.venue}` : "";

  return `${fixtureLabel(fixture)}${venue}${kickoff}`;
}

export async function GET(request: Request) {
  const [fixtures, summary] = await Promise.all([getFixtures(), getEvidenceSummary()]);
  const { searchParams } = new URL(request.url);
  const requestedIds = requestedFixtureIds(searchParams);
  const selected =
    requestedIds.length > 0
      ? selectSeedFixtures(fixtures, requestedIds)
      : { fixtures: getDefaultFixturePair(fixtures) };

  if ("error" in selected) {
    return selected.error;
  }

  const pair = selected.fixtures.slice(0, 2);
  const pairLabel = `${fixtureLabel(pair[0])} and ${fixtureLabel(pair[1])}`;
  const opener =
    `${summary.openingStat.value} of Spain's verified final-third entries in the evidence match went through the right channel. ` +
    `That came from parsing ${summary.match.eventCount.toLocaleString()} StatsBomb events and ${summary.match.threeSixtyFrameCount.toLocaleString()} StatsBomb 360 frames, not from a prompt guess.`;
  const beats = [
    {
      startSecond: 0,
      endSecond: 10,
      label: "Open with proof",
      text: opener
    },
    {
      startSecond: 10,
      endSecond: 20,
      label: "Frame the product",
      text:
        "MatchRoom Soccer is not another live-score page. It turns real fixture context and verified evidence into a coach-ready preparation room."
    },
    {
      startSecond: 20,
      endSecond: 34,
      label: "Show the selected pair",
      text: `For this room, the analyst is preparing ${pairLabel}: ${fixtureDetail(pair[0])}; ${fixtureDetail(pair[1])}.`
    },
    {
      startSecond: 34,
      endSecond: 48,
      label: "Show the skeptic check",
      text:
        "The response separates fixture facts from tactical inference, so coaches can see what is known, what is inferred, and which evidence receipts support each claim."
    },
    {
      startSecond: 48,
      endSecond: 60,
      label: "Close",
      text:
        "The win is trust under time pressure: pick any two upcoming matches, get a tactical plan with receipts, and hand the staff actions they can verify."
    }
  ];

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    durationSeconds: 60,
    fixtureIds: pair.map((fixture) => fixture.id),
    openingStat: summary.openingStat,
    pair: pair.map((fixture) => ({
      id: fixture.id,
      label: fixtureLabel(fixture),
      kickOffUtc: fixture.kickOffUtc,
      venue: fixture.venue,
      source: fixture.source,
      sourceUrl: fixture.sourceUrl
    })),
    source: {
      fixtureSource: pair[0]?.source ?? null,
      fixtureSourceUrl: pair[0]?.sourceUrl ?? null,
      evidence: summary.source,
      evidenceMatch: summary.match
    },
    links: buildFixturePairLinks(pair),
    beats,
    teleprompter: beats.map((beat) => beat.text).join(" ")
  });
}
