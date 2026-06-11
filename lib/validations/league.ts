import { z } from "zod";

export const createLeagueSchema = z.object({
  name: z.string().min(3, "Ponle un nombre a la liga"),
});

export const joinLeagueSchema = z.object({
  inviteCode: z.string().min(5, "Codigo demasiado corto").max(12),
});
