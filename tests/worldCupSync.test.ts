import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTeamSyncUpdate } from "../lib/sync/worldCupSync";

test("TheSportsDB sync no borra datos manuales del equipo", () => {
  const data = buildTeamSyncUpdate(
    {
      code: "MEX",
      flag: "🏳️",
      group: "A",
      groupId: "group-a",
      isPlaceholder: false,
      placeholderType: null,
      replacedByTeamId: null,
    },
    {
      name: "Mexico",
      shortName: "MEX",
      externalId: "133612",
      externalProvider: "THESPORTSDB",
      flagUrl: "https://flags.example/mex.png",
      groupName: "Z",
    },
  );

  assert.equal(data.group, "A");
  assert.equal(data.groupId, "group-a");
  assert.equal(data.code, "MEX");
});

test("TheSportsDB sync no rompe grupos manuales ya sembrados", () => {
  const data = buildTeamSyncUpdate(
    {
      code: "RSA",
      flag: "🏳️",
      group: "A",
      groupId: "group-a",
      isPlaceholder: true,
      placeholderType: "PLAYOFF_WINNER_1",
      replacedByTeamId: null,
    },
    {
      name: "South Africa",
      shortName: "RSA",
      externalId: "133604",
      externalProvider: "THESPORTSDB",
      flagUrl: "https://flags.example/rsa.png",
      groupName: "B",
    },
  );

  assert.equal(data.group, "A");
  assert.equal(data.groupId, "group-a");
  assert.equal(data.isPlaceholder, true);
  assert.equal(data.placeholderType, "PLAYOFF_WINNER_1");
});
