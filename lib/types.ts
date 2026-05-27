export type FixtureSource = "openfootball-worldcup-2026" | "manual";

export type Fixture = {
  id: string;
  competition: string;
  season: string;
  stage: string;
  round: string;
  group?: string;
  date: string;
  time?: string;
  kickOffUtc?: string | null;
  homeTeam: string;
  awayTeam: string;
  venue?: string;
  status: "scheduled" | "manual";
  source: FixtureSource;
  sourceUrl?: string;
  sourceNote?: string;
};

export type FixturePairLinks = {
  page: string;
  pageRepeatedId: string;
  brief: string;
  fixtures: string;
};

export type Channel = "left" | "center" | "right";

export type EvidenceRef = {
  eventId: string;
  matchId: number;
  minute: number;
  second: number;
  team: string;
  player?: string;
  eventType: string;
  description: string;
  x?: number;
  y?: number;
};

export type TeamEvidence = {
  team: string;
  passes: number;
  successfulPasses: number;
  passCompletionPct: number;
  carries: number;
  shots: number;
  xg: number;
  progressiveActions: number;
  finalThirdEntries: number;
  boxEntries: number;
  ballRecoveries: number;
  pressures: number;
  channelUsage: Record<Channel, number>;
  topChannel: Channel;
  topChannelSharePct: number;
  evidence: EvidenceRef[];
};

export type OpeningStat = {
  label: string;
  value: string;
  numerator: number;
  denominator: number;
  text: string;
};

export type EvidenceSummary = {
  generatedAt: string;
  source: {
    name: string;
    attribution: string;
    eventsUrl: string;
    threeSixtyUrl: string;
    matchesUrl: string;
  };
  match: {
    matchId: number;
    competition: string;
    season: string;
    stage: string;
    date: string;
    kickOff: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    stadium: string;
    dataVersion?: string;
    eventCount: number;
    threeSixtyFrameCount: number;
  };
  openingStat: OpeningStat;
  teams: TeamEvidence[];
  topInsights: string[];
};

export type ReplayPoint = {
  id: string;
  eventId: string;
  t: number;
  x: number;
  y: number;
  label: string;
  type: "pass" | "carry" | "shot" | "pressure" | "recovery";
  team: string;
  player?: string;
  minute: number;
  second: number;
};

export type HeroReplay = {
  matchId: number;
  label: string;
  dominantChannel: Channel;
  computedFrom: "statsbomb_events";
  points: ReplayPoint[];
};

export type FixturePlan = {
  fixture: Fixture;
  dataStatus: string;
  openingStat: OpeningStat;
  scoutRead: string;
  skepticCheck: string;
  attackingPriorities: string[];
  defensivePriorities: string[];
  transitionPriorities: string[];
  coachActions: string[];
  evidence: EvidenceRef[];
};

export type PrepSourceMetadata = {
  evidence: EvidenceSummary["source"] & {
    match: EvidenceSummary["match"];
  };
  fixtures: Array<{
    id: string;
    label: string;
    source: FixtureSource;
    sourceUrl?: string;
    sourceNote?: string;
    kickOffUtc?: string | null;
    venue?: string;
  }>;
};

export type PrepRoomResponse = {
  generatedAt: string;
  question: string;
  fixtureIds: string[];
  evidenceReceiptCount: number;
  evidenceMatch: EvidenceSummary["match"];
  source: PrepSourceMetadata;
  links: FixturePairLinks | null;
  plans: FixturePlan[];
  replay: HeroReplay;
  receipts: string[];
};
