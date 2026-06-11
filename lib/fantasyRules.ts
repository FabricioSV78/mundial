import type { Formation, Player } from "@/lib/types";

export const FANTASY_TEAM_SIZE = 11;
export const FANTASY_MAX_PER_COUNTRY = 3;

export type FantasyValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateFantasyTeam({
  players,
  formation,
}: {
  players: Player[];
  formation: Formation;
}): FantasyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const byCountry = players.reduce<Record<string, number>>((acc, player) => {
    acc[player.countryCode] = (acc[player.countryCode] ?? 0) + 1;
    return acc;
  }, {});

  if (players.length !== FANTASY_TEAM_SIZE) {
    errors.push(`Debes elegir ${FANTASY_TEAM_SIZE} jugadores.`);
  }

  const crowdedCountry = Object.entries(byCountry).find(([, count]) => count > FANTASY_MAX_PER_COUNTRY);
  if (crowdedCountry) {
    errors.push(`Maximo ${FANTASY_MAX_PER_COUNTRY} jugadores por seleccion: ${crowdedCountry[0]}.`);
  }

  if (!["4-3-3", "4-4-2", "3-5-2", "4-2-3-1"].includes(formation)) {
    errors.push("Formacion no valida.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
