import type {
  GroupStandingRow,
  KnockoutRoundKey,
  MatchStatus,
  QualifiedStatus,
  TournamentConfig,
} from "@/lib/types";

export const tournamentConfig: TournamentConfig = {
  year: 2026,
  totalTeams: 48,
  groups: 12,
  teamsPerGroup: 4,
  groupStageMatchesPerTeam: 3,
  totalGroupStageMatches: 72,
  directQualifiersPerGroup: 2,
  bestThirdPlaces: 8,
  knockoutTeams: 32,
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
  knockoutRounds: [
    "ROUND_OF_32",
    "ROUND_OF_16",
    "QUARTER_FINALS",
    "SEMI_FINALS",
    "THIRD_PLACE",
    "FINAL",
  ],
};

export type TournamentEngineTeam = {
  id: string;
  name: string;
  groupName?: string;
  fairPlayScore?: number | null;
  fifaRanking?: number | null;
};

export type TournamentEngineMatch = {
  id: string;
  homeTeam: TournamentEngineTeam;
  awayTeam: TournamentEngineTeam;
  homeScore?: number | null;
  awayScore?: number | null;
  groupName?: string | null;
  stage?: string | null;
  status: MatchStatus;
};

export type GroupStanding = {
  groupName: string;
  source: "internal" | "api" | "mixed";
  rows: GroupStandingRow[];
};

export type DetermineQualifiedOptions = {
  config?: TournamentConfig;
  liveProjection?: boolean;
};

export type BestThirdOptions = {
  config?: TournamentConfig;
};

export type GroupStageValidationReport = {
  isComplete: boolean;
  totalGroups: number;
  groupsWithFourTeams: number;
  totalGroupStageMatches: number;
  expectedGroupStageMatches: number;
  warnings: string[];
  groups: Array<{
    groupName: string;
    teamCount: number;
    matchCount: number;
    complete: boolean;
    teamWarnings: string[];
  }>;
};

export type KnockoutSlot = {
  id: string;
  roundKey: KnockoutRoundKey;
  round: "Round of 32" | "Round of 16" | "Quarterfinal" | "Semifinal" | "Third Place" | "Final";
  home: string;
  away: string;
  winner?: string;
  locked?: boolean;
};

const defaultRoundOf32Blueprint: Array<{ home: string; away: string }> = [
  { home: "1° Grupo A", away: "2° Grupo B" },
  { home: "1° Grupo C", away: "2° Grupo D" },
  { home: "1° Grupo E", away: "2° Grupo F" },
  { home: "1° Grupo G", away: "2° Grupo H" },
  { home: "1° Grupo I", away: "2° Grupo J" },
  { home: "1° Grupo K", away: "2° Grupo L" },
  { home: "2° Grupo A", away: "Mejor 3° #1" },
  { home: "2° Grupo C", away: "Mejor 3° #2" },
  { home: "2° Grupo E", away: "Mejor 3° #3" },
  { home: "2° Grupo G", away: "Mejor 3° #4" },
  { home: "2° Grupo I", away: "Mejor 3° #5" },
  { home: "2° Grupo K", away: "Mejor 3° #6" },
  { home: "1° Grupo B", away: "Mejor 3° #7" },
  { home: "1° Grupo D", away: "Mejor 3° #8" },
  { home: "1° Grupo F", away: "2° Grupo H" },
  { home: "1° Grupo J", away: "2° Grupo L" },
];

