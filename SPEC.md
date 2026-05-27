# MatchRoom Soccer Substrate Spec

## Mission

Build a separate soccer-first MatchRoom codebase that prepares two upcoming fixtures from real schedule context and verified soccer evidence.

MatchRoom is not a live-score app. It is a pre-match tactical preparation room: fixture facts, deterministic evidence extraction, scout hypotheses, skeptic checks, and coach actions in one traceable workflow.

## Non-Negotiables

- No invented teams, fixtures, stats, event IDs, or tactical metrics.
- Every tactical claim must be tied to evidence or marked as fixture context only.
- Seeded mode must work without auth, databases, or model API keys.
- StatsBomb attribution must be visible in API receipts and UI source copy.
- Fixture facts and tactical inference must stay separated.
- Secrets must be stored only in GitHub Actions secrets or local environment variables, never in files.

## Real Data Sources

- Upcoming fixture seed: OpenFootball World Cup 2026 JSON, cached into `public/data/worldcup-2026-fixtures.json`.
- Tactical evidence seed: StatsBomb Open Data, UEFA Euro 2020 Italy vs Spain, match `3795220`.
- StatsBomb event and 360 files are fetched by `scripts/seed-data.mjs` and reduced into summary, replay, and brief JSON.

The app labels the OpenFootball fixture seed as schedule context and the StatsBomb match as tactical evidence. Manual fixtures are accepted as analyst context, not as a source of tactical facts.

## User Flow

1. Analyst opens `/`, optionally with `fixtureIds`, `ids`, or repeated `id` query params for a seeded pair.
2. Analyst selects two World Cup fixtures or switches to manual match input.
3. Client sends selected fixture IDs or manual fixture rows to `POST /api/brief`.
4. API returns a two-fixture prep response with source status, scout read, skeptic check, coach actions, replay data, and evidence references.
5. UI renders pitch replay, fixture cards, tactical priorities, and source receipts.

## API Contract

### `GET /api/fixtures`

Returns seeded World Cup fixtures. Optional query parameter `q` filters by team, venue, date, group, round, or competition. Optional `limit` caps the response, and `ids=<id-a>,<id-b>` or repeated `id=<id>` returns exact seeded fixtures in caller order.

The response includes `total`, `defaultPair`, `nextKickoffUtc`, `missingIds`, and `data`.

### `GET /api/brief`

Returns the default prep room for the next two seeded fixtures. Optional `fixtureIds=<id-a>,<id-b>` returns the prep room for a specific seeded pair and uses the same validation rules as `POST /api/brief`. `ids=<id-a>,<id-b>` and repeated `id=<id>` params are accepted as aliases for easier wiring.

### `POST /api/brief`

Accepts either:

```json
{ "fixtureIds": ["fixture-a", "fixture-b"] }
```

or:

```json
{
  "fixtures": [
    {
      "homeTeam": "United States",
      "awayTeam": "TBD",
      "competition": "Manual upcoming match",
      "date": "2026-06-12",
      "time": "19:00",
      "venue": "Custom venue"
    },
    {
      "homeTeam": "England",
      "awayTeam": "TBD",
      "competition": "Manual upcoming match",
      "date": "2026-06-13",
      "time": "19:00",
      "venue": "Custom venue"
    }
  ]
}
```

Returns `PrepRoomResponse` from `lib/types.ts`, including `fixtureIds`, `evidenceReceiptCount`, and `source` metadata for the StatsBomb evidence feed plus selected fixture rows.

Validation rules:

- Seeded fixture requests must contain exactly two distinct fixture IDs from the cached World Cup seed.
- Manual fixture requests must contain exactly two rows, each with home team, away team, competition, and a valid `YYYY-MM-DD` date.
- Invalid requests return `400` with an `error` message and optional `details`.

### `GET /api/health`

Returns app status, fixture count, evidence counts, opening stat, and replay point count.

## Evidence Rules

- Channel logic uses StatsBomb pitch coordinates: x from 0 to 120, y from 0 to 80.
- Final-third entry means a completed pass or carry starts before x=80 and ends at or after x=80.
- Box entry means the ball ends in x>=102 and y between 18 and 62 after starting outside that box.
- Progressive action means a completed pass or carry gains at least 15 x-units and ends at or past x=60.
- Claims must be phrased as sample evidence, not universal tendencies.

## PR Plan

- PR1: Data substrate, typed APIs, seeded evidence, health check, clean audit baseline.
- PR2: Core prep room UX for two fixtures, manual input, pitch replay, evidence receipts.
- PR3: Landing and FotMob-better copy pass, owned by Claude on top of the scaffold.
- PR4: Omar Gate workflow and repository secret setup using `SENTINELAYER_TOKEN`.
- PR5: Deployment, README, visual QA, and public URL.
