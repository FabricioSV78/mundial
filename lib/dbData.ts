import { prisma } from "@/lib/prisma";
import { buildTeamWinCounts, calculateFantasyPoints, getFantasyPointBreakdownForUser } from "@/lib/fantasy/fantasyScoring";
import { getOfficialKickoffDate } from "@/lib/officialKickoffs";
import { isMissingTableError } from "@/lib/prismaErrors";
import type { FantasyPointEntry, LeagueMember, LeagueSummary, Match, MatchEventItem, Player, Prediction, Stadium, Team } from "@/lib/types";

function toTeam(team: {
  id: string;
  name: string;
  code: string;
  shortName: string | null;
  flag: string;
  flagUrl: string | null;
  group: string;
  groupId: string | null;
  isPlaceholder: boolean;
  placeholderType: string | null;
  replacedByTeamId: string | null;
  externalId: string | null;
  externalProvider: string | null;
}): Team {
  return {
    id: team.id,
    name: team.name,
    code: team.shortName ?? team.code,
    shortName: team.shortName ?? team.code,
    flag: team.flag,
    flagUrl: team.flagUrl ?? undefined,
    group: team.group || "Sin grupo",
    groupId: team.groupId ?? undefined,
    isPlaceholder: team.isPlaceholder,
    placeholderType: team.placeholderType ?? undefined,
    replacedByTeamId: team.replacedByTeamId ?? undefined,
    externalId: team.externalId ?? undefined,
    externalProvider: team.externalProvider === "THESPORTSDB" ? "THESPORTSDB" : "MANUAL",
  };
}

const venueMeta: Record<string, { city: string; country: string; lat: number; lng: number; capacity: number }> = {
  "Estadio Azteca": { city: "Mexico City", country: "Mexico", lat: 19.3029, lng: -99.1505, capacity: 83000 },
  "Estadio Akron": { city: "Guadalajara", country: "Mexico", lat: 20.6817, lng: -103.4626, capacity: 48071 },
  "Estadio BBVA": { city: "Monterrey", country: "Mexico", lat: 25.6682, lng: -100.2441, capacity: 53500 },
  "BMO Field": { city: "Toronto", country: "Canada", lat: 43.6332, lng: -79.4186, capacity: 45500 },
  "BC Place": { city: "Vancouver", country: "Canada", lat: 49.2767, lng: -123.1119, capacity: 54500 },
  "SoFi Stadium": { city: "Los Angeles", country: "United States", lat: 33.9535, lng: -118.3392, capacity: 70240 },
  "MetLife Stadium": { city: "New York New Jersey", country: "United States", lat: 40.8135, lng: -74.0745, capacity: 82500 },
  "AT&T Stadium": { city: "Dallas", country: "United States", lat: 32.7473, lng: -97.0945, capacity: 94000 },
  "Levi's Stadium": { city: "San Francisco Bay Area", country: "United States", lat: 37.403, lng: -121.97, capacity: 68500 },
  "Gillette Stadium": { city: "Boston", country: "United States", lat: 42.0909, lng: -71.2643, capacity: 65878 },
  "Reliant Stadium": { city: "Houston", country: "United States", lat: 29.6847, lng: -95.4107, capacity: 72220 },
  "NRG Stadium": { city: "Houston", country: "United States", lat: 29.6847, lng: -95.4107, capacity: 72220 },
  "Lincoln Financial Field": { city: "Philadelphia", country: "United States", lat: 39.9008, lng: -75.1675, capacity: 67594 },
  "Lumen Field": { city: "Seattle", country: "United States", lat: 47.5952, lng: -122.3316, capacity: 68740 },
  "Hard Rock Stadium": { city: "Miami", country: "United States", lat: 25.958, lng: -80.2389, capacity: 65326 },
  "Mercedes-Benz Stadium": { city: "Atlanta", country: "United States", lat: 33.7554, lng: -84.4008, capacity: 71000 },
  "Arrowhead Stadium": { city: "Kansas City", country: "United States", lat: 39.049, lng: -94.4839, capacity: 76416 },
  "GEHA Field at Arrowhead Stadium": { city: "Kansas City", country: "United States", lat: 39.049, lng: -94.4839, capacity: 76416 },
};