function isScoreDefined(value?: number | null) {
  return value !== null && value !== undefined;
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function stableRowFallback(left: GroupStandingRow, right: GroupStandingRow) {
  const byName = normalizeName(left.teamName).localeCompare(normalizeName(right.teamName));

  if (byName) {
    return byName;
  }

  return left.teamId.localeCompare(right.teamId);
}

function stageKeyFromValue(stage?: string | null) {
  const normalized = (stage ?? "").toLowerCase();

  if (
    normalized.includes("round of 32") ||
    normalized.includes("dieciseis") ||
    normalized.includes("1/16")
  ) {
    return "ROUND_OF_32";
  }

  if (
    normalized.includes("round of 16") ||
    normalized.includes("octavos") ||
    normalized.includes("1/8")
  ) {
    return "ROUND_OF_16";
  }

  if (normalized.includes("quarter") || normalized.includes("cuartos") || normalized.includes("1/4")) {
    return "QUARTER_FINALS";
  }

  if (normalized.includes("semi")) {
    return "SEMI_FINALS";
  }

  if (normalized.includes("third") || normalized.includes("tercer")) {
    return "THIRD_PLACE";
  }

  if (normalized.includes("final")) {
    return "FINAL";
  }

  return null;
}

function isGroupStageMatch(match: TournamentEngineMatch, expectedGroupName?: string) {
  const groupName = match.groupName ?? match.homeTeam.groupName ?? match.awayTeam.groupName ?? null;

  if (!groupName) {
    return false;
  }

  if (expectedGroupName && groupName !== expectedGroupName) {
    return false;
  }

  if (match.homeTeam.groupName && match.homeTeam.groupName !== groupName) {
    return false;
  }

  if (match.awayTeam.groupName && match.awayTeam.groupName !== groupName) {
    return false;
  }

  return stageKeyFromValue(match.stage) === null;
}

function emptyRow(team: TournamentEngineTeam, groupName: string): GroupStandingRow {
  return {
    teamId: team.id,
    teamName: team.name,
    groupName,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    rank: 0,
    qualifiedStatus: "PENDING",
    fairPlayScore: team.fairPlayScore ?? null,
    fifaRanking: team.fifaRanking ?? null,
    source: "internal",
  };
}

function addResult(
  row: GroupStandingRow,
  goalsFor: number,
  goalsAgainst: number,
  config: TournamentConfig,
) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.won += 1;
    row.points += config.pointsForWin;
  } else if (goalsFor === goalsAgainst) {
    row.drawn += 1;
    row.points += config.pointsForDraw;
  } else {
    row.lost += 1;
    row.points += config.pointsForLoss;
  }
}

function calculateMiniTable(
  matches: TournamentEngineMatch[],
  tiedRows: GroupStandingRow[],
  groupName: string,
  config: TournamentConfig,
) {
  const tiedIds = new Set(tiedRows.map((row) => row.teamId));
  const miniRows = new Map(
    tiedRows.map((row) => [
      row.teamId,
      {
        points: 0,
        goalDifference: 0,
        goalsFor: 0,
      },
    ]),
  );

  for (const match of matches) {
    if (!isGroupStageMatch(match, groupName)) {
      continue;
    }

    if (!isScoreDefined(match.homeScore) || !isScoreDefined(match.awayScore) || match.status !== "FINISHED") {
      continue;
    }

    if (!tiedIds.has(match.homeTeam.id) || !tiedIds.has(match.awayTeam.id)) {
      continue;
    }

    const home = miniRows.get(match.homeTeam.id);
    const away = miniRows.get(match.awayTeam.id);

    if (!home || !away) {
      continue;
    }

    home.goalsFor += match.homeScore!;
    home.goalDifference += match.homeScore! - match.awayScore!;
    away.goalsFor += match.awayScore!;
    away.goalDifference += match.awayScore! - match.homeScore!;

    if (match.homeScore! > match.awayScore!) {
      home.points += config.pointsForWin;
      away.points += config.pointsForLoss;
    } else if (match.homeScore! < match.awayScore!) {
      away.points += config.pointsForWin;
      home.points += config.pointsForLoss;
    } else {
      home.points += config.pointsForDraw;
      away.points += config.pointsForDraw;
    }
  }

  return miniRows;
}

