import assert from "node:assert/strict";
import { test } from "node:test";
import {
  advanceWinner,
  calculateBestThirdPlaces,
  calculateGroupStandings,
  calculateSeededGroupStandings,
  determineQualifiedTeams,
  generateKnockoutPlaceholder,
  tournamentConfig,
  validateGroupStageCompletenessFromSeededGroups,
} from "../lib/tournament/tournamentEngine";
import type { TournamentEngineTeam } from "../lib/tournament/tournamentEngine";

function buildRoundRobinMatches(groupName: string, teams: TournamentEngineTeam[]) {
  return [
    { id: `${groupName}-1`, homeTeam: teams[0], awayTeam: teams[1], groupName, status: "SCHEDULED" as const },
    { id: `${groupName}-2`, homeTeam: teams[2], awayTeam: teams[3], groupName, status: "SCHEDULED" as const },
    { id: `${groupName}-3`, homeTeam: teams[0], awayTeam: teams[2], groupName, status: "SCHEDULED" as const },
    { id: `${groupName}-4`, homeTeam: teams[1], awayTeam: teams[3], groupName, status: "SCHEDULED" as const },
    { id: `${groupName}-5`, homeTeam: teams[0], awayTeam: teams[3], groupName, status: "SCHEDULED" as const },
    { id: `${groupName}-6`, homeTeam: teams[1], awayTeam: teams[2], groupName, status: "SCHEDULED" as const },
  ];
}

test("un grupo de 4 equipos genera 6 partidos esperados", () => {
  const teams = [
    { id: "a", name: "A", groupName: "A" },
    { id: "b", name: "B", groupName: "A" },
    { id: "c", name: "C", groupName: "A" },
    { id: "d", name: "D", groupName: "A" },
  ];
  const report = validateGroupStageCompletenessFromSeededGroups(
    [{ groupName: "A", teams, matches: buildRoundRobinMatches("A", teams) }],
    { ...tournamentConfig, groups: 1, totalTeams: 4, totalGroupStageMatches: 6, bestThirdPlaces: 0, knockoutTeams: 2 },
  );

  assert.equal(report.groups[0]?.matchCount, 6);
});

test("12 grupos generan 72 partidos de fase de grupos", () => {
  const groups = Array.from({ length: 12 }, (_, index) => {
    const groupName = String.fromCharCode(65 + index);
    const teams = Array.from({ length: 4 }, (_, teamIndex) => ({
      id: `${groupName}-${teamIndex + 1}`,
      name: `${groupName} Team ${teamIndex + 1}`,
      groupName,
    }));

    return {
      groupName,
      teams,
      matches: buildRoundRobinMatches(groupName, teams),
    };
  });

  const report = validateGroupStageCompletenessFromSeededGroups(groups, tournamentConfig);

  assert.equal(report.totalGroupStageMatches, 72);
  assert.equal(report.expectedGroupStageMatches, 72);
});

test("cada equipo juega 3 partidos en fase de grupos", () => {
  const teams = [
    { id: "a", name: "A", groupName: "A" },
    { id: "b", name: "B", groupName: "A" },
    { id: "c", name: "C", groupName: "A" },
    { id: "d", name: "D", groupName: "A" },
  ];
  const report = validateGroupStageCompletenessFromSeededGroups(
    [{ groupName: "A", teams, matches: buildRoundRobinMatches("A", teams) }],
    { ...tournamentConfig, groups: 1, totalTeams: 4, totalGroupStageMatches: 6, bestThirdPlaces: 0, knockoutTeams: 2 },
  );

  assert.equal(report.groups[0]?.teamWarnings.length, 0);
});

test("victoria suma 3 puntos y empate 1", () => {
  const standings = calculateGroupStandings([
    {
      id: "a1",
      homeTeam: { id: "arg", name: "Argentina", groupName: "A" },
      awayTeam: { id: "mex", name: "Mexico", groupName: "A" },
      homeScore: 2,
      awayScore: 0,
      groupName: "A",
      status: "FINISHED",
    },
    {
      id: "a2",
      homeTeam: { id: "can", name: "Canada", groupName: "A" },
      awayTeam: { id: "per", name: "Peru", groupName: "A" },
      homeScore: 1,
      awayScore: 1,
      groupName: "A",
      status: "FINISHED",
    },
  ]);

  const groupA = standings[0];
  assert.equal(groupA?.rows.find((row) => row.teamName === "Argentina")?.points, 3);
  assert.equal(groupA?.rows.find((row) => row.teamName === "Canada")?.points, 1);
  assert.equal(groupA?.rows.find((row) => row.teamName === "Peru")?.points, 1);
  assert.equal(groupA?.rows.find((row) => row.teamName === "Mexico")?.points, 0);
});

