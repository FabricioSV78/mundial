import { prisma } from "@/lib/prisma";

export async function recalculateUserLeaguePoints(userId: string) {
  const [predictions, fantasyLogs] = await Promise.all([
    prisma.prediction.findMany({
      where: { userId },
      select: { points: true },
    }),
    prisma.fantasyPointLog.findMany({
      where: { userId },
    }),
  ]);
  const predictionPoints = predictions.reduce((total, prediction) => total + prediction.points, 0);
  const fantasyPoints = fantasyLogs.reduce((total, log) => total + log.points, 0);
  const total = predictionPoints + fantasyPoints;

  await prisma.leagueMember.updateMany({
    where: { userId },
    data: { points: total },
  });

  return {
    predictionPoints,
    fantasyPoints,
    total,
  };
}
