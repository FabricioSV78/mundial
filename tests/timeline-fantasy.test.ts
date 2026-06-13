import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFantasyPointEntriesForMatch } from "../lib/fantasy/fantasyScoring";
import { fetchEventTimeline, normalizeTimelineEvent } from "../lib/integrations/theSportsDb";
import {
  buildStableTimelineExternalId,
  matchesNormalizedName,
  normalizeLookupText,
  summarizeScorers,
} from "../lib/matches/matchTimeline";
import type { MatchEventItem } from "../lib/types";

test("normaliza evento GOAL desde TheSportsDB", () => {
  const event = normalizeTimelineEvent({
    idTimeline: "tl-1",
    strTimeline: "Goal",
    intTime: "45+1",
    strPlayer: "Lionel Messi",
    strTeam: "Argentina",
  });

  assert.equal(event.eventType, "GOAL");
  assert.equal(event.minute, 45);
  assert.equal(event.playerName, "Lionel Messi");
  assert.equal(event.teamName, "Argentina");
});

test("normaliza goles de penal y tiro libre aunque no lleguen como goal normal", () => {
  const penaltyGoal = normalizeTimelineEvent({
    idTimeline: "tl-pen",
    strTimelineDetail: "Penalty",
    strEventType: "Goal",
    intTime: "16",
    strPlayer: "Breel Embolo",
    strTeam: "Switzerland",
  });
  const freeKickGoal = normalizeTimelineEvent({
    idTimeline: "tl-fk",
    strTimelineDetail: "Free Kick",
    intTime: "72",
    strPlayer: "Akram Afif",
    strTeam: "Qatar",
  });

  assert.equal(penaltyGoal.eventType, "GOAL");
  assert.equal(freeKickGoal.eventType, "GOAL");
});

test("normaliza evento RED_CARD desde TheSportsDB", () => {
  const event = normalizeTimelineEvent({
    idTimeline: "tl-2",
    strEventType: "red card",
    strTime: "78'",
    strPlayer: "Ali Player",
    strTeam: "Qatar",
  });

  assert.equal(event.eventType, "RED_CARD");
  assert.equal(event.minute, 78);
});

test("normaliza tarjetas desde strTimelineDetail cuando strTimeline es generico", () => {
  const yellowCard = normalizeTimelineEvent({
    idTimeline: "tl-yellow",
    strTimeline: "Card",
    strTimelineDetail: "Yellow Card",
    intTime: "17",
    strPlayer: "Teboho Mokoena",
    strTeam: "South Africa",
  });
  const redCard = normalizeTimelineEvent({
    idTimeline: "tl-red",
    strTimeline: "Card",
    strTimelineDetail: "Red Card",
    intTime: "49",
    strPlayer: "Sphephelo Sithole",
    strTeam: "South Africa",
  });

  assert.equal(yellowCard.eventType, "YELLOW_CARD");
  assert.equal(redCard.eventType, "RED_CARD");
});

test("no cuenta como gol un VAR de gol anulado", () => {
  const event = normalizeTimelineEvent({
    idTimeline: "tl-var",
    strTimeline: "Var",
    strTimelineDetail: "Goal Disallowed - offside",
    intTime: "77",
    strPlayer: "Tomas Soucek",
    strTeam: "Czech Republic",
  });

  assert.equal(event.eventType, "UNKNOWN");
});

test("no cuenta penal atajado o errado como gol", () => {
  const savedPenalty = normalizeTimelineEvent({
    idTimeline: "tl-save",
    strTimeline: "Penalty",
    strTimelineDetail: "Penalty Saved",
    intTime: "51",
    strPlayer: "Almoez Ali",
    strTeam: "Qatar",
  });
  const missedPenalty = normalizeTimelineEvent({
    idTimeline: "tl-miss",
    strTimeline: "Penalty",
    strTimelineDetail: "Missed Penalty",
    intTime: "88",
    strPlayer: "Granit Xhaka",
    strTeam: "Switzerland",
  });

  assert.equal(savedPenalty.eventType, "PENALTY_SAVE");
  assert.equal(missedPenalty.eventType, "UNKNOWN");
});

