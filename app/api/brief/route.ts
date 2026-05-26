import { NextResponse } from "next/server";
import { buildPrepRoomResponse } from "@/lib/brief";
import { getEvidenceSummary, getFixtures, getHeroReplay, makeManualFixture } from "@/lib/data";
import type { Fixture } from "@/lib/types";

export const dynamic = "force-dynamic";

type BriefBody = {
  fixtures?: Partial<Fixture>[];
  fixtureIds?: string[];
};

function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      details
    },
    { status: 400 }
  );
}

function isValidDate(value: string | undefined): value is string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validManualFixture(fixture: Partial<Fixture>) {
  return Boolean(
    fixture.homeTeam?.trim() &&
      fixture.awayTeam?.trim() &&
      fixture.competition?.trim() &&
      isValidDate(fixture.date)
  );
}

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
  const requestedIds = (body.fixtureIds ?? []).map((id) => id.trim()).filter(Boolean);

  if (requestedIds.length > 0) {
    const uniqueIds = [...new Set(requestedIds)];
    if (uniqueIds.length !== requestedIds.length) {
      return badRequest("Select two different fixtures.", { requestedIds });
    }

    const missingIds = uniqueIds.filter((id) => !byId.has(id));
    if (missingIds.length > 0) {
      return badRequest("One or more fixture IDs were not found in the World Cup seed.", {
        missingIds
      });
    }

    if (uniqueIds.length !== 2) {
      return badRequest("Select exactly two fixtures.", { requestedIds });
    }

    const fixtures = uniqueIds.map((id) => byId.get(id) as Fixture);
    return NextResponse.json(buildPrepRoomResponse(fixtures, summary, replay));
  }

  if (body.fixtures) {
    if (body.fixtures.length !== 2) {
      return badRequest("Enter exactly two manual matches.", { count: body.fixtures.length });
    }

    const invalidIndexes = body.fixtures
      .map((fixture, index) => (validManualFixture(fixture) ? -1 : index))
      .filter((index) => index >= 0);

    if (invalidIndexes.length > 0) {
      return badRequest(
        "Manual matches require home team, away team, competition, and a YYYY-MM-DD date.",
        { invalidIndexes }
      );
    }

    const fixtures = body.fixtures.map((fixture, index) =>
      makeManualFixture(fixture, `manual-${index + 1}-${Date.now()}`)
    );
    return NextResponse.json(buildPrepRoomResponse(fixtures, summary, replay));
  }

  return badRequest("Provide fixtureIds or fixtures for exactly two upcoming matches.");
}