const genericStadiumImage =
  "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80";

const stadiumImageByName: Record<string, string> = {
  "Estadio Azteca": "/stadiums/estadio-azteca.jpg",
  "Estadio Akron": "/stadiums/estadio-akron.jpg",
  "Estadio BBVA": "/stadiums/estadio-bbva.jpg",
  "BMO Field": "/stadiums/bmo-field.jpg",
  "BC Place": "/stadiums/bc-place.jpg",
  "SoFi Stadium": "/stadiums/sofi-stadium.jpg",
  "MetLife Stadium": "/stadiums/metlife-stadium.jpg",
  "AT&T Stadium": "/stadiums/att-stadium.jpg",
  "Levi's Stadium": "/stadiums/levis-stadium.jpg",
  "Gillette Stadium": "/stadiums/gillette-stadium.jpg",
  "Reliant Stadium": "/stadiums/nrg-stadium.jpg",
  "NRG Stadium": "/stadiums/nrg-stadium.jpg",
  "Lincoln Financial Field": "/stadiums/lincoln-financial-field.jpg",
  "Lumen Field": "/stadiums/lumen-field.jpg",
  "Hard Rock Stadium": "/stadiums/hard-rock-stadium.jpg",
  "Mercedes-Benz Stadium": "/stadiums/mercedes-benz-stadium.jpg",
  "Arrowhead Stadium": "/stadiums/arrowhead-stadium.jpg",
  "GEHA Field at Arrowhead Stadium": "/stadiums/arrowhead-stadium.jpg",
};

function stadiumFromMatch(match: { stadiumName: string | null; city: string | null; country: string | null }): Stadium {
  const name = match.stadiumName || "Sede por confirmar";
  const meta = venueMeta[name];
  const city = match.city ?? meta?.city ?? "Ciudad por confirmar";
  const country = match.country ?? meta?.country ?? "Pais por confirmar";
  const image = name === "Sede por confirmar" ? "" : (stadiumImageByName[name] ?? genericStadiumImage);

  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    city,
    country,
    capacity: meta?.capacity ?? 0,
    lat: meta?.lat ?? 39,
    lng: meta?.lng ?? -98,
    image,
    funFact: "",
  };
}

function correctedMatchDate(match: {
  matchDate: Date;
  stadiumName: string | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
}) {
  return getOfficialKickoffDate({
    homeTeamName: match.homeTeam.name,
    awayTeamName: match.awayTeam.name,
    stadiumName: match.stadiumName,
    matchDate: match.matchDate,
  }) ?? match.matchDate;
}

function toPlayerStats(player: {
  goals: number;
  assists: number;
  cleanSheets: number;
  saves: number;
  yellowCards: number;
  redCards: number;
  minutes: number;
}) {
  return {
    goals: player.goals,
    assists: player.assists,
    cleanSheets: player.cleanSheets,
    saves: player.saves,
    yellowCards: player.yellowCards,
    redCards: player.redCards,
    minutes: player.minutes,
  };
}

export async function getMatchesFromDb(): Promise<Match[]> {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { matchDate: "asc" },
      include: { homeTeam: true, awayTeam: true },
    });

    return matches.map((match) => {
      const displayDate = correctedMatchDate(match);

      return {
        id: match.id,
        externalId: match.externalId ?? undefined,
        externalProvider: match.externalProvider === "THESPORTSDB" ? "THESPORTSDB" : "MANUAL",
        homeTeam: toTeam(match.homeTeam),
        awayTeam: toTeam(match.awayTeam),
        date: displayDate.toISOString(),
        matchDate: displayDate.toISOString(),
        stadium: stadiumFromMatch(match),
        stadiumName: match.stadiumName ?? undefined,
        city: match.city ?? undefined,
        country: match.country ?? undefined,
        groupName: match.groupName ?? "Sin grupo",
        stage: match.stage ?? "Calendario",
        status: match.status,
        lastSyncedAt: match.lastSyncedAt?.toISOString(),
        result:
          match.homeScore !== null && match.awayScore !== null
            ? { homeGoals: match.homeScore, awayGoals: match.awayScore, scorer: match.scorer ?? undefined }
            : undefined,
      };
    });
  } catch (error) {
    console.error("[dbData] matches failed", error);
    return [];
  }
}

