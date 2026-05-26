import { promises as fs } from "fs";
import path from "path";
import type { EvidenceSummary, Fixture, HeroReplay } from "./types";

const dataDir = path.join(process.cwd(), "public", "data");

async function readJson<T>(filename: string): Promise<T> {
  const file = path.join(dataDir, filename);
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as T;
}

export async function getFixtures(): Promise<Fixture[]> {
  return readJson<Fixture[]>("worldcup-2026-fixtures.json");
}

export async function getEvidenceSummary(): Promise<EvidenceSummary> {
  return readJson<EvidenceSummary>("statsbomb-evidence-summary.json");
}

export async function getHeroReplay(): Promise<HeroReplay> {
  return readJson<HeroReplay>("matchroom-hero-replay.json");
}

export function filterFixtures(fixtures: Fixture[], query: string | null): Fixture[] {
  const q = (query ?? "").trim().toLowerCase();

  if (!q) {
    return fixtures.slice(0, 36);
  }

  return fixtures
    .filter((fixture) => {
      return [
        fixture.homeTeam,
        fixture.awayTeam,
        fixture.competition,
        fixture.group,
        fixture.round,
        fixture.venue,
        fixture.date
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    })
    .slice(0, 60);
}

export function makeManualFixture(input: Partial<Fixture>, fallbackId: string): Fixture {
  const homeTeam = input.homeTeam?.trim() || "TBD home";
  const awayTeam = input.awayTeam?.trim() || "TBD away";
  const date = input.date?.trim() || new Date().toISOString().slice(0, 10);

  return {
    id: input.id || fallbackId,
    competition: input.competition?.trim() || "Manual fixture",
    season: input.season?.trim() || "2026",
    stage: input.stage?.trim() || "Upcoming",
    round: input.round?.trim() || "Upcoming",
    group: input.group?.trim() || undefined,
    date,
    time: input.time?.trim() || undefined,
    kickOffUtc: input.kickOffUtc || null,
    homeTeam,
    awayTeam,
    venue: input.venue?.trim() || undefined,
    status: "manual",
    source: "manual",
    sourceNote: "Entered by analyst. MatchRoom can use it as fixture context once a verified event feed is attached."
  };
}
