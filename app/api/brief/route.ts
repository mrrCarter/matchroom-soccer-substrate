import { NextResponse } from "next/server";
import { buildPrepRoomResponse } from "@/lib/brief";
import { getEvidenceSummary, getFixtures, getHeroReplay, makeManualFixture } from "@/lib/data";
import type { Fixture } from "@/lib/types";

export const dynamic = "force-dynamic";

type BriefBody = {
  fixtures?: Partial<Fixture>[];
  fixtureIds?: string[];
};

export async function GET() {
  const [fixtures, summary, replay] = await Promise.all([
    getFixtures(),
    getEvidenceSummary(),
    getHeroReplay()
  ]);

  return NextResponse.json(buildPrepRoomResponse(fixtures.slice(0, 2), summary, replay));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as BriefBody;
  const [seedFixtures, summary, replay] = await Promise.all([
    getFixtures(),
    getEvidenceSummary(),
    getHeroReplay()
  ]);

  const byId = new Map(seedFixtures.map((fixture) => [fixture.id, fixture]));
  const fromIds = (body.fixtureIds ?? [])
    .map((id) => byId.get(id))
    .filter((fixture): fixture is Fixture => Boolean(fixture));

  const fromPayload = (body.fixtures ?? []).map((fixture, index) => {
    if (fixture.id && byId.has(fixture.id)) {
      return byId.get(fixture.id) as Fixture;
    }

    return makeManualFixture(fixture, `manual-${index + 1}-${Date.now()}`);
  });

  const selected = [...fromIds, ...fromPayload].slice(0, 2);
  const fixtures = selected.length >= 2 ? selected : seedFixtures.slice(0, 2);

  return NextResponse.json(buildPrepRoomResponse(fixtures, summary, replay));
}