function compareRows(
  left: GroupStandingRow,
  right: GroupStandingRow,
  groupRows: GroupStandingRow[],
  groupMatches: TournamentEngineMatch[],
  config: TournamentConfig,
  options?: { useFifaRanking?: boolean },
) {
  const byPoints = right.points - left.points;
  if (byPoints) return byPoints;

  const byGoalDifference = right.goalDifference - left.goalDifference;
  if (byGoalDifference) return byGoalDifference;

  const byGoalsFor = right.goalsFor - left.goalsFor;
  if (byGoalsFor) return byGoalsFor;

  const tiedRows = groupRows.filter(
    (row) =>
      row.points === left.points &&
      row.goalDifference === left.goalDifference &&
      row.goalsFor === left.goalsFor,
  );

  if (tiedRows.length > 1) {
    const miniRows = calculateMiniTable(groupMatches, tiedRows, left.groupName, config);
    const leftMini = miniRows.get(left.teamId);
    const rightMini = miniRows.get(right.teamId);

    if (leftMini && rightMini) {
      const byMiniPoints = rightMini.points - leftMini.points;
      if (byMiniPoints) return byMiniPoints;

      const byMiniGoalDifference = rightMini.goalDifference - leftMini.goalDifference;
      if (byMiniGoalDifference) return byMiniGoalDifference;

      const byMiniGoalsFor = rightMini.goalsFor - leftMini.goalsFor;
      if (byMiniGoalsFor) return byMiniGoalsFor;
    }
  }

  // Fair play only applies when card data exists. Until timeline cards are
  // aggregated into team-level fair play, we keep the fallback deterministic.
  if (left.fairPlayScore !== null && left.fairPlayScore !== undefined && right.fairPlayScore !== null && right.fairPlayScore !== undefined) {
    const byFairPlay = left.fairPlayScore - right.fairPlayScore;
    if (byFairPlay) return byFairPlay;
  }

  if (options?.useFifaRanking && left.fifaRanking && right.fifaRanking) {
    const byFifaRanking = left.fifaRanking - right.fifaRanking;
    if (byFifaRanking) return byFifaRanking;
  }

  return stableRowFallback(left, right);
}

