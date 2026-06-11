import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeTheSportsDbEvent } from "../lib/integrations/theSportsDb";

test("normaliza evento de TheSportsDB al formato interno", () => {
  const normalized = normalizeTheSportsDbEvent({
    idEvent: "12345",
    idHomeTeam: "1",
    idAwayTeam: "2",
    strHomeTeam: "Argentina",
    strAwayTeam: "Mexico",
    intHomeScore: "2",
    intAwayScore: "1",
    strTimestamp: "2026-06-11T20:00:00Z",
    strStatus: "Match Finished",
    strGroup: "A",
    strVenue: "Estadio Azteca",
  });

  assert.ok(normalized);
  assert.equal(normalized.externalProvider, "THESPORTSDB");
  assert.equal(normalized.status, "FINISHED");
  assert.equal(normalized.homeScore, 2);
  assert.equal(normalized.awayScore, 1);
  assert.equal(normalized.homeTeam.shortName, "A");
});

test("corrige el inaugural Mexico vs Sudafrica a 14:00 hora Peru", () => {
  const normalized = normalizeTheSportsDbEvent({
    idEvent: "2391728",
    idHomeTeam: "1",
    idAwayTeam: "2",
    strHomeTeam: "Mexico",
    strAwayTeam: "South Africa",
    dateEvent: "2026-06-11",
    strTime: "20:00:00",
    strTimestamp: "2026-06-11T20:00:00",
    strStatus: "NS",
    strVenue: "Estadio Azteca",
    strCountry: "Mexico",
  });

  assert.ok(normalized);
  assert.equal(normalized.matchDate.toISOString(), "2026-06-11T19:00:00.000Z");
});

test("trata timestamp sin zona de TheSportsDB como UTC", () => {
  const normalized = normalizeTheSportsDbEvent({
    idEvent: "2391729",
    idHomeTeam: "1",
    idAwayTeam: "2",
    strHomeTeam: "USA",
    strAwayTeam: "Paraguay",
    dateEvent: "2026-06-13",
    strTime: "01:00:00",
    strTimestamp: "2026-06-13T01:00:00",
    strStatus: "NS",
    strVenue: "SoFi Stadium",
    strCountry: "United States",
  });

  assert.ok(normalized);
  assert.equal(normalized.matchDate.toISOString(), "2026-06-13T01:00:00.000Z");
});

test("devuelve null si faltan campos esenciales", () => {
  assert.equal(normalizeTheSportsDbEvent({ idEvent: "x" }), null);
});