test("derrota suma 0 puntos y el orden prioriza puntos", () => {
  const standings = calculateGroupStandings([
    {
      id: "a1",
      homeTeam: { id: "mex", name: "Mexico", groupName: "A" },
      awayTeam: { id: "rsa", name: "South Africa", groupName: "A" },
      homeScore: 0,
      awayScore: 1,
      groupName: "A",
      status: "FINISHED",
    },
    {
      id: "a2",
      homeTeam: { id: "kor", name: "South Korea", groupName: "A" },
      awayTeam: { id: "cze", name: "Czechia", groupName: "A" },
      homeScore: 0,
      awayScore: 0,
      groupName: "A",
      status: "FINISHED",
    },
  ]);

  assert.equal(standings[0]?.rows[0]?.teamName, "South Africa");
  assert.equal(standings[0]?.rows.find((row) => row.teamName === "Mexico")?.points, 0);
});

test("ordena por diferencia de goles y goles a favor", () => {
  const standings = calculateGroupStandings([
    {
      id: "a1",
      homeTeam: { id: "arg", name: "Argentina", groupName: "A" },
      awayTeam: { id: "mex", name: "Mexico", groupName: "A" },
      homeScore: 2,
      awayScore: 0,
      groupName: "A",
      status: "FINISHED",
    },
    {
      id: "a2",
      homeTeam: { id: "bra", name: "Brazil", groupName: "A" },
      awayTeam: { id: "usa", name: "USA", groupName: "A" },
      homeScore: 1,
      awayScore: 0,
      groupName: "A",
      status: "FINISHED",
    },
  ]);

  assert.equal(standings[0]?.rows[0]?.teamName, "Argentina");
  assert.equal(standings[0]?.rows[1]?.teamName, "Brazil");
});

test("desempata por enfrentamiento directo", () => {
  const teams = [
    { id: "a", name: "Alpha", groupName: "A" },
    { id: "b", name: "Beta", groupName: "A" },
    { id: "c", name: "Gamma", groupName: "A" },
    { id: "d", name: "Delta", groupName: "A" },
  ];
  const standings = calculateSeededGroupStandings([
    {
      groupName: "A",
      teams,
      matches: [
        { id: "1", homeTeam: teams[0], awayTeam: teams[1], homeScore: 1, awayScore: 0, groupName: "A", status: "FINISHED" },
        { id: "2", homeTeam: teams[0], awayTeam: teams[2], homeScore: 0, awayScore: 1, groupName: "A", status: "FINISHED" },
        { id: "3", homeTeam: teams[0], awayTeam: teams[3], homeScore: 1, awayScore: 0, groupName: "A", status: "FINISHED" },
        { id: "4", homeTeam: teams[1], awayTeam: teams[2], homeScore: 1, awayScore: 0, groupName: "A", status: "FINISHED" },
        { id: "5", homeTeam: teams[1], awayTeam: teams[3], homeScore: 1, awayScore: 0, groupName: "A", status: "FINISHED" },
        { id: "6", homeTeam: teams[2], awayTeam: teams[3], homeScore: 1, awayScore: 0, groupName: "A", status: "FINISHED" },
      ],
    },
  ]);

  assert.equal(standings[0]?.rows[0]?.teamName, "Alpha");
  assert.equal(standings[0]?.rows[1]?.teamName, "Beta");
});

test("mejores 8 terceros clasifican y los otros quedan fuera", () => {
  const standings = Array.from({ length: 12 }, (_, index) => ({
    groupName: String.fromCharCode(65 + index),
    source: "internal" as const,
    rows: [
      { teamId: `w${index}`, teamName: `Winner ${index}`, groupName: String.fromCharCode(65 + index), played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 6, goalsAgainst: 0, goalDifference: 6, points: 9, rank: 1, source: "internal" as const },
      { teamId: `r${index}`, teamName: `Runner ${index}`, groupName: String.fromCharCode(65 + index), played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 4, goalsAgainst: 2, goalDifference: 2, points: 6, rank: 2, source: "internal" as const },
      { teamId: `t${index}`, teamName: `Third ${index}`, groupName: String.fromCharCode(65 + index), played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 2 + index, goalsAgainst: 2, goalDifference: index, points: 4, rank: 3, source: "internal" as const },
      { teamId: `l${index}`, teamName: `Last ${index}`, groupName: String.fromCharCode(65 + index), played: 3, won: 0, drawn: 1, lost: 2, goalsFor: 1, goalsAgainst: 5, goalDifference: -4, points: 1, rank: 4, source: "internal" as const },
    ],
  }));

  const rankedThird = calculateBestThirdPlaces(standings);
  const qualified = determineQualifiedTeams(standings);

  assert.equal(rankedThird.length, 12);
  assert.equal(qualified.filter((row) => row.qualifiedStatus === "BEST_THIRD").length, 8);
  assert.equal(
    qualified.filter((row) => row.rank === 3 && row.qualifiedStatus === "ELIMINATED").length,
    4,
  );
});

