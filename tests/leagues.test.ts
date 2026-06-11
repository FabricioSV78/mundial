import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_LEAGUES_PER_USER, canJoinMoreLeagues, resolveActiveLeagueId } from "../lib/leagues";

test("limita la participacion a maximo tres ligas", () => {
  assert.equal(canJoinMoreLeagues(MAX_LEAGUES_PER_USER - 1), true);
  assert.equal(canJoinMoreLeagues(MAX_LEAGUES_PER_USER), false);
});

test("resuelve la liga activa pedida o cae a la primera disponible", () => {
  const leagues = [
    { id: "liga-a", name: "Liga A", inviteCode: "A1234", memberCount: 6 },
    { id: "liga-b", name: "Liga B", inviteCode: "B1234", memberCount: 8 },
  ];

  assert.equal(resolveActiveLeagueId(leagues, "liga-b"), "liga-b");
  assert.equal(resolveActiveLeagueId(leagues, "liga-x"), "liga-a");
  assert.equal(resolveActiveLeagueId([], "liga-b"), undefined);
});
