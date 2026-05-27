import { promises as fs } from "fs";
import { createHash } from "crypto";
import path from "path";
import type { EvidenceSummary, Fixture, HeroReplay } from "./types";

const dataDir = path.join(process.cwd(), "public", "data");
const dataFiles = [
  "worldcup-2026-fixtures.json",
  "statsbomb-evidence-summary.json",
  "matchroom-hero-replay.json",
  "matchroom-demo-brief.json"
] as const;

export type DataFileName = (typeof dataFiles)[number];

export type DataFileProvenance = {
  filename: DataFileName;
  path: string;
  bytes: number;
  sha256: string;
  modifiedAt: string;
};

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

export async function getDataFileProvenance(
  filename: DataFileName
): Promise<DataFileProvenance> {
  const file = path.join(dataDir, filename);
  const [raw, stats] = await Promise.all([fs.readFile(file), fs.stat(file)]);

  return {
    filename,
    path: `public/data/${filename}`,
    bytes: stats.size,
    sha256: createHash("sha256").update(raw).digest("hex"),
    modifiedAt: stats.mtime.toISOString()
  };
}

export async function getAllDataFileProvenance(): Promise<DataFileProvenance[]> {
  return Promise.all(dataFiles.map((filename) => getDataFileProvenance(filename)));
}

function fixtureSortTime(fixture: Fixture): number {
  const parsed = Date.parse(fixture.kickOffUtc ?? fixture.date);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

export function getUpcomingFixtures(fixtures: Fixture[], now = new Date()): Fixture[] {
  const nowMs = now.getTime();
  const sorted = [...fixtures].sort((a, b) => fixtureSortTime(a) - fixtureSortTime(b));
  const upcoming = sorted.filter((fixture) => fixtureSortTime(fixture) >= nowMs);

  return upcoming.length > 0 ? upcoming : sorted;
}

export function getDefaultFixturePair(fixtures: Fixture[], now = new Date()): Fixture[] {
  return getUpcomingFixtures(fixtures, now).slice(0, 2);
}

export function parseFixtureLimit(value: string | null, fallback = 36, max = 104): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

export function filterFixtures(fixtures: Fixture[], query: string | null, limit = 36): Fixture[] {
  const q = (query ?? "").trim().toLowerCase();

  if (!q) {
    return getUpcomingFixtures(fixtures).slice(0, limit);
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
    .slice(0, limit);
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
