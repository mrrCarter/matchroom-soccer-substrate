import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const WORLD_CUP_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const MATCHES_URL =
  "https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/55/43.json";
const EVENTS_URL =
  "https://raw.githubusercontent.com/statsbomb/open-data/master/data/events/3795220.json";
const THREE_SIXTY_URL =
  "https://raw.githubusercontent.com/statsbomb/open-data/master/data/three-sixty/3795220.json";
const OUTPUT_DIR = path.join(process.cwd(), "public", "data");

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseKickoffUtc(date, time) {
  const match = /^(\d{1,2}):(\d{2})\s+UTC([+-]\d{1,2})$/.exec(time ?? "");
  if (!date || !match) {
    return null;
  }

  const [year, month, day] = date.split("-").map(Number);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const offset = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day, hour - offset, minute)).toISOString();
}

function normalizeWorldCup(raw) {
  return raw.matches
    .map((match, index) => {
      const homeTeam = match.team1 || "TBD";
      const awayTeam = match.team2 || "TBD";
      const id = slug(`${match.date}-${homeTeam}-${awayTeam}-${match.ground}-${index}`);
      return {
        id,
        competition: raw.name || "World Cup 2026",
        season: "2026",
        stage: match.group || match.round || "Upcoming",
        round: match.round || "Upcoming",
        group: match.group || undefined,
        date: match.date,
        time: match.time,
        kickOffUtc: parseKickoffUtc(match.date, match.time),
        homeTeam,
        awayTeam,
        venue: match.ground,
        status: "scheduled",
        source: "openfootball-worldcup-2026",
        sourceUrl: WORLD_CUP_URL,
        sourceNote:
          "OpenFootball fixture seed. Verify against FIFA's official match center before operational use."
      };
    })
    .sort((a, b) => {
      const left = a.kickOffUtc || `${a.date}T00:00:00.000Z`;
      const right = b.kickOffUtc || `${b.date}T00:00:00.000Z`;
      return left.localeCompare(right);
    });
}

