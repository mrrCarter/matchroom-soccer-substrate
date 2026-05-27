# 60-Second Demo Script

The same script is available as JSON at `/api/demo-script`, including selected fixture IDs, pair links, source metadata, and a `teleprompter` string.

Start with the stat:

"43% of Spain's verified final-third entries in our evidence match went through the right channel. That came from parsing 4,824 StatsBomb events and 4,244 StatsBomb 360 frames, not from a prompt guess."

Then show the product:

"MatchRoom Soccer is not another live-score page. FotMob tells you what happened. MatchRoom turns real fixture context and verified evidence into a coach-ready preparation room."

Demo flow:

1. Open the app with a real upcoming pair:
   `/?fixtureIds=2026-06-12-usa-paraguay-los-angeles-inglewood-18,2026-06-13-qatar-switzerland-san-francisco-bay-area-santa-clara-7`
2. Point out the two World Cup fixtures: USA vs Paraguay and Qatar vs Switzerland.
3. Show the pitch replay and evidence receipts from Italy vs Spain.
4. Call out the skeptic check: fixture facts are separated from tactical inference.
5. Click refresh or change fixtures to show the room rebuilds through the API.

Close:

"The win is trust under time pressure: analysts can choose any two upcoming matches, see what is known, see what is inferred, and hand coaches an action plan with receipts."