function sortGroupRows(
  rows: GroupStandingRow[],
  matches: TournamentEngineMatch[],
  config: TournamentConfig,
) {
  return [...rows]
    .sort((left, right) => compareRows(left, right, rows, matches, config))
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

function calculateRowsForGroup(
  groupName: string,
  teams: TournamentEngineTeam[],
  matches: TournamentEngineMatch[],
  config: TournamentConfig,
) {
  const rows = new Map<string, GroupStandingRow>();
  const groupMatches = matches.filter((match) => isGroupStageMatch(match, groupName));

  for (const team of teams) {
    rows.set(team.id, emptyRow({ ...team, groupName }, groupName));
  }

  for (const match of groupMatches) {
    if (!rows.has(match.homeTeam.id)) {
      rows.set(match.homeTeam.id, emptyRow({ ...match.homeTeam, groupName }, groupName));
    }

    if (!rows.has(match.awayTeam.id)) {
      rows.set(match.awayTeam.id, emptyRow({ ...match.awayTeam, groupName }, groupName));
    }

    if (match.status !== "FINISHED" || !isScoreDefined(match.homeScore) || !isScoreDefined(match.awayScore)) {
      continue;
    }

    addResult(rows.get(match.homeTeam.id)!, match.homeScore!, match.awayScore!, config);
    addResult(rows.get(match.awayTeam.id)!, match.awayScore!, match.homeScore!, config);
  }

  return {
    groupName,
    source: "internal" as const,
    rows: sortGroupRows([...rows.values()], groupMatches, config),
  };
}

export function calculateGroupStandings(
  matches: TournamentEngineMatch[],
  config: TournamentConfig = tournamentConfig,
) {
  const grouped = new Map<string, { teams: Map<string, TournamentEngineTeam>; matches: TournamentEngineMatch[] }>();

  for (const match of matches) {
    const groupName = match.groupName ?? match.homeTeam.groupName ?? match.awayTeam.groupName;

    if (!groupName || !isGroupStageMatch(match, groupName)) {
      continue;
    }

    const group = grouped.get(groupName) ?? { teams: new Map<string, TournamentEngineTeam>(), matches: [] };
    group.teams.set(match.homeTeam.id, { ...match.homeTeam, groupName });
    group.teams.set(match.awayTeam.id, { ...match.awayTeam, groupName });
    group.matches.push({ ...match, groupName });
    grouped.set(groupName, group);
  }

  return [...grouped.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([groupName, group]) =>
      calculateRowsForGroup(groupName, [...group.teams.values()], group.matches, config),
    );
}

export function calculateSeededGroupStandings(
  seededGroups: Array<{
    groupName: string;
    teams: TournamentEngineTeam[];
    matches: TournamentEngineMatch[];
  }>,
  config: TournamentConfig = tournamentConfig,
) {
  return seededGroups.map((seededGroup) =>
    calculateRowsForGroup(
      seededGroup.groupName,
      seededGroup.teams.map((team) => ({ ...team, groupName: seededGroup.groupName })),
      seededGroup.matches.map((match) => ({ ...match, groupName: seededGroup.groupName })),
      config,
    ),
  );
}

function isGroupComplete(group: GroupStanding, config: TournamentConfig) {
  return (
    group.rows.length === config.teamsPerGroup &&
    group.rows.every((row) => row.played === config.groupStageMatchesPerTeam)
  );
}

export function calculateBestThirdPlaces(
  standings: GroupStanding[],
  options: BestThirdOptions = {},
) {
  const config = options.config ?? tournamentConfig;

  return standings
    .flatMap((group) => group.rows.filter((row) => row.rank === config.directQualifiersPerGroup + 1))
    .sort((left, right) => compareRows(left, right, [left, right], [], config, { useFifaRanking: true }))
    .map((row, index) => ({
      ...row,
      thirdPlaceRank: index + 1,
    }));
}

export function determineQualifiedTeams(
  standings: GroupStanding[],
  options: DetermineQualifiedOptions = {},
) {
  const config = options.config ?? tournamentConfig;
  const liveProjection = options.liveProjection ?? false;
  const groupCompletionMap = new Map(standings.map((group) => [group.groupName, isGroupComplete(group, config)]));
  const allGroupsComplete =
    standings.length === config.groups &&
    standings.every((group) => groupCompletionMap.get(group.groupName));
  const rankedThirdRows = calculateBestThirdPlaces(standings, { config });
  const projectedBestThirdIds = new Set(
    rankedThirdRows.slice(0, config.bestThirdPlaces).map((row) => row.teamId),
  );

  return standings
    .flatMap((group) => {
      const complete = Boolean(groupCompletionMap.get(group.groupName));

      return group.rows.map((row) => {
        let qualifiedStatus: QualifiedStatus = "PENDING";

        if (row.rank <= config.directQualifiersPerGroup) {
          qualifiedStatus = complete ? "DIRECT" : liveProjection ? "PROJECTED_DIRECT" : "PENDING";
        } else if (row.rank === config.directQualifiersPerGroup + 1) {
          if (allGroupsComplete) {
            qualifiedStatus = projectedBestThirdIds.has(row.teamId) ? "BEST_THIRD" : "ELIMINATED";
          } else if (liveProjection && projectedBestThirdIds.has(row.teamId)) {
            qualifiedStatus = "PROJECTED_BEST_THIRD";
          } else {
            qualifiedStatus = "PENDING";
          }
        } else if (complete) {
          qualifiedStatus = "ELIMINATED";
        }

        const rankedThird = rankedThirdRows.find((thirdRow) => thirdRow.teamId === row.teamId);

        return {
          ...row,
          qualifiedStatus,
          thirdPlaceRank: rankedThird?.thirdPlaceRank,
        };
      });
    })
    .sort((left, right) => {
      const byGroup = left.groupName.localeCompare(right.groupName);
      if (byGroup) return byGroup;

      return left.rank - right.rank;
    });
}

export function validateGroupStageCompletenessFromSeededGroups(
  seededGroups: Array<{
    groupName: string;
    teams: TournamentEngineTeam[];
    matches: TournamentEngineMatch[];
  }>,
  config: TournamentConfig = tournamentConfig,
): GroupStageValidationReport {
  const warnings: string[] = [];
  const expectedMatchesPerGroup = (config.teamsPerGroup * (config.teamsPerGroup - 1)) / 2;
  const groups = seededGroups.map((group) => {
    const groupMatches = group.matches.filter((match) => isGroupStageMatch(match, group.groupName));
    const teamCounts = new Map(group.teams.map((team) => [team.id, 0]));
    const teamWarnings: string[] = [];

    for (const match of groupMatches) {
      teamCounts.set(match.homeTeam.id, (teamCounts.get(match.homeTeam.id) ?? 0) + 1);
      teamCounts.set(match.awayTeam.id, (teamCounts.get(match.awayTeam.id) ?? 0) + 1);
    }

    for (const team of group.teams) {
      const played = teamCounts.get(team.id) ?? 0;

      if (played !== config.groupStageMatchesPerTeam) {
        teamWarnings.push(`${team.name} tiene ${played} partidos programados en Grupo ${group.groupName}.`);
      }
    }

    if (group.teams.length !== config.teamsPerGroup) {
      warnings.push(`Grupo ${group.groupName} tiene ${group.teams.length} equipos; se esperaban ${config.teamsPerGroup}.`);
    }

    if (groupMatches.length !== expectedMatchesPerGroup) {
      warnings.push(
        `Grupo ${group.groupName} tiene ${groupMatches.length} partidos; se esperaban ${expectedMatchesPerGroup}.`,
      );
    }

    return {
      groupName: group.groupName,
      teamCount: group.teams.length,
      matchCount: groupMatches.length,
      complete:
        group.teams.length === config.teamsPerGroup &&
        groupMatches.length === expectedMatchesPerGroup &&
        teamWarnings.length === 0,
      teamWarnings,
    };
  });

  const groupsWithFourTeams = groups.filter((group) => group.teamCount === config.teamsPerGroup).length;
  const totalGroupStageMatches = groups.reduce((sum, group) => sum + group.matchCount, 0);

  if (seededGroups.length !== config.groups) {
    warnings.push(`Hay ${seededGroups.length} grupos cargados; se esperaban ${config.groups}.`);
  }

  if (totalGroupStageMatches !== config.totalGroupStageMatches) {
    warnings.push(
      `La fase de grupos tiene ${totalGroupStageMatches} partidos cargados; se esperaban ${config.totalGroupStageMatches}.`,
    );
  }

  return {
    isComplete:
      seededGroups.length === config.groups &&
      groupsWithFourTeams === config.groups &&
      totalGroupStageMatches === config.totalGroupStageMatches &&
      groups.every((group) => group.complete),
    totalGroups: seededGroups.length,
    groupsWithFourTeams,
    totalGroupStageMatches,
    expectedGroupStageMatches: config.totalGroupStageMatches,
    warnings: [...warnings, ...groups.flatMap((group) => group.teamWarnings)],
    groups,
  };
}

function roundLabel(roundKey: KnockoutRoundKey) {
  switch (roundKey) {
    case "ROUND_OF_32":
      return "Round of 32";
    case "ROUND_OF_16":
      return "Round of 16";
    case "QUARTER_FINALS":
      return "Quarterfinal";
    case "SEMI_FINALS":
      return "Semifinal";
    case "THIRD_PLACE":
      return "Third Place";
    case "FINAL":
      return "Final";
  }
}

function buildSeedMap(qualifiedTeams: Array<{ teamName: string; groupName: string; rank: number; qualifiedStatus?: QualifiedStatus }>) {
  const seeds = new Map<string, string>();
  let bestThirdIndex = 1;

  for (const team of qualifiedTeams) {
    if (team.rank === 1) {
      seeds.set(`1° Grupo ${team.groupName}`, team.teamName);
    } else if (team.rank === 2) {
      seeds.set(`2° Grupo ${team.groupName}`, team.teamName);
    } else if (team.qualifiedStatus === "BEST_THIRD" || team.qualifiedStatus === "PROJECTED_BEST_THIRD") {
      seeds.set(`Mejor 3° #${bestThirdIndex}`, team.teamName);
      bestThirdIndex += 1;
    }
  }

  return seeds;
}

export function generateKnockoutPlaceholder(
  qualifiedTeams: Array<{ teamName: string; groupName: string; rank: number; qualifiedStatus?: QualifiedStatus }>,
  config: TournamentConfig = tournamentConfig,
): KnockoutSlot[] {
  const seedMap = buildSeedMap(qualifiedTeams);
  const roundOf32 = defaultRoundOf32Blueprint.map((slot, index) => ({
    id: `r32-${index + 1}`,
    roundKey: "ROUND_OF_32" as const,
    round: roundLabel("ROUND_OF_32") as KnockoutSlot["round"],
    home: seedMap.get(slot.home) ?? slot.home,
    away: seedMap.get(slot.away) ?? slot.away,
  }));

  const laterRounds = [
    { id: "r16-1", roundKey: "ROUND_OF_16" as const, home: "Ganador Match 73", away: "Ganador Match 74" },
    { id: "r16-2", roundKey: "ROUND_OF_16" as const, home: "Ganador Match 75", away: "Ganador Match 76" },
    { id: "r16-3", roundKey: "ROUND_OF_16" as const, home: "Ganador Match 77", away: "Ganador Match 78" },
    { id: "r16-4", roundKey: "ROUND_OF_16" as const, home: "Ganador Match 79", away: "Ganador Match 80" },
    { id: "r16-5", roundKey: "ROUND_OF_16" as const, home: "Ganador Match 81", away: "Ganador Match 82" },
    { id: "r16-6", roundKey: "ROUND_OF_16" as const, home: "Ganador Match 83", away: "Ganador Match 84" },
    { id: "r16-7", roundKey: "ROUND_OF_16" as const, home: "Ganador Match 85", away: "Ganador Match 86" },
    { id: "r16-8", roundKey: "ROUND_OF_16" as const, home: "Ganador Match 87", away: "Ganador Match 88" },
    { id: "qf-1", roundKey: "QUARTER_FINALS" as const, home: "Ganador Match 89", away: "Ganador Match 90" },
    { id: "qf-2", roundKey: "QUARTER_FINALS" as const, home: "Ganador Match 91", away: "Ganador Match 92" },
    { id: "qf-3", roundKey: "QUARTER_FINALS" as const, home: "Ganador Match 93", away: "Ganador Match 94" },
    { id: "qf-4", roundKey: "QUARTER_FINALS" as const, home: "Ganador Match 95", away: "Ganador Match 96" },
    { id: "sf-1", roundKey: "SEMI_FINALS" as const, home: "Ganador Match 97", away: "Ganador Match 98" },
    { id: "sf-2", roundKey: "SEMI_FINALS" as const, home: "Ganador Match 99", away: "Ganador Match 100" },
    { id: "third-place", roundKey: "THIRD_PLACE" as const, home: "Perdedor Match 101", away: "Perdedor Match 102", locked: true },
    { id: "final", roundKey: "FINAL" as const, home: "Ganador Match 101", away: "Ganador Match 102", locked: true },
  ].map((slot) => ({
    ...slot,
    round: roundLabel(slot.roundKey) as KnockoutSlot["round"],
  }));

  return [...roundOf32, ...laterRounds].filter((slot) => {
    if (slot.roundKey === "ROUND_OF_32") return true;

    return config.knockoutRounds.includes(slot.roundKey);
  });
}

export function advanceWinner(match: {
  home?: string;
  away?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  extraTimeHomeScore?: number | null;
  extraTimeAwayScore?: number | null;
  penaltiesHomeScore?: number | null;
  penaltiesAwayScore?: number | null;
  status?: MatchStatus;
}) {
  if (!match.home || !match.away || match.status !== "FINISHED") {
    return null;
  }

  if (!isScoreDefined(match.homeScore) || !isScoreDefined(match.awayScore)) {
    return null;
  }

  let homeTotal = match.homeScore!;
  let awayTotal = match.awayScore!;

  if (homeTotal !== awayTotal) {
    return homeTotal > awayTotal ? match.home : match.away;
  }

  if (isScoreDefined(match.extraTimeHomeScore) && isScoreDefined(match.extraTimeAwayScore)) {
    homeTotal += match.extraTimeHomeScore!;
    awayTotal += match.extraTimeAwayScore!;

    if (homeTotal !== awayTotal) {
      return homeTotal > awayTotal ? match.home : match.away;
    }
  }

  if (isScoreDefined(match.penaltiesHomeScore) && isScoreDefined(match.penaltiesAwayScore)) {
    if (match.penaltiesHomeScore === match.penaltiesAwayScore) {
      return null;
    }

    return match.penaltiesHomeScore! > match.penaltiesAwayScore! ? match.home : match.away;
  }

  return null;
}
