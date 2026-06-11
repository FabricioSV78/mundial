import type { MatchEventType, MatchStatus, NormalizedMatch, NormalizedTeam, Position } from "@/lib/types";
import { getOfficialKickoffDate } from "@/lib/officialKickoffs";

export type TheSportsDbEvent = {
  idEvent?: string | null;
  idHomeTeam?: string | null;
  idAwayTeam?: string | null;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  strTimestamp?: string | null;
  strStatus?: string | null;
  strProgress?: string | null;
  strRound?: string | null;
  strGroup?: string | null;
  strStage?: string | null;
  strVenue?: string | null;
  strCity?: string | null;
  strCountry?: string | null;
};

export type TheSportsDbTimelineEvent = {
  idTimeline?: string | null;
  idEvent?: string | null;
  idEventTeam?: string | null;
  idPlayer?: string | null;
  idTeam?: string | null;
  strTimeline?: string | null;
  strTimelineDetail?: string | null;
  strEvent?: string | null;
  strEventType?: string | null;
  strType?: string | null;
  strPlayer?: string | null;
  strPlayerIn?: string | null;
  strPlayerOut?: string | null;
  strAssist?: string | null;
  strTeam?: string | null;
  strTeamBadge?: string | null;
  intTime?: string | null;
  strTime?: string | null;
  strHome?: string | null;
  strAway?: string | null;
};

type EventsSeasonResponse = {
  events?: TheSportsDbEvent[] | null;
  event?: TheSportsDbEvent[] | null;
};

export type TheSportsDbPlayer = {
  idPlayer?: string | null;
  strPlayer?: string | null;
  strTeam2?: string | null;
  strNationality?: string | null;
  strPosition?: string | null;
  strThumb?: string | null;
  strCutout?: string | null;
};

type PlayersResponse = {
  player?: TheSportsDbPlayer[] | null;
};

type TimelineResponse = {
  timeline?: TheSportsDbTimelineEvent[] | null;
  event?: TheSportsDbTimelineEvent[] | null;
  events?: TheSportsDbTimelineEvent[] | null;
};

type LeagueTableResponse = {
  table?: Array<{
    strTeam?: string | null;
    idTeam?: string | null;
    intRank?: string | null;
    intPlayed?: string | null;
    intWin?: string | null;
    intDraw?: string | null;
    intLoss?: string | null;
    intGoalsFor?: string | null;
    intGoalsAgainst?: string | null;
    intGoalDifference?: string | null;
    intPoints?: string | null;
    strGroup?: string | null;
  }> | null;
};

const DEFAULT_BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";
const DEFAULT_LEAGUE_ID = "4429";
const DEFAULT_SEASON = "2026";
const PROVIDER = "THESPORTSDB" as const;

function getBaseUrl() {
  const configuredBaseUrl =
    process.env.THESPORTSDB_BASE_URL ?? process.env.THE_SPORTS_DB_BASE_URL;
  const apiKey = process.env.THESPORTSDB_API_KEY ?? process.env.THE_SPORTS_DB_API_KEY;
  const baseUrl = (configuredBaseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");

  if (!apiKey) {
    return baseUrl;
  }

  if (baseUrl.endsWith(`/${apiKey}`) || /\/json\/[^/]+$/.test(baseUrl)) {
    return baseUrl;
  }

  return `${baseUrl}/${apiKey}`;
}

function getLeagueId() {
  return process.env.THE_SPORTS_DB_WORLD_CUP_LEAGUE_ID ?? DEFAULT_LEAGUE_ID;
}

function getSeason() {
  return process.env.THE_SPORTS_DB_SEASON ?? DEFAULT_SEASON;
}

function parseScore(value?: string | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const score = Number.parseInt(value, 10);
  return Number.isFinite(score) ? score : null;
}

function parseMinute(value?: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/\d+/);
  const minute = match ? Number.parseInt(match[0], 10) : Number.NaN;
  return Number.isFinite(minute) ? minute : null;
}

