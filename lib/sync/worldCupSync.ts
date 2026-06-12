import {
  fetchEventById,
  fetchPlayersByTeamId,
  fetchWorldCupTable,
  fetchWorldCupEvents,
  type TheSportsDbEvent,
  normalizeTheSportsDbEvent,
  normalizeTheSportsDbPlayer,
} from "@/lib/integrations/theSportsDb";
import { syncMatchTimeline } from "@/lib/matches/matchTimeline";
import { prisma } from "@/lib/prisma";
import { recalculateUserLeaguePoints } from "@/lib/rankings";
import { calculatePredictionPointsFromScores } from "@/lib/scoring";
import { assignWorldCupMatchesToOfficialGroups } from "@/lib/tournament/officialGroupsService";
import type { NormalizedMatch, NormalizedTeam } from "@/lib/types";

type SyncResult = {
  ok: boolean;
  fetched: number;
  normalized: number;
  matchesUpserted: number;
  teamsUpserted: number;
  predictionsRecalculated: number;
  playersUpserted: number;
  tableRowsFetched: number;
  matchesGrouped: number;
  timelineMatchesSynced?: number;
  timelineEventsStored?: number;
  message: string;
};

function codeFromTeam(team: NormalizedTeam) {
  const base = team.shortName || team.name.slice(0, 3).toUpperCase();
  return team.externalId ? `${base}-${team.externalId}`.slice(0, 24) : base.slice(0, 24);
}

export function buildTeamSyncUpdate(
  existing: {
    code: string;
    flag: string;
    group: string;
    groupId?: string | null;
    isPlaceholder?: boolean;
    placeholderType?: string | null;
    replacedByTeamId?: string | null;
  } | null,
  team: NormalizedTeam,
) {
  return {
    name: team.name,
    shortName: team.shortName,
    flagUrl: team.flagUrl,
    group: existing?.groupId ? existing.group : (team.groupName ?? existing?.group ?? ""),
    code: existing?.code || codeFromTeam(team),
    flag: existing?.flag || "🏳️",
    externalId: team.externalId,
    externalProvider: team.externalProvider,
    ...(existing?.groupId ? { groupId: existing.groupId } : {}),
    ...(existing?.isPlaceholder !== undefined ? { isPlaceholder: existing.isPlaceholder } : {}),
    ...(existing?.placeholderType !== undefined ? { placeholderType: existing.placeholderType } : {}),
    ...(existing?.replacedByTeamId !== undefined ? { replacedByTeamId: existing.replacedByTeamId } : {}),
  };
}

async function findOrCreateTeam(team: NormalizedTeam) {
  const existing = team.externalId
    ? await prisma.team.findFirst({
        where: {
          externalProvider: team.externalProvider,
          externalId: team.externalId,
        },
      })
    : await prisma.team.findFirst({
        where: {
          externalProvider: team.externalProvider,
          name: team.name,
        },
      });

  if (existing) {
    return prisma.team.update({
      where: { id: existing.id },
      data: buildTeamSyncUpdate(existing, team),
    });
  }

  return prisma.team.create({
    data: {
      name: team.name,
      code: codeFromTeam(team),
      shortName: team.shortName,
      flag: "🏳️",
      flagUrl: team.flagUrl,
      group: team.groupName ?? "",
      externalId: team.externalId,
      externalProvider: team.externalProvider,
    },
  });
}

async function syncPlayersForTeam(teamId: string, dbTeamId: string) {
  const externalPlayers = await fetchPlayersByTeamId(teamId);
  let count = 0;

  for (const externalPlayer of externalPlayers.slice(0, 26)) {
    const player = normalizeTheSportsDbPlayer(externalPlayer);

    if (!player) continue;

    const existing = await prisma.player.findFirst({
      where: {
        externalProvider: player.externalProvider,
        externalId: player.externalId,
      },
    });

    const data = {
      externalProvider: player.externalProvider,
      externalId: player.externalId,
      name: player.name,
      teamId: dbTeamId,
      position: player.position,
      price: player.price,
      avatar: player.avatar,
      photoUrl: player.photoUrl,
    };

    if (existing) {
      await prisma.player.update({ where: { id: existing.id }, data });
    } else {
      await prisma.player.create({ data });
    }

    count += 1;
  }

  return count;
}

async function recalculatePredictions(matchId: string, match: NormalizedMatch) {
  if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) {
    return 0;
  }

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
  });
  const goals = await prisma.matchEvent.findMany({
    where: { matchId, eventType: "GOAL" },
    select: { playerName: true },
  });
  const actualScorers = goals.map((goal) => goal.playerName).filter((playerName): playerName is string => Boolean(playerName));

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
            actualScorers,
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

async function upsertMatch(match: NormalizedMatch) {
  const [homeTeam, awayTeam] = await Promise.all([
    findOrCreateTeam(match.homeTeam),
    findOrCreateTeam(match.awayTeam),
  ]);

  const existing = await prisma.match.findFirst({
    where: {
      externalProvider: match.externalProvider,
      externalId: match.externalId,
    },
  });

  const data = {
    externalId: match.externalId,
    externalProvider: match.externalProvider,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    matchDate: match.matchDate,
    status: match.status,
    groupName: match.groupName,
    stage: match.stage,
    stadiumName: match.stadium,
    city: match.city,
    country: match.country,
    lastSyncedAt: match.lastSyncedAt,
  };

  const saved = existing
    ? await prisma.match.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.match.create({
        data,
      });

  const predictionsRecalculated = await recalculatePredictions(saved.id, match);

  return { match: saved, predictionsRecalculated, homeTeam, awayTeam };
}

