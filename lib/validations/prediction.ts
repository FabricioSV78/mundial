import { z } from "zod";

export const predictionSchema = z.object({
  homeGoals: z.coerce.number().int().min(0).max(20),
  awayGoals: z.coerce.number().int().min(0).max(20),
  scorer: z.string().optional(),
  winnerTeamId: z.string().optional(),
});
