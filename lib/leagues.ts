import type { LeagueSummary } from "@/lib/types";

export const MAX_LEAGUES_PER_USER = 3;

export function canJoinMoreLeagues(leagueCount: number) {
  return leagueCount < MAX_LEAGUES_PER_USER;
}

export function resolveActiveLeagueId(leagues: LeagueSummary[], requestedLeagueId?: string) {
  if (!leagues.length) {
    return undefined;
  }

  if (requestedLeagueId && leagues.some((league) => league.id === requestedLeagueId)) {
    return requestedLeagueId;
  }

  return leagues[0].id;
}
