import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonicalTeamName,
  groupForTeamName,
  officialGroups2026,
} from "../lib/tournament/officialGroups2026";

test("contiene los grupos oficiales completos del Mundial 2026", () => {
  assert.equal(officialGroups2026.length, 12);
  assert.deepEqual(
    officialGroups2026.map((group) => [group.name, group.teams.map((team) => team.name)]),
    [
      ["A", ["Mexico", "South Africa", "South Korea", "Czechia"]],
      ["B", ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"]],
      ["C", ["Brazil", "Morocco", "Haiti", "Scotland"]],
      ["D", ["United States", "Paraguay", "Australia", "Turkey"]],
      ["E", ["Germany", "Curaçao", "Côte d’Ivoire", "Ecuador"]],
      ["F", ["Netherlands", "Japan", "Sweden", "Tunisia"]],
      ["G", ["Belgium", "Egypt", "Iran", "New Zealand"]],
      ["H", ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"]],
      ["I", ["France", "Senegal", "Iraq", "Norway"]],
      ["J", ["Argentina", "Algeria", "Austria", "Jordan"]],
      ["K", ["Portugal", "Democratic Republic of the Congo", "Uzbekistan", "Colombia"]],
      ["L", ["England", "Croatia", "Ghana", "Panama"]],
    ],
  );
  assert.equal(officialGroups2026.flatMap((group) => group.teams).some((team) => team.isPlaceholder), false);
});

test("resuelve aliases en espanol y nombres alternativos de selecciones", () => {
  assert.equal(canonicalTeamName("Chequia"), "Czechia");
  assert.equal(canonicalTeamName("Turquia"), "Turkey");
  assert.equal(canonicalTeamName("Republica Democratica del Congo"), "Democratic Republic of the Congo");

  assert.equal(groupForTeamName("Bosnia y Herzegovina")?.name, "B");
  assert.equal(groupForTeamName("Czech Republic")?.name, "A");
  assert.equal(groupForTeamName("DR Congo")?.name, "K");
});
