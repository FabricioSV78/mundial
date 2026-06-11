import { fetchEventTimeline } from "@/lib/integrations/theSportsDb";
import { calculateFantasyPointsForMatch, fantasyScoringRules } from "@/lib/fantasy/fantasyScoring";
import { prisma } from "@/lib/prisma";
import { isMissingTableError } from "@/lib/prismaErrors";
import { recalculateUserLeaguePoints } from "@/lib/rankings";
import { calculatePredictionPointsFromScores } from "@/lib/scoring";
import type { MatchEventItem } from "@/lib/types";

export function normalizeLookupText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesNormalizedName(left?: string | null, right?: string | null) {
  return Boolean(normalizeLookupText(left) && normalizeLookupText(left) === normalizeLookupText(right));
}

export function buildStableTimelineExternalId(
  matchExternalId: string,
  event: {
    externalId?: string;
    minute?: number;
    eventType: string;
    playerName?: string;
    teamName?: string;
  },
) {
  if (event.externalId) {
    return event.externalId;
  }

  return [
    matchExternalId,
    event.minute ?? "na",
    event.eventType,
    normalizeLookupText(event.playerName) || "na",
    normalizeLookupText(event.teamName) || "na",
  ].join(":");
}

function resolveTeamForEvent(
  match: {
    homeTeam: { id: string; name: string; externalId: string | null };
    awayTeam: { id: string; name: string; externalId: string | null };
  },
  teamName?: string,
  teamExternalId?: string,
) {
  if (teamExternalId && match.homeTeam.externalId === teamExternalId) {
    return { id: match.homeTeam.id, name: match.homeTeam.name };
  }

  if (teamExternalId && match.awayTeam.externalId === teamExternalId) {
    return { id: match.awayTeam.id, name: match.awayTeam.name };
  }

  const normalizedTeamName = normalizeLookupText(teamName);

  if (normalizedTeamName && normalizeLookupText(match.homeTeam.name) === normalizedTeamName) {
    return { id: match.homeTeam.id, name: match.homeTeam.name };
  }

  if (normalizedTeamName && normalizeLookupText(match.awayTeam.name) === normalizedTeamName) {
    return { id: match.awayTeam.id, name: match.awayTeam.name };
  }

  return null;
}

export async function findOrLinkPlayerByName(playerName?: string | null, teamName?: string | null) {
  if (!playerName?.trim()) {
    return null;
  }

  const exactPlayer = await prisma.player.findFirst({
    where: {
      name: playerName.trim(),
      ...(teamName?.trim()
        ? {
            team: {
              name: teamName.trim(),
            },
          }
        : {}),
    },
    include: { team: true },
  });

  if (exactPlayer) {
    return exactPlayer;
  }

  const candidates = await prisma.player.findMany({
    where: teamName?.trim()
      ? {
          team: {
            name: teamName.trim(),
          },
        }
      : undefined,
    include: { team: true },
  });

  return candidates.find((player) => matchesNormalizedName(player.name, playerName)) ?? null;
}

async function recalculatePlayerTournamentStats(teamIds: string[]) {
  if (!teamIds.length) {
    return;
  }

  const [players, events, matches] = await Promise.all([
    prisma.player.findMany({
      where: { teamId: { in: teamIds } },
    }),
    prisma.matchEvent.findMany({
      where: {
        OR: [{ player: { teamId: { in: teamIds } } }, { teamId: { in: teamIds } }],
      },
    }),
    prisma.match.findMany({
      select: {
        status: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    }),
  ]);

  const teamWinCounts = new Map<string, number>();

  for (const match of matches) {
    if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) {
      continue;
    }

    if (match.homeScore === match.awayScore) {
      continue;
    }

    const winnerTeamId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
    teamWinCounts.set(winnerTeamId, (teamWinCounts.get(winnerTeamId) ?? 0) + 1);
  }

  for (const player of players) {
    const goalCount = events.filter((event) => event.playerId === player.id && event.eventType === "GOAL").length;
    const redCardCount = events.filter((event) => event.playerId === player.id && event.eventType === "RED_CARD").length;
    const teamWins = teamWinCounts.get(player.teamId) ?? 0;
    const points =
      goalCount * fantasyScoringRules.goal +
      teamWins * fantasyScoringRules.teamWin +
      redCardCount * fantasyScoringRules.redCard;

    await prisma.player.update({
      where: { id: player.id },
      data: {
        goals: goalCount,
        redCards: redCardCount,
        points,
      },
    });
  }
}