export async function getPlayersFromDb(): Promise<Player[]> {
  try {
    const [players, matches] = await Promise.all([
      prisma.player.findMany({
        orderBy: { name: "asc" },
        include: { team: true },
      }),
      prisma.match.findMany({
        select: {
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
          status: true,
        },
      }),
    ]);
    const teamWinCounts = buildTeamWinCounts(matches);

    return players.map((player) => ({
      id: player.id,
      name: player.name,
      teamId: player.teamId,
      country: player.team.name,
      countryCode: player.team.shortName ?? player.team.code,
      position: player.position,
      price: player.price,
      points: calculateFantasyPoints({ stats: toPlayerStats(player) }, { teamWins: teamWinCounts.get(player.teamId) ?? 0 }),
      avatar: player.avatar,
      photoUrl: player.photoUrl ?? undefined,
      stats: toPlayerStats(player),
    }));
  } catch (error) {
    console.error("[dbData] players failed", error);
    return [];
  }
}

export async function getPredictionsForUser(userId: string): Promise<Prediction[]> {
  try {
    const predictions = await prisma.prediction.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return predictions.map((prediction) => ({
      matchId: prediction.matchId,
      homeGoals: prediction.homeGoals,
      awayGoals: prediction.awayGoals,
      scorer: prediction.scorer ?? undefined,
      winnerTeamId: prediction.winnerTeamId ?? undefined,
    }));
  } catch (error) {
    console.error("[dbData] predictions failed", error);
    return [];
  }
}

export async function getStadiumsFromMatches(): Promise<Stadium[]> {
  const matches = await getMatchesFromDb();
  const stadiums = new Map<string, Stadium>();

  for (const match of matches) {
    stadiums.set(match.stadium.id, match.stadium);
  }

  return [...stadiums.values()].filter((stadium) => stadium.name !== "Sede por confirmar");
}

export async function getLeagueMembersFromDb(leagueId?: string): Promise<LeagueMember[]> {
  try {
    const members = await prisma.leagueMember.findMany({
      orderBy: { points: "desc" },
      where: leagueId ? { leagueId } : undefined,
      include: {
        user: {
          include: {
            predictions: true,
            fantasyPointLogs: true,
          },
        },
      },
    });

    return members.map((member, index) => {
      const predictionPoints = member.user.predictions.reduce((total, prediction) => total + prediction.points, 0);
      const fantasyPoints = member.user.fantasyPointLogs.reduce((total, log) => total + log.points, 0);

      return {
        id: member.id,
        name: member.user.name,
        username: member.user.username,
        avatar: member.user.name.slice(0, 2).toUpperCase(),
        country: member.user.favoriteCountry ?? "Sin pais",
        predictionPoints,
        fantasyPoints,
        weeklyPoints: member.points,
        movement: index === 0 ? 1 : 0,
      };
    });
  } catch (error) {
    if (isMissingTableError(error, "LeagueMember")) {
      console.warn("[dbData] league members skipped because LeagueMember table is missing in the current database.");
      return [];
    }

    console.error("[dbData] league members failed", error);
    return [];
  }
}

export async function getMatchByIdFromDb(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      return null;
    }

    const displayDate = correctedMatchDate(match);

    return {
      id: match.id,
      externalId: match.externalId ?? undefined,
      externalProvider: match.externalProvider === "THESPORTSDB" ? "THESPORTSDB" : "MANUAL",
      homeTeam: toTeam(match.homeTeam),
      awayTeam: toTeam(match.awayTeam),
      date: displayDate.toISOString(),
      matchDate: displayDate.toISOString(),
      stadium: stadiumFromMatch(match),
      stadiumName: match.stadiumName ?? undefined,
      city: match.city ?? undefined,
      country: match.country ?? undefined,
      groupName: match.groupName ?? "Sin grupo",
      stage: match.stage ?? "Calendario",
      status: match.status,
      lastSyncedAt: match.lastSyncedAt?.toISOString(),
      result:
        match.homeScore !== null && match.awayScore !== null
          ? { homeGoals: match.homeScore, awayGoals: match.awayScore, scorer: match.scorer ?? undefined }
          : undefined,
    } satisfies Match;
  } catch (error) {
    console.error("[dbData] match by id failed", error);
    return null;
  }
}