function shouldRefreshEventById(match: NormalizedMatch) {
  return match.status === "LIVE" || match.status === "UNKNOWN";
}

async function normalizeFreshEvent(event: TheSportsDbEvent) {
  const normalized = normalizeTheSportsDbEvent(event);

  if (!normalized) {
    return null;
  }

  if (!event.idEvent || !shouldRefreshEventById(normalized)) {
    return normalized;
  }

  const freshEvent = await fetchEventById(event.idEvent, { noStore: true });

  return normalizeTheSportsDbEvent(freshEvent ?? event);
}

export async function syncWorldCupFromTheSportsDb(options?: { includeTimeline?: boolean }): Promise<SyncResult> {
  const startedAt = new Date();
  const [events, tableRows] = await Promise.all([
    fetchWorldCupEvents({ noStore: true }),
    fetchWorldCupTable({ noStore: true }),
  ]);
  const groupByTeamName = new Map(
    tableRows
      .filter((row) => row.strTeam && row.strGroup)
      .map((row) => [row.strTeam!, row.strGroup!]),
  );
  const baseNormalized = (await Promise.all(events.map((event) => normalizeFreshEvent(event))))
    .filter((event): event is NormalizedMatch => Boolean(event));
  const normalized: NormalizedMatch[] = baseNormalized.map((match) => {
      const homeGroup = groupByTeamName.get(match.homeTeam.name);
      const awayGroup = groupByTeamName.get(match.awayTeam.name);
      const groupName = match.groupName ?? (homeGroup && homeGroup === awayGroup ? homeGroup : undefined);

      return {
        ...match,
        groupName,
        homeTeam: { ...match.homeTeam, groupName: homeGroup },
        awayTeam: { ...match.awayTeam, groupName: awayGroup },
      };
    });

  if (!events.length) {
    const message = "TheSportsDB no devolvio eventos. Se conservan los datos existentes.";

    await prisma.syncLog.create({
      data: {
        provider: "THESPORTSDB",
        type: "WORLD_CUP_EVENTS",
        status: "EMPTY",
        message,
      },
    });

    return {
      ok: false,
      fetched: 0,
      normalized: 0,
      matchesUpserted: 0,
      teamsUpserted: 0,
      predictionsRecalculated: 0,
      playersUpserted: 0,
      tableRowsFetched: tableRows.length,
      matchesGrouped: 0,
      timelineMatchesSynced: 0,
      timelineEventsStored: 0,
      message,
    };
  }

  let matchesUpserted = 0;
  let predictionsRecalculated = 0;
  let playersUpserted = 0;
  const syncedTeams = new Set<string>();
  const timelineCandidates: string[] = [];

  for (const match of normalized) {
    const result = await upsertMatch(match);
    matchesUpserted += 1;
    predictionsRecalculated += result.predictionsRecalculated;
    if (options?.includeTimeline && (match.status === "LIVE" || match.status === "FINISHED")) {
      timelineCandidates.push(result.match.id);
    }

    const teamPairs = [
      { externalId: match.homeTeam.externalId, dbId: result.homeTeam.id },
      { externalId: match.awayTeam.externalId, dbId: result.awayTeam.id },
    ];

    for (const pair of teamPairs) {
      if (!pair.externalId || syncedTeams.has(pair.externalId)) continue;

      syncedTeams.add(pair.externalId);
      playersUpserted += await syncPlayersForTeam(pair.externalId, pair.dbId);
    }
  }

  const matchesGrouped = await assignWorldCupMatchesToOfficialGroups();
  let timelineMatchesSynced = 0;
  let timelineEventsStored = 0;

  if (options?.includeTimeline) {
    for (const matchId of timelineCandidates) {
      const timelineResult = await syncMatchTimeline(matchId);
      timelineMatchesSynced += 1;
      timelineEventsStored += timelineResult.stored;
    }
  }

  const message = `Sync completado: ${matchesUpserted} partidos, ${playersUpserted} jugadores, ${tableRows.length} filas de tabla, ${matchesGrouped} partidos agrupados${options?.includeTimeline ? ` y ${timelineEventsStored} eventos timeline` : ""}.`;

  await prisma.syncLog.create({
    data: {
      provider: "THESPORTSDB",
      type: "WORLD_CUP_EVENTS",
      status: "SUCCESS",
      message: `${message} Inicio: ${startedAt.toISOString()}`,
    },
  });

  return {
    ok: true,
    fetched: events.length,
    normalized: normalized.length,
    matchesUpserted,
    teamsUpserted: normalized.length * 2,
    predictionsRecalculated,
    playersUpserted,
    tableRowsFetched: tableRows.length,
    matchesGrouped,
    timelineMatchesSynced,
    timelineEventsStored,
    message,
  };
}

export async function getLatestWorldCupSyncLog() {
  return prisma.syncLog.findFirst({
    where: {
      provider: "THESPORTSDB",
      type: "WORLD_CUP_EVENTS",
    },
    orderBy: { createdAt: "desc" },
  });
}
