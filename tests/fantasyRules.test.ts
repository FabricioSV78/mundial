import assert from "node:assert/strict";
import { test } from "node:test";
import { validateFantasyTeam } from "../lib/fantasyRules";
import type { Player } from "../lib/types";

function player(id: string, countryCode: string, price = 8): Player {
  return {
    id,
    name: `Player ${id}`,
    country: countryCode,
    countryCode,
    position: "MID",
    price,
    points: 0,
    avatar: id.slice(0, 2).toUpperCase(),
    stats: {
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      saves: 0,
      yellowCards: 0,
      redCards: 0,
      minutes: 0,
    },
  };
}

test("valida equipo fantasy correcto", () => {
  const players = [
    player("p1", "ARG"),
    player("p2", "ARG"),
    player("p3", "ARG"),
    player("p4", "BRA"),
    player("p5", "BRA"),
    player("p6", "BRA"),
    player("p7", "FRA"),
    player("p8", "FRA"),
    player("p9", "ESP"),
    player("p10", "ESP"),
    player("p11", "MEX"),
  ];

  const result = validateFantasyTeam({ players, formation: "4-3-3" });

  assert.equal(result.valid, true);
});

test("detecta exceso de jugadores por seleccion", () => {
  const players = Array.from({ length: 11 }, (_, index) => player(`p${index}`, "ARG", 10));
  const result = validateFantasyTeam({ players, formation: "4-4-2" });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("Maximo 3")));
});

test("detecta cantidad incorrecta de jugadores", () => {
  const result = validateFantasyTeam({ players: [player("p1", "ARG")], formation: "3-5-2" });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("11 jugadores")));
});