test("no clasifica definitivo si faltan partidos", () => {
  const teams = [
    { id: "a", name: "Alpha", groupName: "A" },
    { id: "b", name: "Beta", groupName: "A" },
    { id: "c", name: "Gamma", groupName: "A" },
    { id: "d", name: "Delta", groupName: "A" },
  ];
  const standings = calculateSeededGroupStandings([
    {
      groupName: "A",
      teams,
      matches: [
        { id: "1", homeTeam: teams[0], awayTeam: teams[1], homeScore: 1, awayScore: 0, groupName: "A", status: "FINISHED" },
      ],
    },
  ], { ...tournamentConfig, groups: 1, totalTeams: 4, totalGroupStageMatches: 6, bestThirdPlaces: 0, knockoutTeams: 2 });

  const qualified = determineQualifiedTeams(standings, {
    config: { ...tournamentConfig, groups: 1, totalTeams: 4, totalGroupStageMatches: 6, bestThirdPlaces: 0, knockoutTeams: 2 },
  });

  assert.equal(qualified.every((row) => row.qualifiedStatus === "PENDING"), true);
});

test("clasificacion proyectada si se activa live projection", () => {
  const teams = [
    { id: "a", name: "Alpha", groupName: "A" },
    { id: "b", name: "Beta", groupName: "A" },
    { id: "c", name: "Gamma", groupName: "A" },
    { id: "d", name: "Delta", groupName: "A" },
  ];
  const standings = calculateSeededGroupStandings([
    {
      groupName: "A",
      teams,
      matches: [
        { id: "1", homeTeam: teams[0], awayTeam: teams[1], homeScore: 1, awayScore: 0, groupName: "A", status: "FINISHED" },
      ],
    },
  ], { ...tournamentConfig, groups: 1, totalTeams: 4, totalGroupStageMatches: 6, bestThirdPlaces: 0, knockoutTeams: 2 });

  const qualified = determineQualifiedTeams(standings, {
    config: { ...tournamentConfig, groups: 1, totalTeams: 4, totalGroupStageMatches: 6, bestThirdPlaces: 0, knockoutTeams: 2 },
    liveProjection: true,
  });

  assert.equal(qualified.some((row) => row.qualifiedStatus === "PROJECTED_DIRECT"), true);
});

test("bracket Round of 32 tiene 16 partidos", () => {
  const slots = generateKnockoutPlaceholder([]);
  assert.equal(slots.filter((slot) => slot.roundKey === "ROUND_OF_32").length, 16);
});

test("el bracket usa equipos clasificados reales cuando ya existen", () => {
  const slots = generateKnockoutPlaceholder([
    { teamName: "Mexico", groupName: "A", rank: 1, qualifiedStatus: "DIRECT" },
    { teamName: "Canada", groupName: "B", rank: 2, qualifiedStatus: "DIRECT" },
    { teamName: "Morocco", groupName: "C", rank: 3, qualifiedStatus: "BEST_THIRD" },
  ]);

  const firstMatch = slots.find((slot) => slot.id === "r32-1");
  const seventhMatch = slots.find((slot) => slot.id === "r32-7");

  assert.equal(firstMatch?.home, "Mexico");
  assert.equal(firstMatch?.away, "Canada");
  assert.equal(seventhMatch?.away, "Morocco");
});

test("ganador de eliminatoria avanza correctamente", () => {
  const winner = advanceWinner({
    home: "Mexico",
    away: "Brazil",
    homeScore: 1,
    awayScore: 1,
    extraTimeHomeScore: 0,
    extraTimeAwayScore: 0,
    penaltiesHomeScore: 4,
    penaltiesAwayScore: 3,
    status: "FINISHED",
  });

  assert.equal(winner, "Mexico");
});

test("partido empatado en eliminatoria requiere extra time o penales", () => {
  const winner = advanceWinner({
    home: "Mexico",
    away: "Brazil",
    homeScore: 1,
    awayScore: 1,
    status: "FINISHED",
  });

  assert.equal(winner, null);
});