function channel(y) {
  if (y < 26.67) return "left";
  if (y > 53.33) return "right";
  return "center";
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function eventLocation(event) {
  return Array.isArray(event.location) ? event.location : null;
}

function actionEndLocation(event) {
  if (event.type?.name === "Pass" && Array.isArray(event.pass?.end_location)) {
    return event.pass.end_location;
  }
  if (event.type?.name === "Carry" && Array.isArray(event.carry?.end_location)) {
    return event.carry.end_location;
  }
  if (event.type?.name === "Shot" && Array.isArray(event.shot?.end_location)) {
    return event.shot.end_location;
  }
  return null;
}

function isCompletedAction(event) {
  if (event.type?.name === "Pass") {
    return !event.pass?.outcome;
  }
  return event.type?.name === "Carry";
}

function makeEvidence(event, description) {
  const loc = eventLocation(event) ?? [];
  return {
    eventId: event.id,
    matchId: 3795220,
    minute: event.minute ?? 0,
    second: event.second ?? 0,
    team: event.team?.name ?? "Unknown",
    player: event.player?.name,
    eventType: event.type?.name ?? "Event",
    description,
    x: typeof loc[0] === "number" ? round(loc[0], 1) : undefined,
    y: typeof loc[1] === "number" ? round(loc[1], 1) : undefined
  };
}

function emptyTeam(team) {
  return {
    team,
    passes: 0,
    successfulPasses: 0,
    passCompletionPct: 0,
    carries: 0,
    shots: 0,
    xg: 0,
    progressiveActions: 0,
    finalThirdEntries: 0,
    boxEntries: 0,
    ballRecoveries: 0,
    pressures: 0,
    channelUsage: { left: 0, center: 0, right: 0 },
    topChannel: "center",
    topChannelSharePct: 0,
    evidence: []
  };
}

function isBox(location) {
  return location[0] >= 102 && location[1] >= 18 && location[1] <= 62;
}

function computeTeamEvidence(events) {
  const byTeam = new Map();

  function teamFor(event) {
    const name = event.team?.name ?? "Unknown";
    if (!byTeam.has(name)) {
      byTeam.set(name, emptyTeam(name));
    }
    return byTeam.get(name);
  }

  for (const event of events) {
    const team = teamFor(event);
    const type = event.type?.name;
    const start = eventLocation(event);
    const end = actionEndLocation(event);

    if (type === "Pass") {
      team.passes += 1;
      if (!event.pass?.outcome) {
        team.successfulPasses += 1;
      }
    }

    if (type === "Carry") {
      team.carries += 1;
    }

    if (type === "Shot") {
      team.shots += 1;
      team.xg += Number(event.shot?.statsbomb_xg ?? 0);
      if (team.evidence.length < 6) {
        team.evidence.push(
          makeEvidence(
            event,
            `${event.player?.name ?? "Unknown player"} shot from x=${round(start?.[0] ?? 0, 1)}, y=${round(start?.[1] ?? 0, 1)} with xG ${round(Number(event.shot?.statsbomb_xg ?? 0), 3)}.`
          )
        );
      }
    }

    if (type === "Pressure") {
      team.pressures += 1;
    }

    if (type === "Ball Recovery") {
      team.ballRecoveries += 1;
    }

    if (start && end && isCompletedAction(event)) {
      const gain = end[0] - start[0];
      if (gain >= 15 && end[0] >= 60) {
        team.progressiveActions += 1;
      }

      if (start[0] < 80 && end[0] >= 80) {
        const zone = channel(end[1]);
        team.finalThirdEntries += 1;
        team.channelUsage[zone] += 1;
        if (team.evidence.length < 6) {
          team.evidence.push(
            makeEvidence(
              event,
              `${event.player?.name ?? "Unknown player"} moved the ball into the ${zone} final-third channel.`
            )
          );
        }
      }

      if (!isBox(start) && isBox(end)) {
        team.boxEntries += 1;
      }
    }
  }

  return [...byTeam.values()]
    .filter((team) => team.team !== "Unknown")
    .map((team) => {
      const top = Object.entries(team.channelUsage).sort((a, b) => b[1] - a[1])[0] ?? ["center", 0];
      return {
        ...team,
        passCompletionPct: team.passes ? round((team.successfulPasses / team.passes) * 100) : 0,
        xg: round(team.xg, 2),
        topChannel: top[0],
        topChannelSharePct: team.finalThirdEntries
          ? round((Number(top[1]) / team.finalThirdEntries) * 100)
          : 0
      };
    });
}

function buildReplay(events, teams) {
  const possessionMap = new Map();
  const preferredTeam = [...teams].sort((a, b) => b.finalThirdEntries - a.finalThirdEntries)[0]?.team;

  for (const event of events) {
    const type = event.type?.name;
    if (!["Pass", "Carry", "Shot"].includes(type)) continue;
    if (!eventLocation(event)) continue;
    const key = event.possession;
    if (!possessionMap.has(key)) {
      possessionMap.set(key, []);
    }
    possessionMap.get(key).push(event);
  }

  const ranked = [...possessionMap.values()]
    .filter((chain) => chain.length >= 6)
    .map((chain) => {
      const team = chain[0]?.possession_team?.name ?? chain[0]?.team?.name;
      const finalThird = chain.filter((event) => {
        const end = actionEndLocation(event) ?? eventLocation(event);
        return end?.[0] >= 80;
      }).length;
      const shots = chain.filter((event) => event.type?.name === "Shot").length;
      const teamBoost = team === preferredTeam ? 8 : 0;
      return { chain, score: chain.length + finalThird * 3 + shots * 7 + teamBoost };
    })
    .sort((a, b) => b.score - a.score);

  const chain = ranked[0]?.chain ?? events.filter((event) => eventLocation(event)).slice(0, 8);
  const points = chain
    .filter((event) => ["Pass", "Carry", "Shot"].includes(event.type?.name))
    .slice(0, 9)
    .map((event, index) => {
      const end = actionEndLocation(event) ?? eventLocation(event);
      const typeName = event.type?.name;
      return {
        id: `${event.id}-${index}`,
        eventId: event.id,
        t: index * 0.9,
        x: round(end[0], 1),
        y: round(end[1], 1),
        label: `${typeName} ${event.player?.name ?? ""}`.trim(),
        type: typeName === "Shot" ? "shot" : typeName === "Carry" ? "carry" : "pass",
        team: event.team?.name ?? "Unknown",
        player: event.player?.name,
        minute: event.minute ?? 0,
        second: event.second ?? 0
      };
    });

  const dominantChannel = channel(points.at(-1)?.y ?? 40);
  return {
    matchId: 3795220,
    label: "Verified possession chain from StatsBomb events",
    dominantChannel,
    computedFrom: "statsbomb_events",
    points
  };
}

function buildSummary(match, events, threeSixty) {
  const teams = computeTeamEvidence(events).sort((a, b) => {
    if (a.team === match.home_team.home_team_name) return -1;
    if (b.team === match.home_team.home_team_name) return 1;
    return a.team.localeCompare(b.team);
  });
  const statTeam = [...teams].sort((a, b) => b.finalThirdEntries - a.finalThirdEntries)[0];
  const topChannelCount = statTeam.channelUsage[statTeam.topChannel];
  const percent = statTeam.finalThirdEntries
    ? round((topChannelCount / statTeam.finalThirdEntries) * 100)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    source: {
      name: "StatsBomb Open Data",
      attribution:
        "Data provided by StatsBomb Open Data. This demo is a research/exploration project built for a sports-tech hackathon.",
      eventsUrl: EVENTS_URL,
      threeSixtyUrl: THREE_SIXTY_URL,
      matchesUrl: MATCHES_URL
    },
    match: {
      matchId: match.match_id,
      competition: match.competition.competition_name,
      season: match.season.season_name,
      stage: match.competition_stage.name,
      date: match.match_date,
      kickOff: match.kick_off,
      homeTeam: match.home_team.home_team_name,
      awayTeam: match.away_team.away_team_name,
      score: `${match.home_score}-${match.away_score}`,
      stadium: match.stadium?.name ?? "Unknown stadium",
      dataVersion: match.metadata?.data_version,
      eventCount: events.length,
      threeSixtyFrameCount: threeSixty.length
    },
    openingStat: {
      label: `${statTeam.team} ${statTeam.topChannel} channel share`,
      value: `${percent}%`,
      numerator: topChannelCount,
      denominator: statTeam.finalThirdEntries,
      text: `${statTeam.team} sent ${topChannelCount} of ${statTeam.finalThirdEntries} verified final-third entries through the ${statTeam.topChannel} channel.`
    },
    teams,
    topInsights: teams.map(
      (team) =>
        `${team.team}: ${team.finalThirdEntries} final-third entries, ${team.progressiveActions} progressive actions, ${team.boxEntries} box entries, ${team.xg} xG.`
    )
  };
}

