import type { Match, Prediction } from "@/lib/types";
export {
  buildTeamWinCounts,
  calculateFantasyPoints,
  fantasyScoringRules,
} from "@/lib/fantasy/fantasyScoring";

export function normalizeComparableName(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isSameComparableName(left?: string | null, right?: string | null) {
  return Boolean(
    normalizeComparableName(left) &&
      normalizeComparableName(left) === normalizeComparableName(right),
  );
}

export function getWinner(homeGoals: number, awayGoals: number) {
  if (homeGoals === awayGoals) {
    return "DRAW";
  }

  return homeGoals > awayGoals ? "HOME" : "AWAY";
}

export function calculatePredictionPointsFromScores({
  actualHome,
  actualAway,
  predictedHome,
  predictedAway,
  actualScorer,
  actualScorers,
  predictedScorer,
}: {
  actualHome: number;
  actualAway: number;
  predictedHome: number;
  predictedAway: number;
  actualScorer?: string | null;
  actualScorers?: Array<string | null | undefined>;
  predictedScorer?: string | null;
}) {
  const actualWinner = getWinner(actualHome, actualAway);
  const predictedWinner = getWinner(predictedHome, predictedAway);
  const exact = actualHome === predictedHome && actualAway === predictedAway;
  const goalDifference = actualHome - actualAway === predictedHome - predictedAway;
  const scorers = actualScorers?.length ? actualScorers : [actualScorer];
  const scorer = scorers.some((scorerName) => isSameComparableName(scorerName, predictedScorer));

  if (exact) {
    return 5 + (scorer ? 2 : 0);
  }

  let points = 0;

  if (actualWinner === predictedWinner) {
    points += 3;
  }

  if (goalDifference) {
    points += 2;
  }

  if (scorer) {
    points += 2;
  }

  return points;
}

export function calculatePredictionPoints(match: Match, prediction: Prediction) {
  if (!match.result) {
    return 0;
  }

  return calculatePredictionPointsFromScores({
    actualHome: match.result.homeGoals,
    actualAway: match.result.awayGoals,
    predictedHome: prediction.homeGoals,
    predictedAway: prediction.awayGoals,
    actualScorer: match.result.scorer,
    predictedScorer: prediction.scorer,
  });
}
