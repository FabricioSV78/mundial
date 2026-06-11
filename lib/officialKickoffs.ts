type MatchKickoffInput = {
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  stadiumName?: string | null;
  matchDate?: Date | string | null;
};

const INAUGURAL_KICKOFF_UTC = new Date("2026-06-11T19:00:00.000Z");

function normalizeName(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function isTeamPair(input: MatchKickoffInput, left: string, right: string) {
  const home = normalizeName(input.homeTeamName);
  const away = normalizeName(input.awayTeamName);

  return (home === left && away === right) || (home === right && away === left);
}

export function getOfficialKickoffDate(input: MatchKickoffInput) {
  const stadium = normalizeName(input.stadiumName);

  if (stadium.includes("azteca") && isTeamPair(input, "mexico", "south africa")) {
    return INAUGURAL_KICKOFF_UTC;
  }

  if (stadium.includes("azteca") && isTeamPair(input, "mexico", "sudafrica")) {
    return INAUGURAL_KICKOFF_UTC;
  }

  return input.matchDate ? new Date(input.matchDate) : null;
}
