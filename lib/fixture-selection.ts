import type { Fixture } from "./types";

export type FixtureSelectionError = {
  message: string;
  details?: unknown;
};

export type FixtureSelection =
  | { fixtures: Fixture[] }
  | { error: FixtureSelectionError };

export function splitFixtureIds(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function parseFixtureIdsFromSearch(searchParams: URLSearchParams): string[] {
  return [
    ...splitFixtureIds(searchParams.get("fixtureIds")),
    ...splitFixtureIds(searchParams.get("ids")),
    ...searchParams.getAll("id").map((id) => id.trim())
  ].filter(Boolean);
}

export function findDuplicateFixtureIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
    }
  }

  return [...duplicates];
}

export function selectSeedFixturePair(
  seedFixtures: Fixture[],
  requestedIds: string[]
): FixtureSelection {
  const byId = new Map(seedFixtures.map((fixture) => [fixture.id, fixture]));
  const uniqueIds = [...new Set(requestedIds)];

  if (uniqueIds.length !== requestedIds.length) {
    return {
      error: {
        message: "Select two different fixtures.",
        details: { requestedIds }
      }
    };
  }

  const missingIds = uniqueIds.filter((id) => !byId.has(id));
  if (missingIds.length > 0) {
    return {
      error: {
        message: "One or more fixture IDs were not found in the World Cup seed.",
        details: { missingIds }
      }
    };
  }

  if (uniqueIds.length !== 2) {
    return {
      error: {
        message: "Select exactly two fixtures.",
        details: { requestedIds }
      }
    };
  }

  return { fixtures: uniqueIds.map((id) => byId.get(id) as Fixture) };
}
