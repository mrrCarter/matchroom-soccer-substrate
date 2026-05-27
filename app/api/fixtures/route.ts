import { NextResponse } from "next/server";
import {
  filterFixtures,
  getDefaultFixturePair,
  getFixtures,
  parseFixtureLimit
} from "@/lib/data";
import type { Fixture } from "@/lib/types";

export const dynamic = "force-dynamic";

function requestedIds(searchParams: URLSearchParams): string[] {
  const ids = [
    ...searchParams.getAll("id"),
    ...((searchParams.get("ids") ?? "").split(","))
  ];

  return ids.map((id) => id.trim()).filter(Boolean);
}

function isFixture(fixture: Fixture | undefined): fixture is Fixture {
  return Boolean(fixture);
}

function pairLinks(fixtures: Fixture[]) {
  const ids = fixtures.slice(0, 2).map((fixture) => fixture.id);
  if (ids.length !== 2) {
    return null;
  }

  const fixtureIds = ids.map((id) => encodeURIComponent(id)).join(",");
  const repeatedIds = ids.map((id) => `id=${encodeURIComponent(id)}`).join("&");

  return {
    page: `/?fixtureIds=${fixtureIds}`,
    pageRepeatedId: `/?${repeatedIds}`,
    brief: `/api/brief?fixtureIds=${fixtureIds}`,
    fixtures: `/api/fixtures?ids=${fixtureIds}`
  };
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
      ? ids.map((id) => byId.get(id)).filter(isFixture)
      : filterFixtures(fixtures, query, limit);
  const missingIds = ids.filter((id) => !byId.has(id));
  const defaultPair = getDefaultFixturePair(fixtures);
  const selectedPair = ids.length === 2 && missingIds.length === 0 ? data.slice(0, 2) : [];

  return NextResponse.json({
    count: data.length,
    total: fixtures.length,
    generatedAt: new Date().toISOString(),
    source: "openfootball-worldcup-2026",
    sourceUrl: fixtures[0]?.sourceUrl ?? null,
    defaultPair,
    nextKickoffUtc: defaultPair[0]?.kickOffUtc ?? null,
    links: {
      defaultPair: pairLinks(defaultPair),
      selectedPair: pairLinks(selectedPair)
    },
    missingIds,
    data
  });
}
