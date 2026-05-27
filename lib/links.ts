import type { Fixture, FixturePairLinks } from "./types";

export function buildFixturePairLinks(fixtures: Pick<Fixture, "id">[]): FixturePairLinks | null {
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
