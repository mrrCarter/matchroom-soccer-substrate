import { NextResponse } from "next/server";
import {
  filterFixtures,
  getDefaultFixturePair,
  getFixtures,
  parseFixtureLimit
} from "@/lib/data";

export const dynamic = "force-dynamic";

function requestedIds(searchParams: URLSearchParams): string[] {
  const ids = [
    ...searchParams.getAll("id"),
    ...((searchParams.get("ids") ?? "").split(","))
  ];

  return ids.map((id) => id.trim()).filter(Boolean);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtures = await getFixtures();
  const query = searchParams.get("q");
  const limit = parseFixtureLimit(searchParams.get("limit"), query ? 60 : 36);
  const ids = requestedIds(searchParams);
  const byId = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const data =
    ids.length > 0
      ? ids.map((id) => byId.get(id)).filter((fixture) => Boolean(fixture))
      : filterFixtures(fixtures, query, limit);
  const missingIds = ids.filter((id) => !byId.has(id));
  const defaultPair = getDefaultFixturePair(fixtures);

  return NextResponse.json({
    count: data.length,
    total: fixtures.length,
    generatedAt: new Date().toISOString(),
    source: "openfootball-worldcup-2026",
    defaultPair,
    nextKickoffUtc: defaultPair[0]?.kickOffUtc ?? null,
    missingIds,
    data
  });
}