export async function getMatchTimeline(matchId: string): Promise<MatchEventItem[]> {
  try {
    const events = await prisma.matchEvent.findMany({
      where: { matchId },
      orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
    });

    return events.map((event) => ({
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
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }));
  } catch (error) {
    if (isMissingTableError(error, "MatchEvent")) {
      console.warn("[matchTimeline] match timeline skipped because MatchEvent table is missing in the current database.");
      return [];
    }

    throw error;
  }
}

export function summarizeScorers(goals: Array<Pick<MatchEventItem, "playerName" | "teamName" | "minute">>) {
  const scorers = new Map<string, { playerName: string; teamName: string; goals: number; minutes: number[] }>();

  for (const goal of goals) {
    const key = `${goal.playerName ?? "desconocido"}:${goal.teamName ?? "sin-equipo"}`;
    const current = scorers.get(key) ?? {
      playerName: goal.playerName ?? "Jugador no vinculado",
      teamName: goal.teamName ?? "Equipo no identificado",
      goals: 0,
      minutes: [],
    };
    current.goals += 1;
    if (typeof goal.minute === "number") {
      current.minutes.push(goal.minute);
    }
    scorers.set(key, current);
  }

  return [...scorers.values()];
}

export async function getMatchScorers(matchId: string) {
  try {
    const goals = await prisma.matchEvent.findMany({
      where: { matchId, eventType: "GOAL" },
      orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
    });

    return summarizeScorers(
      goals.map((goal) => ({
        playerName: goal.playerName ?? undefined,
        teamName: goal.teamName ?? undefined,
        minute: goal.minute ?? undefined,
      })),
    );
  } catch (error) {
    if (isMissingTableError(error, "MatchEvent")) {
      console.warn("[matchTimeline] scorers skipped because MatchEvent table is missing in the current database.");
      return [];
    }

    throw error;
  }
}

export async function recalculateFantasyForMatch(matchId: string) {
  await prisma.fantasyPointLog.deleteMany({ where: { matchId } });
  const { entries } = await calculateFantasyPointsForMatch(matchId);

  if (entries.length) {
    await prisma.fantasyPointLog.createMany({
      data: entries,
    });
  }

  const affectedUsers = [...new Set(entries.map((entry) => entry.userId))];
  await Promise.all(affectedUsers.map((userId) => recalculateUserLeaguePoints(userId)));

  return {
    created: entries.length,
    affectedUsers: affectedUsers.length,
  };
}

async function recalculatePredictionsForStoredMatch(match: {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  scorer: string | null;
  status: string;
}) {
  if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) {
    return 0;
  }

  const predictions = await prisma.prediction.findMany({
    where: { matchId: match.id },
  });

  await Promise.all(
    predictions.map((prediction) =>
      prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          points: calculatePredictionPointsFromScores({
            actualHome: match.homeScore!,
            actualAway: match.awayScore!,
            predictedHome: prediction.homeGoals,
            predictedAway: prediction.awayGoals,
            actualScorer: match.scorer,
            predictedScorer: prediction.scorer,
          }),
        },
      }),
    ),
  );

  await Promise.all(
    [...new Set(predictions.map((prediction) => prediction.userId))].map((userId) =>
      recalculateUserLeaguePoints(userId),
    ),
  );

  return predictions.length;
}