function parseMatchDate(event: TheSportsDbEvent) {
  if (event.strTimestamp) {
    if (/[zZ]|[+-]\d{2}:\d{2}$/.test(event.strTimestamp)) {
      const date = new Date(event.strTimestamp);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    const utcDate = new Date(`${event.strTimestamp}Z`);

    if (!Number.isNaN(utcDate.getTime())) {
      return utcDate;
    }
  }

  const datePart = event.dateEvent;
  if (!datePart) {
    return null;
  }

  const timePart = event.strTime?.replace("T", "") || "00:00:00";
  const date = new Date(`${datePart}T${timePart.endsWith("Z") ? timePart : `${timePart}Z`}`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function inferStatus(event: TheSportsDbEvent, matchDate: Date): MatchStatus {
  const rawStatus = `${event.strStatus ?? ""} ${event.strProgress ?? ""}`.toLowerCase();
  const homeScore = parseScore(event.intHomeScore);
  const awayScore = parseScore(event.intAwayScore);
  const hasResult = homeScore !== null && awayScore !== null;

  if (rawStatus.includes("postpon")) {
    return "POSTPONED";
  }

  if (rawStatus.includes("cancel")) {
    return "CANCELLED";
  }

  if (
    rawStatus.includes("match finished") ||
    rawStatus.includes("finished") ||
    rawStatus.includes("ft") ||
    rawStatus.includes("full")
  ) {
    return "FINISHED";
  }

  if (rawStatus.includes("live") || rawStatus.includes("1h") || rawStatus.includes("2h")) {
    return "LIVE";
  }

  if (hasResult) {
    return "FINISHED";
  }

  return matchDate.getTime() > Date.now() ? "SCHEDULED" : "UNKNOWN";
}

function toShortName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function normalizeTeam(name: string, externalId?: string | null, flagUrl?: string | null): NormalizedTeam {
  return {
    externalId: externalId ?? undefined,
    name,
    shortName: toShortName(name),
    flagUrl: flagUrl ?? undefined,
    externalProvider: PROVIDER,
  };
}

async function getJson<T>(url: string, options?: { noStore?: boolean }): Promise<T | null> {
  try {
    const response = await fetch(url, {
      ...(options?.noStore ? { cache: "no-store" as const } : { next: { revalidate: 60 * 15 } }),
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      console.error(`[TheSportsDB] ${response.status} ${response.statusText}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("[TheSportsDB] request failed", error);
    return null;
  }
}

function normalizeEventType(...values: Array<string | null | undefined>): MatchEventType {
  const normalized = values
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();

  if (normalized.includes("goal")) {
    return "GOAL";
  }

  if (normalized.includes("red")) {
    return "RED_CARD";
  }

  if (normalized.includes("yellow")) {
    return "YELLOW_CARD";
  }

  if (normalized.includes("assist")) {
    return "ASSIST";
  }

  if (normalized.includes("sub")) {
    return "SUBSTITUTION";
  }

  return "UNKNOWN";
}

export function normalizeTimelineEvent(rawEvent: TheSportsDbTimelineEvent) {
  const eventType = normalizeEventType(
    rawEvent.strTimelineDetail,
    rawEvent.strEventType,
    rawEvent.strType,
    rawEvent.strTimeline,
    rawEvent.strEvent,
  );
  const minute = parseMinute(rawEvent.intTime ?? rawEvent.strTime);
  const playerName =
    rawEvent.strPlayer?.trim() ||
    rawEvent.strPlayerIn?.trim() ||
    rawEvent.strPlayerOut?.trim() ||
    undefined;
  const teamName = rawEvent.strTeam?.trim() || rawEvent.strHome?.trim() || rawEvent.strAway?.trim() || undefined;
  const externalEventId = rawEvent.idTimeline ?? rawEvent.idEventTeam ?? null;

  return {
    externalId: externalEventId ?? "",
    externalEventId: externalEventId ?? undefined,
    minute: minute ?? undefined,
    eventType,
    playerName,
    playerExternalId: rawEvent.idPlayer ?? undefined,
    teamName,
    teamExternalId: rawEvent.idTeam ?? undefined,
    rawPayload: rawEvent,
  };
}

export async function fetchWorldCupEvents() {
  const url = `${getBaseUrl()}/eventsseason.php?id=${encodeURIComponent(
    getLeagueId(),
  )}&s=${encodeURIComponent(getSeason())}`;
  const data = await getJson<EventsSeasonResponse>(url);
  const events = data?.events ?? data?.event ?? [];

  return Array.isArray(events) ? events : [];
}

export async function fetchEventById(eventId: string) {
  if (!eventId) {
    return null;
  }

  const data = await getJson<EventsSeasonResponse>(
    `${getBaseUrl()}/lookupevent.php?id=${encodeURIComponent(eventId)}`,
  );
  const events = data?.events ?? data?.event ?? [];

  return Array.isArray(events) ? events[0] ?? null : null;
}

export async function fetchEventTimeline(eventId: string) {
  if (!eventId?.trim()) {
    console.warn("[TheSportsDB] fetchEventTimeline called without eventId");
    return [];
  }

  const url = `${getBaseUrl()}/lookuptimeline.php?id=${encodeURIComponent(eventId)}`;
  const data = await getJson<TimelineResponse>(url, { noStore: true });
  const timeline = data?.timeline ?? data?.events ?? data?.event ?? [];

  if (!Array.isArray(timeline)) {
    console.info(`[TheSportsDB] timeline empty or null for event ${eventId}`);
    return [];
  }

  return timeline
    .map((rawEvent) => normalizeTimelineEvent(rawEvent))
    .filter((event) => Boolean(event.playerName || event.teamName || event.eventType !== "UNKNOWN"));
}

export async function fetchPlayersByTeamId(teamId: string) {
  if (!teamId) {
    return [];
  }

  const data = await getJson<PlayersResponse>(
    `${getBaseUrl()}/lookup_all_players.php?id=${encodeURIComponent(teamId)}`,
  );

  return Array.isArray(data?.player) ? data.player : [];
}

export async function fetchWorldCupTable() {
  const data = await getJson<LeagueTableResponse>(
    `${getBaseUrl()}/lookuptable.php?l=${encodeURIComponent(getLeagueId())}&s=${encodeURIComponent(
      getSeason(),
    )}`,
  );

  return Array.isArray(data?.table) ? data.table : [];
}

export function normalizePlayerPosition(position?: string | null): Position {
  const value = (position ?? "").toLowerCase();

  if (value.includes("goal")) return "GK";
  if (value.includes("back") || value.includes("def")) return "DEF";
  if (value.includes("mid")) return "MID";
  return "FWD";
}

export function normalizeTheSportsDbPlayer(player: TheSportsDbPlayer) {
  if (!player.idPlayer || !player.strPlayer) {
    return null;
  }

  return {
    externalId: player.idPlayer,
    externalProvider: PROVIDER,
    name: player.strPlayer,
    position: normalizePlayerPosition(player.strPosition),
    avatar: player.strPlayer
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    photoUrl: player.strCutout ?? player.strThumb ?? undefined,
    price: 6,
  };
}

export function normalizeTheSportsDbEvent(event: TheSportsDbEvent): NormalizedMatch | null {
  if (!event.idEvent || !event.strHomeTeam || !event.strAwayTeam) {
    return null;
  }

  const parsedMatchDate = parseMatchDate(event);

  if (!parsedMatchDate) {
    return null;
  }

  const matchDate = getOfficialKickoffDate({
    homeTeamName: event.strHomeTeam,
    awayTeamName: event.strAwayTeam,
    stadiumName: event.strVenue,
    matchDate: parsedMatchDate,
  }) ?? parsedMatchDate;
  const stage = event.strStage ?? event.strRound ?? undefined;

  return {
    externalId: event.idEvent,
    externalProvider: PROVIDER,
    homeTeam: normalizeTeam(event.strHomeTeam, event.idHomeTeam, event.strHomeTeamBadge),
    awayTeam: normalizeTeam(event.strAwayTeam, event.idAwayTeam, event.strAwayTeamBadge),
    homeScore: parseScore(event.intHomeScore),
    awayScore: parseScore(event.intAwayScore),
    matchDate,
    status: inferStatus(event, matchDate),
    groupName: event.strGroup ?? undefined,
    stage,
    stadium: event.strVenue ?? undefined,
    city: event.strCity ?? undefined,
    country: event.strCountry ?? undefined,
    lastSyncedAt: new Date(),
  };
}
