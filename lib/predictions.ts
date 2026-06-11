import type { Match, Player } from "@/lib/types";

export function isPredictionLocked(matchDate: Date | string, now: Date = new Date()) {
  return new Date(matchDate).getTime() <= now.getTime();
}

export type PredictionStageKey =
  | "GROUP_STAGE"
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTERFINAL"
  | "SEMIFINAL"
  | "THIRD_PLACE"
  | "FINAL"
  | "OTHER";

export type PredictionStageOption = {
  key: PredictionStageKey;
  label: string;
  count: number;
};

const stageLabels: Record<PredictionStageKey, string> = {
  GROUP_STAGE: "Fase de grupos",
  ROUND_OF_32: "Dieciseisavos",
  ROUND_OF_16: "Octavos",
  QUARTERFINAL: "Cuartos",
  SEMIFINAL: "Semifinal",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
  OTHER: "Otras fases",
};

export function getPredictionStageLabel(stageKey: PredictionStageKey) {
  return stageLabels[stageKey];
}

export function getPredictionStageKey(match: Pick<Match, "stage" | "groupName">): PredictionStageKey {
  const rawStage = `${match.stage ?? ""} ${match.groupName ?? ""}`.toLowerCase().trim();

  if (match.groupName || rawStage.includes("group") || rawStage.includes("grupo")) {
    return "GROUP_STAGE";
  }

  if (
    rawStage.includes("round of 32") ||
    rawStage.includes("round 32") ||
    rawStage.includes("dieciseis") ||
    rawStage.includes("1/16")
  ) {
    return "ROUND_OF_32";
  }

  if (
    rawStage.includes("round of 16") ||
    rawStage.includes("round 16") ||
    rawStage.includes("octavos") ||
    rawStage.includes("1/8")
  ) {
    return "ROUND_OF_16";
  }

  if (rawStage.includes("quarter") || rawStage.includes("cuartos") || rawStage.includes("1/4")) {
    return "QUARTERFINAL";
  }

  if (rawStage.includes("semi")) {
    return "SEMIFINAL";
  }

  if (rawStage.includes("third") || rawStage.includes("tercer")) {
    return "THIRD_PLACE";
  }

  if (rawStage.includes("final")) {
    return "FINAL";
  }

  return "OTHER";
}

export function getPredictionStageOptions(matches: Match[]): PredictionStageOption[] {
  const counts = new Map<PredictionStageKey, number>();

  for (const match of matches) {
    const key = getPredictionStageKey(match);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const order: PredictionStageKey[] = [
    "GROUP_STAGE",
    "ROUND_OF_32",
    "ROUND_OF_16",
    "QUARTERFINAL",
    "SEMIFINAL",
    "THIRD_PLACE",
    "FINAL",
    "OTHER",
  ];

  return order
    .map((key) => ({
      key,
      label: getPredictionStageLabel(key),
      count: counts.get(key) ?? 0,
    }))
    .filter((option) => option.count > 0);
}

export function resolvePredictionStage(matches: Match[], requestedStage?: string) {
  const options = getPredictionStageOptions(matches);
  const validRequestedStage = options.find((option) => option.key === requestedStage)?.key;

  if (validRequestedStage) {
    return validRequestedStage;
  }

  const activeMatch = matches.find((match) => match.status === "LIVE" || match.status === "SCHEDULED");

  if (activeMatch) {
    return getPredictionStageKey(activeMatch);
  }

  return options[0]?.key;
}

export function filterMatchesByPredictionStage(matches: Match[], stageKey?: string) {
  if (!stageKey) {
    return matches;
  }

  return matches.filter((match) => getPredictionStageKey(match) === stageKey);
}

export function buildMatchScorerOptions(match: Match, players: Player[]) {
  const playerNames = players
    .filter((player) => player.teamId === match.homeTeam.id || player.teamId === match.awayTeam.id)
    .map((player) => player.name);

  return [...new Set(playerNames)].sort((left, right) => left.localeCompare(right));
}