export async function syncMatchTimeline(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (!match) {
    throw new Error("MATCH_NOT_FOUND");
  }

  if (!match.externalId) {
    return {
      matchId,
      fetched: 0,
      stored: 0,
      goals: 0,
      redCards: 0,
      unlinkedPlayers: 0,
      message: "El partido no tiene idEvent externo para consultar timeline.",
    };
  }

  const timeline = await fetchEventTimeline(match.externalId);
  let stored = 0;
  let goals = 0;
  let redCards = 0;
  let unlinkedPlayers = 0;

  for (const rawEvent of timeline) {
    const resolvedTeam = resolveTeamForEvent(match, rawEvent.teamName, rawEvent.teamExternalId);
    const linkedPlayer = await findOrLinkPlayerByName(rawEvent.playerName, resolvedTeam?.name ?? rawEvent.teamName);
    const externalId = buildStableTimelineExternalId(match.externalId, rawEvent);

    if (rawEvent.eventType === "GOAL") {
      goals += 1;
    }

    if (rawEvent.eventType === "RED_CARD") {
      redCards += 1;
    }

    if (!linkedPlayer && rawEvent.playerName) {
      unlinkedPlayers += 1;
    }

    await prisma.matchEvent.upsert({
      where: {
        externalProvider_externalId: {
          externalProvider: "THESPORTSDB",
          externalId,
        },
      },
      update: {
        minute: rawEvent.minute ?? null,
        eventType: rawEvent.eventType,
        playerId: linkedPlayer?.id ?? null,
        playerName: linkedPlayer?.name ?? rawEvent.playerName ?? null,
        teamId: resolvedTeam?.id ?? linkedPlayer?.teamId ?? null,
        teamName: resolvedTeam?.name ?? rawEvent.teamName ?? linkedPlayer?.team.name ?? null,
        rawPayload: rawEvent.rawPayload,
      },
      create: {
        matchId: match.id,
        externalId,
        externalProvider: "THESPORTSDB",
        minute: rawEvent.minute ?? null,
        eventType: rawEvent.eventType,
        playerId: linkedPlayer?.id ?? null,
        playerName: linkedPlayer?.name ?? rawEvent.playerName ?? null,
        teamId: resolvedTeam?.id ?? linkedPlayer?.teamId ?? null,
        teamName: resolvedTeam?.name ?? rawEvent.teamName ?? linkedPlayer?.team.name ?? null,
        rawPayload: rawEvent.rawPayload,
      },
    });

    stored += 1;
  }

  const scorers = await getMatchScorers(match.id);
  const headlineScorer = [...scorers].sort((a, b) => b.goals - a.goals || (a.minutes[0] ?? 999) - (b.minutes[0] ?? 999))[0];

  await prisma.match.update({
    where: { id: match.id },
    data: {
      scorer: headlineScorer?.playerName ?? null,
    },
  });

  const predictionsUpdated = await recalculatePredictionsForStoredMatch({
    id: match.id,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    scorer: headlineScorer?.playerName ?? null,
    status: match.status,
  });
  await recalculatePlayerTournamentStats([match.homeTeamId, match.awayTeamId]);
  const fantasy = await recalculateFantasyForMatch(match.id);

  await prisma.syncLog.create({
    data: {
      provider: "THESPORTSDB",
      type: "MATCH_TIMELINE",
      status: "SUCCESS",
      message: `Timeline ${match.homeTeam.name} vs ${match.awayTeam.name}: ${stored} eventos, ${goals} goles, ${redCards} rojas, ${predictionsUpdated} pronosticos recalculados, ${fantasy.created} logs fantasy.`,
    },
  });

  return {
    matchId: match.id,
    fetched: timeline.length,
    stored,
    goals,
    redCards,
    unlinkedPlayers,
    fantasyLogs: fantasy.created,
    message: `Timeline sincronizado: ${stored} eventos guardados.`,
  };
}

export async function syncRecentMatchTimelines(matchId?: string) {
  const recentThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const matches = await prisma.match.findMany({
    where: matchId
      ? { id: matchId }
      : {
          externalId: { not: null },
          OR: [
            { status: "LIVE" },
            { status: "FINISHED" },
            { matchDate: { gte: recentThreshold } },
          ],
        },
    orderBy: { matchDate: "desc" },
  });

  const results = [];

  for (const match of matches) {
    results.push(await syncMatchTimeline(match.id));
  }

  return {
    ok: true,
    count: results.length,
    results,
    goals: results.reduce((total, result) => total + result.goals, 0),
    redCards: results.reduce((total, result) => total + result.redCards, 0),
    events: results.reduce((total, result) => total + result.stored, 0),
  };
}