function buildDemoBrief(summary, replay) {
  const home = summary.teams.find((team) => team.team === summary.match.homeTeam) ?? summary.teams[0];
  const away = summary.teams.find((team) => team.team === summary.match.awayTeam) ?? summary.teams[1];

  return {
    match: summary.match,
    coachQuestion: "How do we prepare against a possession opponent that can progress into the final third?",
    executiveSummary: [
      summary.openingStat.text,
      `${away.team} logged ${away.progressiveActions} progressive actions and ${away.boxEntries} box entries in the evidence match.`,
      `${home.team} pressure volume was ${home.pressures}, which makes the first pass after regain a measurable coaching point.`
    ],
    attackingPatterns: [
      {
        title: `${away.team} channel progression`,
        evidence: away.evidence.slice(0, 3)
      }
    ],
    defensiveTendencies: [
      {
        title: `${home.team} pressure and recovery response`,
        evidence: home.evidence.slice(0, 3)
      }
    ],
    transitionNotes: [
      "Track whether regains become progressive passes, carries, or safe resets within the first two actions."
    ],
    riskFlags: [
      "The fixture rows are upcoming context. The tactical evidence is from the StatsBomb Italy-Spain sample until a team-specific feed is connected."
    ],
    coachActions: [
      "Rehearse denial of the dominant final-third channel.",
      "Add a reset trigger if the first escape pass after regain is closed.",
      "Review every evidence receipt before turning the brief into a match plan."
    ],
    replay
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const [worldCup, matches, events, threeSixty] = await Promise.all([
    getJson(WORLD_CUP_URL),
    getJson(MATCHES_URL),
    getJson(EVENTS_URL),
    getJson(THREE_SIXTY_URL)
  ]);

  const match = matches.find((item) => item.match_id === 3795220);
  if (!match) {
    throw new Error("StatsBomb match 3795220 was not found in the metadata feed.");
  }

  const fixtures = normalizeWorldCup(worldCup);
  const summary = buildSummary(match, events, threeSixty);
  const replay = buildReplay(events, summary.teams);
  const brief = buildDemoBrief(summary, replay);

  await Promise.all([
    writeFile(path.join(OUTPUT_DIR, "worldcup-2026-fixtures.json"), JSON.stringify(fixtures, null, 2)),
    writeFile(path.join(OUTPUT_DIR, "statsbomb-evidence-summary.json"), JSON.stringify(summary, null, 2)),
    writeFile(path.join(OUTPUT_DIR, "matchroom-hero-replay.json"), JSON.stringify(replay, null, 2)),
    writeFile(path.join(OUTPUT_DIR, "matchroom-demo-brief.json"), JSON.stringify(brief, null, 2))
  ]);

  console.log(`Seeded ${fixtures.length} fixtures.`);
  console.log(
    `Seeded ${summary.match.eventCount} StatsBomb events and ${summary.match.threeSixtyFrameCount} 360 frames.`
  );
  console.log(`Opening stat: ${summary.openingStat.value} - ${summary.openingStat.text}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