test("retorna array vacio cuando timeline viene null", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ timeline: null }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  try {
    const events = await fetchEventTimeline("12345");
    assert.deepEqual(events, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("filtra eventos UNKNOWN del timeline de TheSportsDB", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        timeline: [
          {
            idTimeline: "goal-1",
            strTimeline: "Goal",
            strTimelineDetail: "Normal Goal",
            strPlayer: "Hyeon-gyu Oh",
            strTeam: "South Korea",
            intTime: "80",
          },
          {
            idTimeline: "var-1",
            strTimeline: "Var",
            strTimelineDetail: "Goal Disallowed - offside",
            strPlayer: "Tomas Soucek",
            strTeam: "Czech Republic",
            intTime: "77",
          },
        ],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );

  try {
    const events = await fetchEventTimeline("2461103");
    assert.equal(events.length, 1);
    assert.equal(events[0].eventType, "GOAL");
    assert.equal(events[0].playerName, "Hyeon-gyu Oh");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("compara nombres normalizados para vincular jugadores", () => {
  assert.equal(normalizeLookupText("  Kylian   Mbappe "), "kylian mbappe");
  assert.equal(matchesNormalizedName("Kylian Mbappe", "kylian  mbappé"), true);
  assert.equal(matchesNormalizedName("Lionel Messi", "Julian Alvarez"), false);
});

test("genera externalId estable para evitar duplicados", () => {
  const generated = buildStableTimelineExternalId("987", {
    minute: 90,
    eventType: "GOAL",
    playerName: "Kylian  Mbappé",
    teamName: "Fránce",
  });

  assert.equal(generated, "987:90:GOAL:kylian mbappe:france");
  assert.equal(
    buildStableTimelineExternalId("987", {
      externalId: "timeline-22",
      minute: 15,
      eventType: "GOAL",
      playerName: "Any",
      teamName: "Any",
    }),
    "timeline-22",
  );
});

test("calcula puntos fantasy por gol, victoria y roja sin duplicar al recalcular", () => {
  const events: MatchEventItem[] = [
    {
      id: "goal-1",
      matchId: "m1",
      externalId: "goal-1",
      externalProvider: "THESPORTSDB",
      minute: 12,
      eventType: "GOAL",
      playerId: "p1",
      playerName: "Lionel Messi",
      teamId: "arg",
      teamName: "Argentina",
      rawPayload: {},
    },
    {
      id: "yellow-1",
      matchId: "m1",
      externalId: "yellow-1",
      externalProvider: "THESPORTSDB",
      minute: 33,
      eventType: "YELLOW_CARD",
      playerId: "p1",
      playerName: "Lionel Messi",
      teamId: "arg",
      teamName: "Argentina",
      rawPayload: {},
    },
    {
      id: "red-1",
      matchId: "m1",
      externalId: "red-1",
      externalProvider: "THESPORTSDB",
      minute: 84,
      eventType: "RED_CARD",
      playerId: "p1",
      playerName: "Lionel Messi",
      teamId: "arg",
      teamName: "Argentina",
      rawPayload: {},
    },
  ];

  const selections = [
    { userId: "u1", fantasyTeamId: "ft1", playerId: "p1", playerName: "Lionel Messi", teamId: "arg" },
    { userId: "u1", fantasyTeamId: "ft1", playerId: "p2", playerName: "Julian Alvarez", teamId: "arg" },
    { userId: "u1", fantasyTeamId: "ft1", playerId: "p3", playerName: "Kylian Mbappe", teamId: "fra" },
  ];

  const resultA = buildFantasyPointEntriesForMatch(
    {
      id: "m1",
      status: "FINISHED",
      homeTeamId: "arg",
      awayTeamId: "fra",
      homeScore: 2,
      awayScore: 1,
    },
    events,
    selections,
  );
  const resultB = buildFantasyPointEntriesForMatch(
    {
      id: "m1",
      status: "FINISHED",
      homeTeamId: "arg",
      awayTeamId: "fra",
      homeScore: 2,
      awayScore: 1,
    },
    events,
    selections,
  );

  assert.deepEqual(resultA, resultB);
  assert.equal(new Set(resultA.map((entry) => entry.sourceKey)).size, resultA.length);

  const yellowCardLogs = resultA.filter((entry) => entry.sourceType === "YELLOW_CARD");
  const messiLogs = resultA.filter((entry) => entry.playerId === "p1");
  const julianLogs = resultA.filter((entry) => entry.playerId === "p2");
  const mbappeLogs = resultA.filter((entry) => entry.playerId === "p3");

  assert.equal(yellowCardLogs.length, 1);
  assert.equal(yellowCardLogs[0].points, -1);
  assert.equal(messiLogs.reduce((total, entry) => total + entry.points, 0), 1);
  assert.equal(julianLogs.reduce((total, entry) => total + entry.points, 0), 2);
  assert.equal(mbappeLogs.length, 0);
});

test("suma cuatro puntos al arquero si su equipo termina con arco en cero", () => {
  const result = buildFantasyPointEntriesForMatch(
    {
      id: "m1",
      status: "FINISHED",
      homeTeamId: "arg",
      awayTeamId: "fra",
      homeScore: 1,
      awayScore: 0,
    },
    [],
    [
      { userId: "u1", fantasyTeamId: "ft1", playerId: "gk1", playerName: "Emiliano Martinez", teamId: "arg", position: "GK" },
      { userId: "u2", fantasyTeamId: "ft2", playerId: "gk1", playerName: "Emiliano Martinez", teamId: "arg", position: "DEF" },
    ],
  );

  const cleanSheetLogs = result.filter((entry) => entry.sourceType === "CLEAN_SHEET");

  assert.equal(cleanSheetLogs.length, 1);
  assert.equal(cleanSheetLogs[0].points, 4);
});

test("resume goleadores del partido correctamente", () => {
  const scorers = summarizeScorers([
    { playerName: "Lionel Messi", teamName: "Argentina", minute: 12 },
    { playerName: "Lionel Messi", teamName: "Argentina", minute: 67 },
    { playerName: "Kylian Mbappe", teamName: "France", minute: 74 },
  ]);

  assert.deepEqual(scorers, [
    {
      playerName: "Lionel Messi",
      teamName: "Argentina",
      goals: 2,
      minutes: [12, 67],
    },
    {
      playerName: "Kylian Mbappe",
      teamName: "France",
      goals: 1,
      minutes: [74],
    },
  ]);
});