export async function getMatchEventsFromDb(matchId: string): Promise<MatchEventItem[]> {
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
      console.warn("[dbData] match events skipped because MatchEvent table is missing in the current database.");
      return [];
    }

    console.error("[dbData] match events failed", error);
    return [];
  }
}

export async function getFantasyPointEntriesForUser(userId: string): Promise<FantasyPointEntry[]> {
  try {
    const logs = await prisma.fantasyPointLog.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
    });

    return logs.map((log) => ({
      id: log.id,
      playerId: log.playerId,
      matchId: log.matchId,
      sourceType: log.sourceType,
      sourceEventId: log.sourceEventId ?? undefined,
      points: log.points,
      description: log.description,
      createdAt: log.createdAt.toISOString(),
    }));
  } catch (error) {
    if (isMissingTableError(error, "FantasyPointLog")) {
      console.warn("[dbData] fantasy point logs skipped because FantasyPointLog table is missing in the current database.");
      return [];
    }

    console.error("[dbData] fantasy point logs failed", error);
    return [];
  }
}

export { getFantasyPointBreakdownForUser };

export async function getUserPointsHistory(userId: string): Promise<Array<{ label: string; total: number; delta: number }>> {
  try {
    const [predictions, fantasyLogs] = await Promise.all([
      prisma.prediction.findMany({
        where: { userId, points: { not: 0 } },
        select: { points: true, updatedAt: true },
        orderBy: { updatedAt: "asc" },
      }),
      prisma.fantasyPointLog.findMany({
        where: { userId, points: { not: 0 } },
        select: { points: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const grouped = new Map<string, { date: Date; delta: number }>();

    for (const prediction of predictions) {
      const key = prediction.updatedAt.toISOString().slice(0, 10);
      const current = grouped.get(key) ?? { date: prediction.updatedAt, delta: 0 };
      current.delta += prediction.points;
      grouped.set(key, current);
    }

    for (const log of fantasyLogs) {
      const key = log.createdAt.toISOString().slice(0, 10);
      const current = grouped.get(key) ?? { date: log.createdAt, delta: 0 };
      current.delta += log.points;
      grouped.set(key, current);
    }

    let total = 0;
    const formatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", timeZone: "UTC" });

    return [...grouped.entries()]
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([, entry]) => {
        total += entry.delta;

        return {
          label: formatter.format(entry.date),
          total,
          delta: entry.delta,
        };
      });
  } catch (error) {
    if (isMissingTableError(error, "FantasyPointLog")) {
      console.warn("[dbData] user points history partially skipped because FantasyPointLog table is missing.");
      try {
        const predictions = await prisma.prediction.findMany({
          where: { userId, points: { not: 0 } },
          select: { points: true, updatedAt: true },
          orderBy: { updatedAt: "asc" },
        });
        let total = 0;
        const formatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", timeZone: "UTC" });

        return predictions.map((prediction) => {
          total += prediction.points;

          return {
            label: formatter.format(prediction.updatedAt),
            total,
            delta: prediction.points,
          };
        });
      } catch (predictionError) {
        console.error("[dbData] user points history failed", predictionError);
        return [];
      }
    }

    console.error("[dbData] user points history failed", error);
    return [];
  }
}

export async function getUserLeaguesFromDb(userId: string): Promise<LeagueSummary[]> {
  try {
    const memberships = await prisma.leagueMember.findMany({
      where: { userId },
      orderBy: { league: { createdAt: "asc" } },
      include: {
        league: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    return memberships.map((membership) => ({
      id: membership.league.id,
      name: membership.league.name,
      inviteCode: membership.league.inviteCode,
      memberCount: membership.league._count.members,
    }));
  } catch (error) {
    if (isMissingTableError(error, "LeagueMember")) {
      console.warn("[dbData] user leagues skipped because LeagueMember table is missing in the current database.");
      return [];
    }

    console.error("[dbData] user leagues failed", error);
    return [];
  }
}
