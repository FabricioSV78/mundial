import { prisma } from "@/lib/prisma";
import type { FantasyPointEntry, MatchEventItem, Player } from "@/lib/types";

export const fantasyScoringRules = {
  goal: 3,
  teamWin: 2,
  redCard: -3,
} as const;

export function calculateFantasyPoints(player: Pick<Player, "stats">, options?: { teamWon?: boolean; teamWins?: number }) {
  const teamWins = options?.teamWins ?? (options?.teamWon ? 1 : 0);

  return (
    player.stats.goals * fantasyScoringRules.goal +
    teamWins * fantasyScoringRules.teamWin +
    player.stats.redCards * fantasyScoringRules.redCard
  );
}

export function buildTeamWinCounts(
  matches: Array<{
    status: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
  }>,
) {
  const wins = new Map<string, number>();

  for (const match of matches) {
    if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) {
      continue;
    }

    if (match.homeScore === match.awayScore) {
      continue;
    }

    const winnerTeamId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
    wins.set(winnerTeamId, (wins.get(winnerTeamId) ?? 0) + 1);
  }

  return wins;
}

type FantasyMatchContext = {
  id: string;
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
};

type FantasySelection = {
  userId: string;
  fantasyTeamId: string;
  playerId: string;
  playerName: string;
  teamId: string;
};

type FantasyPointLogDraft = {
  userId: string;
  fantasyTeamId: string;
  playerId: string;
  matchId: string;
  sourceType: "GOAL" | "TEAM_WIN" | "RED_CARD";
  sourceEventId?: string;
  sourceKey: string;
  points: number;
  description: string;
};

function resolveWinnerTeamId(match: FantasyMatchContext) {
  if (
    match.status !== "FINISHED" ||
    match.homeScore === null ||
    match.awayScore === null ||
    match.homeScore === match.awayScore
  ) {
    return null;
  }

  return match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
}

export function buildFantasyPointEntriesForMatch(
  match: FantasyMatchContext,
  events: MatchEventItem[],
  selections: FantasySelection[],
) {
  const winnerTeamId = resolveWinnerTeamId(match);
  const entries: FantasyPointLogDraft[] = [];

  for (const selection of selections) {
    const isInMatch = selection.teamId === match.homeTeamId || selection.teamId === match.awayTeamId;

    if (!isInMatch) {
      continue;
    }

    const playerGoalEvents = events.filter((event) => event.eventType === "GOAL" && event.playerId === selection.playerId);
    const playerRedCardEvents = events.filter((event) => event.eventType === "RED_CARD" && event.playerId === selection.playerId);

    for (const event of playerGoalEvents) {
      entries.push({
        userId: selection.userId,
        fantasyTeamId: selection.fantasyTeamId,
        playerId: selection.playerId,
        matchId: match.id,
        sourceType: "GOAL",
        sourceEventId: event.id,
        sourceKey: `${match.id}:${selection.playerId}:GOAL:${event.id}`,
        points: fantasyScoringRules.goal,
        description: `${selection.playerName} marco un gol al ${event.minute ?? "?"}.`,
      });
    }

    if (winnerTeamId && selection.teamId === winnerTeamId) {
      entries.push({
        userId: selection.userId,
        fantasyTeamId: selection.fantasyTeamId,
        playerId: selection.playerId,
        matchId: match.id,
        sourceType: "TEAM_WIN",
        sourceKey: `${match.id}:${selection.playerId}:TEAM_WIN`,
        points: fantasyScoringRules.teamWin,
        description: `${selection.playerName} gano el partido con su seleccion.`,
      });
    }

    for (const event of playerRedCardEvents) {
      entries.push({
        userId: selection.userId,
        fantasyTeamId: selection.fantasyTeamId,
        playerId: selection.playerId,
        matchId: match.id,
        sourceType: "RED_CARD",
        sourceEventId: event.id,
        sourceKey: `${match.id}:${selection.playerId}:RED_CARD:${event.id}`,
        points: fantasyScoringRules.redCard,
        description: `${selection.playerName} recibio tarjeta roja al ${event.minute ?? "?"}.`,
      });
    }
  }

  return entries;
}

export async function calculateFantasyPointsForMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      events: true,
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (!match) {
    throw new Error("MATCH_NOT_FOUND");
  }

  const fantasyTeams = await prisma.fantasyTeam.findMany({
    include: {
      user: true,
      slots: {
        include: {
          player: true,
        },
      },
    },
  });

  const entries = buildFantasyPointEntriesForMatch(
    {
      id: match.id,
      status: match.status,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    },
    match.events.map((event) => ({
      id: event.id,
      matchId: event.matchId,
      externalId: event.externalId,
      externalProvider: event.externalProvider === "THESPORTSDB" ? "THESPORTSDB" : "MANUAL",
      minute: event.minute ?? undefined,
      eventType: event.eventType,
      playerId: event.playerId ?? undefined,
      playerName: event.playerName ?? undefined,
      teamId: event.teamId ?? undefined,
      teamName: event.teamName ?? undefined,
      rawPayload: event.rawPayload,
    })),
    fantasyTeams.flatMap((fantasyTeam) =>
      fantasyTeam.slots.map((slot) => ({
        userId: fantasyTeam.userId,
        fantasyTeamId: fantasyTeam.id,
        playerId: slot.playerId,
        playerName: slot.player.name,
        teamId: slot.player.teamId,
      })),
    ),
  );

  return {
    match,
    entries,
  };
}

export async function getFantasyPointBreakdownForUser(userId: string) {
  const fantasyTeam = await prisma.fantasyTeam.findFirst({
    where: { userId },
    include: {
      slots: {
        include: {
          player: true,
        },
      },
    },
  });

  if (!fantasyTeam) {
    return new Map<string, { total: number; entries: FantasyPointEntry[] }>();
  }

  const logs = await prisma.fantasyPointLog.findMany({
    where: { userId, fantasyTeamId: fantasyTeam.id },
    orderBy: [{ createdAt: "desc" }],
  });

  const map = new Map<string, { total: number; entries: FantasyPointEntry[] }>();

  for (const slot of fantasyTeam.slots) {
    map.set(slot.playerId, { total: 0, entries: [] });
  }

  for (const log of logs) {
    const existing = map.get(log.playerId) ?? { total: 0, entries: [] };
    existing.total += log.points;
    existing.entries.push({
      id: log.id,
      playerId: log.playerId,
      matchId: log.matchId,
      sourceType: log.sourceType,
      sourceEventId: log.sourceEventId ?? undefined,
      points: log.points,
      description: log.description,
      createdAt: log.createdAt.toISOString(),
    });
    map.set(log.playerId, existing);
  }

  return map;
}
