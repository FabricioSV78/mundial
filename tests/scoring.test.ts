import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildMatchScorerOptions,
  filterMatchesByPredictionStage,
  getPredictionStageKey,
  getPredictionStageOptions,
  isPredictionLocked,
  resolvePredictionStage,
} from "../lib/predictions";
import { calculateFantasyPoints, calculatePredictionPoints } from "../lib/scoring";
import type { Match, Player } from "../lib/types";

const match: Match = {
  id: "m1",
  homeTeam: { id: "a", name: "Argentina", code: "ARG", flag: "🇦🇷", group: "A" },
  awayTeam: { id: "m", name: "Mexico", code: "MEX", flag: "🇲🇽", group: "A" },
  date: "2026-06-11T20:00:00Z",
  stadium: {
    id: "azteca",
    name: "Estadio Azteca",
    city: "Mexico City",
    country: "Mexico",
    capacity: 83000,
    lat: 0,
    lng: 0,
    image: "",
    funFact: "",
  },
  stage: "Grupo A",
  status: "FINISHED",
  result: { homeGoals: 2, awayGoals: 1, scorer: "Messi" },
};

test("calcula puntos por resultado exacto y goleador", () => {
  assert.equal(
    calculatePredictionPoints(match, {
      matchId: match.id,
      homeGoals: 2,
      awayGoals: 1,
      scorer: "Messi",
    }),
    7,
  );
});

test("compara goleador ignorando mayusculas, tildes y espacios", () => {
  assert.equal(
    calculatePredictionPoints(match, {
      matchId: match.id,
      homeGoals: 2,
      awayGoals: 1,
      scorer: "  messí  ",
    }),
    7,
  );
});

test("bloquea pronosticos despues del inicio", () => {
  assert.equal(
    isPredictionLocked("2026-06-11T20:00:00Z", new Date("2026-06-11T20:00:01Z")),
    true,
  );
  assert.equal(
    isPredictionLocked("2026-06-11T20:00:00Z", new Date("2026-06-11T19:59:59Z")),
    false,
  );
});

test("calcula puntos fantasy con gol, victoria y roja", () => {
  const player: Player = {
    id: "p1",
    name: "Jugador 1",
    country: "Argentina",
    countryCode: "ARG",
    position: "MID",
    price: 0,
    points: 0,
    avatar: "J1",
    stats: {
      goals: 1,
      assists: 2,
      cleanSheets: 1,
      saves: 3,
      yellowCards: 1,
      redCards: 1,
      minutes: 90,
    },
  };

  assert.equal(calculateFantasyPoints(player, { teamWon: true }), 2);
  assert.equal(calculateFantasyPoints(player, { teamWins: 2 }), 4);
});

test("arma opciones de goleador solo con jugadores del partido", () => {
  const options = buildMatchScorerOptions(match, [
    {
      id: "p1",
      name: "Lionel Messi",
      teamId: "a",
      country: "Argentina",
      countryCode: "ARG",
      position: "FWD",
      price: 0,
      points: 0,
      avatar: "LM",
      stats: {
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        saves: 0,
        yellowCards: 0,
        redCards: 0,
        minutes: 0,
      },
    },
    {
      id: "p2",
      name: "Santiago Gimenez",
      teamId: "m",
      country: "Mexico",
      countryCode: "MEX",
      position: "FWD",
      price: 0,
      points: 0,
      avatar: "SG",
      stats: {
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        saves: 0,
        yellowCards: 0,
        redCards: 0,
        minutes: 0,
      },
    },
    {
      id: "p3",
      name: "Kylian Mbappe",
      teamId: "fra",
      country: "France",
      countryCode: "FRA",
      position: "FWD",
      price: 0,
      points: 0,
      avatar: "KM",
      stats: {
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        saves: 0,
        yellowCards: 0,
        redCards: 0,
        minutes: 0,
      },
    },
  ]);

  assert.deepEqual(options, ["Lionel Messi", "Santiago Gimenez"]);
});

test("clasifica partidos por fase de pronostico", () => {
  assert.equal(getPredictionStageKey({ stage: "Grupo A", groupName: "A" }), "GROUP_STAGE");
  assert.equal(getPredictionStageKey({ stage: "Round of 32" }), "ROUND_OF_32");
  assert.equal(getPredictionStageKey({ stage: "Round of 16" }), "ROUND_OF_16");
  assert.equal(getPredictionStageKey({ stage: "Quarter-finals" }), "QUARTERFINAL");
  assert.equal(getPredictionStageKey({ stage: "Semi-finals" }), "SEMIFINAL");
  assert.equal(getPredictionStageKey({ stage: "Third Place" }), "THIRD_PLACE");
  assert.equal(getPredictionStageKey({ stage: "Final" }), "FINAL");
});

test("resuelve y filtra la fase activa de pronosticos", () => {
  const matchesForStages: Match[] = [
    {
      ...match,
      id: "g1",
      stage: "Grupo A",
      groupName: "A",
      status: "FINISHED",
    },
    {
      ...match,
      id: "r32",
      stage: "Round of 32",
      groupName: undefined,
      status: "SCHEDULED",
    },
    {
      ...match,
      id: "qf",
      stage: "Quarter-finals",
      groupName: undefined,
      status: "SCHEDULED",
    },
  ];

  const options = getPredictionStageOptions(matchesForStages);
  assert.deepEqual(
    options.map((option) => option.key),
    ["GROUP_STAGE", "ROUND_OF_32", "QUARTERFINAL"],
  );
  assert.equal(resolvePredictionStage(matchesForStages), "ROUND_OF_32");
  assert.equal(filterMatchesByPredictionStage(matchesForStages, "ROUND_OF_32").length, 1);
});
