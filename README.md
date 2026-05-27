# MatchRoom Soccer Substrate

Separate soccer-first MatchRoom codebase for upcoming-match preparation.

The app lets an analyst choose or enter any two upcoming fixtures, with the World Cup 2026 seed loaded by default. It then builds a verified prep room from real fixture rows and a StatsBomb Open Data evidence substrate.

## Data

- World Cup fixture seed: `openfootball/worldcup.json` for 2026 fixtures.
- Tactical evidence seed: StatsBomb Open Data, UEFA Euro 2020 Italy vs Spain, match `3795220`.
- The app labels source receipts and separates fixture facts from tactical inference.

Required attribution is visible in-product:

`Data provided by StatsBomb Open Data. This demo is a research/exploration project built for a sports-tech hackathon.`

## Commands

```bash
npm install
npm run seed:data
npm run typecheck
npm run build
npm run dev -- --port 3002
```

## API Quick Check

`GET /api/health` returns app status, real-data counts, the default upcoming pair, and drill-down links:

```bash
curl "http://localhost:3002/api/health"
```

`GET /api/evidence` returns the real-data provenance packet for wiring source-proof UI or reviewer checks. It includes the OpenFootball fixture source, the StatsBomb evidence source, the opening stat, team metrics, top insights, replay count, default pair links, and SHA-256 hashes for the cached data files:

```bash
curl "http://localhost:3002/api/evidence"
```

`GET /api/demo-script` returns a deterministic 60-second presenter script for the default pair, starting with the verified opening stat. It accepts the same `fixtureIds`, `ids`, and repeated `id` pair aliases:

```bash
curl "http://localhost:3002/api/demo-script"
curl "http://localhost:3002/api/demo-script?id=2026-06-12-usa-paraguay-los-angeles-inglewood-18&id=2026-06-13-qatar-switzerland-san-francisco-bay-area-santa-clara-7"
```

`GET /api/fixtures` returns seeded upcoming fixtures with metadata and ready-to-use links for the default pair:

```bash
curl "http://localhost:3002/api/fixtures?limit=4"
curl "http://localhost:3002/api/fixtures?q=usa"
curl "http://localhost:3002/api/fixtures?fixtureIds=2026-06-12-usa-paraguay-los-angeles-inglewood-18,2026-06-13-qatar-switzerland-san-francisco-bay-area-santa-clara-7"
curl "http://localhost:3002/api/fixtures?id=2026-06-12-usa-paraguay-los-angeles-inglewood-18&id=2026-06-13-qatar-switzerland-san-francisco-bay-area-santa-clara-7"
```

The fixture response includes `links.defaultPair`, and exact two-ID lookups include `links.selectedPair`, with page, repeated-id page, brief JSON, fixture lookup, and demo-script URLs. It also reports `missingIds` and `duplicateIds` so callers can surface bad pair selections cleanly.

`GET /api/brief?fixtureIds=<id-a>,<id-b>` returns a browser-openable prep room JSON for a specific pair. `ids=<id-a>,<id-b>` and repeated `id=<id>` params are accepted as aliases. The response includes `fixtureIds`, `evidenceReceiptCount`, `source` metadata, and seeded pair `links` so copied API URLs are self-describing, including the matching `/api/demo-script` URL.

`POST /api/brief` accepts exactly two seeded fixture IDs:

```json
{ "fixtureIds": ["2026-06-11-mexico-south-africa-mexico-city-0", "2026-06-11-south-korea-czech-republic-guadalajara-zapopan-1"] }
```

Or exactly two manual matches:

```json
{
  "fixtures": [
    {
      "homeTeam": "United States",
      "awayTeam": "Japan",
      "competition": "Friendly",
      "date": "2026-06-01",
      "time": "20:00",
      "venue": "Boston"
    },
    {
      "homeTeam": "England",
      "awayTeam": "Brazil",
      "competition": "Friendly",
      "date": "2026-06-02",
      "time": "19:30",
      "venue": "London"
    }
  ]
}
```

The API returns `400` for duplicate seeded IDs, missing seeded IDs, invalid manual dates, or anything other than two matches.

The app shell also accepts the same pair in the URL through `fixtureIds`, `ids`, or repeated `id` params:

```text
/?fixtureIds=2026-06-12-usa-paraguay-los-angeles-inglewood-18,2026-06-13-qatar-switzerland-san-francisco-bay-area-santa-clara-7
/?id=2026-06-12-usa-paraguay-los-angeles-inglewood-18&id=2026-06-13-qatar-switzerland-san-francisco-bay-area-santa-clara-7
```

## Product Direction

FotMob is excellent for live scores, xG, shot maps, stats, commentary, lineups, and alerts. MatchRoom's wedge is the layer after the match center: a coach-ready prep room with skeptic checks, evidence receipts, and actionable tactical priorities across two upcoming fixtures.

## Deployment Note

The app is ready for Vercel or another Next.js host, but this shell does not currently have non-interactive deployment credentials. `VERCEL_*` and AWS auth environment variables are absent, and `npx vercel whoami` waits for login.
