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

## Product Direction

FotMob is excellent for live scores, xG, shot maps, stats, commentary, lineups, and alerts. MatchRoom's wedge is the layer after the match center: a coach-ready prep room with skeptic checks, evidence receipts, and actionable tactical priorities across two upcoming fixtures.
