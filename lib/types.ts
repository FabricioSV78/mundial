export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED"
  | "UNKNOWN";
export type Position = "GK" | "DEF" | "MID" | "FWD";
export type Formation = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1";
export type ExternalProvider = "THESPORTSDB" | "MANUAL";
export type MatchEventType =
  | "GOAL"
  | "RED_CARD"
  | "YELLOW_CARD"
  | "ASSIST"
  | "SUBSTITUTION"
  | "PENALTY_SAVE"
  | "UNKNOWN";
export type FantasyPointSourceType = "GOAL" | "TEAM_WIN" | "YELLOW_CARD" | "RED_CARD" | "PENALTY_SAVE" | "CLEAN_SHEET";
export type QualifiedStatus =
  | "PENDING"
  | "PROJECTED_DIRECT"
  | "PROJECTED_BEST_THIRD"
  | "DIRECT"
  | "BEST_THIRD"
  | "ELIMINATED";
export type KnockoutRoundKey =
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "THIRD_PLACE"
  | "FINAL";

export type Team = {
  id: string;
  name: string;
  code: string;
  shortName?: string;
  flag: string;
  flagUrl?: string;
  group: string;
  groupId?: string;
  isPlaceholder?: boolean;
  placeholderType?: string;
  replacedByTeamId?: string;
  externalId?: string;
  externalProvider?: ExternalProvider;
};

export type Stadium = {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  lat: number;
  lng: number;
  image: string;
  funFact: string;
};

export type Match = {
  id: string;
  externalId?: string;
  externalProvider?: ExternalProvider;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  matchDate?: string;
  stadium: Stadium;
  stadiumName?: string;
  city?: string;
  country?: string;
  groupName?: string;
  stage: string;
  status: MatchStatus;
  lastSyncedAt?: string;
  result?: {
    homeGoals: number;
    awayGoals: number;
    scorer?: string;
    extraTimeHomeScore?: number;
    extraTimeAwayScore?: number;
    penaltiesHomeScore?: number;
    penaltiesAwayScore?: number;
  };
};

export type MatchEventItem = {
  id: string;
  matchId: string;
  externalId: string;
  externalProvider: ExternalProvider;
  minute?: number;
  eventType: MatchEventType;
  playerId?: string;
  playerName?: string;
  teamId?: string;
  teamName?: string;
  rawPayload: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export type Prediction = {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  scorer?: string;
  winnerTeamId?: string;
};

export type Player = {
  id: string;
  name: string;
  teamId?: string;
  country: string;
  countryCode: string;
  position: Position;
  price: number;
  points: number;
  avatar: string;
  photoUrl?: string;
  stats: {
    goals: number;
    assists: number;
    cleanSheets: number;
    saves: number;
    yellowCards: number;
    redCards: number;
    minutes: number;
  };
  recentFantasyEvents?: Array<{
    matchId: string;
    points: number;
    description: string;
  }>;
};

export type LeagueMember = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  country: string;
  predictionPoints: number;
  fantasyPoints: number;
  weeklyPoints: number;
  movement: number;
};

export type FantasyPointEntry = {
  id: string;
  playerId: string;
  matchId: string;
  sourceType: FantasyPointSourceType;
  sourceEventId?: string;
  points: number;
  description: string;
  createdAt: string;
};

export type FantasyPointBreakdown = {
  total: number;
  entries: FantasyPointEntry[];
};

export type LeagueSummary = {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
};

export type League = {
  id: string;
  name: string;
  inviteCode: string;
  members: LeagueMember[];
};

export type NormalizedTeam = {
  externalId?: string;
  name: string;
  shortName: string;
  groupName?: string;
  flagUrl?: string;
  externalProvider: ExternalProvider;
};

export type NormalizedMatch = {
  externalId: string;
  externalProvider: ExternalProvider;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: Date;
  status: MatchStatus;
  groupName?: string;
  stage?: string;
  stadium?: string;
  city?: string;
  country?: string;
  lastSyncedAt: Date;
};

export type GroupStandingRow = {
  teamId: string;
  teamName: string;
  groupName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rank: number;
  qualifiedStatus?: QualifiedStatus;
  fairPlayScore?: number | null;
  fifaRanking?: number | null;
  thirdPlaceRank?: number;
  source: "internal" | "api" | "mixed";
};

export type TournamentConfig = {
  year: number;
  totalTeams: number;
  groups: number;
  teamsPerGroup: number;
  groupStageMatchesPerTeam: number;
  totalGroupStageMatches: number;
  directQualifiersPerGroup: number;
  bestThirdPlaces: number;
  knockoutTeams: number;
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  knockoutRounds: KnockoutRoundKey[];
};
