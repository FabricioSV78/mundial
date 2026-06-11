import { z } from "zod";

export const fantasyTeamSchema = z.object({
  formation: z.enum(["4-3-3", "4-4-2", "3-5-2", "4-2-3-1"]),
  playerIds: z.array(z.string()).length(11, "Debes elegir 11 jugadores"),
});
