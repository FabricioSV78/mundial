import { prisma } from "@/lib/prisma";
import {
  calculateBestThirdPlaces,
  calculateSeededGroupStandings,
  determineQualifiedTeams,
  tournamentConfig,
  validateGroupStageCompletenessFromSeededGroups,
} from "@/lib/tournament/tournamentEngine";
import {
  WORLD_CUP_2026_NAME,
  WORLD_CUP_2026_SLUG,
  canonicalTeamName,
  groupForTeamName,
  officialGroups2026,
} from "@/lib/tournament/officialGroups2026";

function teamCode(name: string) {
  return name
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 6)
    .toUpperCase();
}

function persistedGroupForTeam(
  team: { name: string; group: string; groupId: string | null },
  groups: Array<{ id: string; name: string }>,
) {
  if (team.groupId) {
    return groups.find((group) => group.id === team.groupId);
  }

  const officialGroup = groupForTeamName(team.name);
  const groupName = officialGroup?.name ?? (team.group && team.group !== "Sin grupo" ? team.group : null);

  return groupName ? groups.find((group) => group.name === groupName) : undefined;
}

async function findTeamByName(name: string) {
  const canonical = canonicalTeamName(name);
  const teams = await prisma.team.findMany();

  return teams.find((team) => canonicalTeamName(team.name) === canonical) ?? null;
}

export async function createOfficialGroups2026() {
  const tournament = await prisma.tournament.upsert({
    where: { slug: WORLD_CUP_2026_SLUG },
    update: { name: WORLD_CUP_2026_NAME, year: 2026 },
    create: { slug: WORLD_CUP_2026_SLUG, name: WORLD_CUP_2026_NAME, year: 2026 },
  });

  let teamsUpserted = 0;
  const tournamentGroupIds: string[] = [];
  const activePlaceholderTypes = officialGroups2026
    .flatMap((group) => group.teams.map((team) => team.placeholderType))
    .filter((placeholderType): placeholderType is string => Boolean(placeholderType));

  for (const [index, group] of officialGroups2026.entries()) {
    const tournamentGroup = await prisma.tournamentGroup.upsert({
      where: { tournamentId_name: { tournamentId: tournament.id, name: group.name } },
      update: { order: index + 1 },
      create: { tournamentId: tournament.id, name: group.name, order: index + 1 },
    });
    tournamentGroupIds.push(tournamentGroup.id);

    for (const groupTeam of group.teams) {
      const existing = await findTeamByName(groupTeam.name);
      const data = {
        name: groupTeam.name,
        code: existing?.code ?? teamCode(groupTeam.name),
        shortName: existing?.shortName ?? teamCode(groupTeam.name),
        flag: existing?.flag ?? "🏳️",
        flagUrl: existing?.flagUrl,
        group: group.name,
        groupId: tournamentGroup.id,
        isPlaceholder: Boolean(groupTeam.isPlaceholder),
        placeholderType: groupTeam.placeholderType,
      };

      if (existing) {
        await prisma.team.update({
          where: { id: existing.id },
          data: {
            group: group.name,
            groupId: tournamentGroup.id,
            isPlaceholder: Boolean(groupTeam.isPlaceholder),
            placeholderType: groupTeam.placeholderType,
          },
        });
      } else {
        await prisma.team.create({ data });
      }

      teamsUpserted += 1;
    }
  }

  await prisma.team.updateMany({
    where: {
      isPlaceholder: true,
      groupId: { in: tournamentGroupIds },
      ...(activePlaceholderTypes.length > 0 ? { placeholderType: { notIn: activePlaceholderTypes } } : {}),
    },
    data: {
      group: "",
      groupId: null,
      placeholderType: null,
    },
  });

  const matchesUpdated = await assignWorldCupMatchesToOfficialGroups();

  return {
    tournament,
    groups: officialGroups2026.length,
    teamsUpserted,
    matchesUpdated,
  };
}

export async function assignWorldCupMatchesToOfficialGroups() {
  const groups = await prisma.tournamentGroup.findMany({
    where: { tournament: { slug: WORLD_CUP_2026_SLUG } },
    include: { teams: true },
  });
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
  });
  let updated = 0;

  for (const match of matches) {
    const homeGroup = persistedGroupForTeam(match.homeTeam, groups);
    const awayGroup = persistedGroupForTeam(match.awayTeam, groups);

    if (homeGroup && awayGroup && homeGroup.name === awayGroup.name) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          groupId: homeGroup.id,
          groupName: homeGroup.name,
        },
      });
      updated += 1;
    } else if (match.groupId || match.groupName) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          groupId: null,
          groupName: null,
        },
      });
    }
  }

  return updated;
}

export async function replacePlaceholderTeam(placeholderTeamId: string, realTeamId: string) {
  const [placeholder, realTeam] = await Promise.all([
    prisma.team.findUnique({ where: { id: placeholderTeamId } }),
    prisma.team.findUnique({ where: { id: realTeamId } }),
  ]);

  if (!placeholder?.isPlaceholder || !realTeam) {
    throw new Error("INVALID_REPLACEMENT");
  }

  await prisma.$transaction([
    prisma.team.update({
      where: { id: realTeam.id },
      data: {
        group: placeholder.group,
        groupId: placeholder.groupId,
        isPlaceholder: false,
        placeholderType: null,
      },
    }),
    prisma.match.updateMany({
      where: { homeTeamId: placeholder.id },
      data: { homeTeamId: realTeam.id },
    }),
    prisma.match.updateMany({
      where: { awayTeamId: placeholder.id },
      data: { awayTeamId: realTeam.id },
    }),
    prisma.prediction.updateMany({
      where: { winnerTeamId: placeholder.id },
      data: { winnerTeamId: realTeam.id },
    }),
    prisma.team.update({
      where: { id: placeholder.id },
      data: {
        group: "",
        groupId: null,
        replacedByTeamId: realTeam.id,
      },
    }),
  ]);

  const matchesUpdated = await assignWorldCupMatchesToOfficialGroups();

  return {
    placeholderTeamId,
    realTeamId,
    matchesUpdated,
  };
}

export async function getOfficialGroupsWithStandings() {
  return prisma.tournamentGroup.findMany({
    where: { tournament: { slug: WORLD_CUP_2026_SLUG } },
    orderBy: { order: "asc" },
    include: {
      teams: {
        where: { replacedByTeamId: null },
        orderBy: { name: "asc" },
      },
      matches: {
        include: { homeTeam: true, awayTeam: true },
        orderBy: { matchDate: "asc" },
      },
    },
  });
}

export function deriveOfficialWorldCupState(
  groups: Awaited<ReturnType<typeof getOfficialGroupsWithStandings>>,
  options?: { liveProjection?: boolean },
) {
  const seededGroups = groups.map((group) => ({
    groupName: group.name,
    teams: group.teams.map((team) => ({
      id: team.id,
      name: team.name,
      groupName: group.name,
    })),
    matches: group.matches.map((match) => ({
      id: match.id,
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        groupName: group.name,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        groupName: group.name,
      },
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      groupName: group.name,
      stage: match.stage,
      status: match.status,
    })),
  }));
  const standings = calculateSeededGroupStandings(seededGroups, tournamentConfig);
  const qualifiedRows = determineQualifiedTeams(standings, {
    config: tournamentConfig,
    liveProjection: options?.liveProjection,
  });
  const rankedThirdRows = calculateBestThirdPlaces(standings, { config: tournamentConfig });
  const bestThirdRows = rankedThirdRows.slice(0, tournamentConfig.bestThirdPlaces);
  const fixtureValidation = validateGroupStageCompletenessFromSeededGroups(seededGroups, tournamentConfig);
  const groupStageComplete = fixtureValidation.isComplete;
  const confirmedQualifiedRows = qualifiedRows.filter(
    (row) => row.qualifiedStatus === "DIRECT" || row.qualifiedStatus === "BEST_THIRD",
  );
  const projectedQualifiedRows = qualifiedRows.filter(
    (row) => row.qualifiedStatus === "PROJECTED_DIRECT" || row.qualifiedStatus === "PROJECTED_BEST_THIRD",
  );

  return {
    standings,
    qualifiedRows,
    confirmedQualifiedRows,
    projectedQualifiedRows,
    bestThirdRows,
    rankedThirdRows,
    qualifiedIds: new Set(confirmedQualifiedRows.map((row) => row.teamId)),
    bestThirdIds: new Set(bestThirdRows.map((row) => row.teamId)),
    groupStageComplete,
    hasSyncedMatches: groups.some((group) => group.matches.length > 0),
    fixtureValidation,
    liveProjection: Boolean(options?.liveProjection),
  };
}

export async function validateGroupStageCompleteness(tournamentId?: string) {
  const groups = await prisma.tournamentGroup.findMany({
    where: tournamentId ? { tournamentId } : { tournament: { slug: WORLD_CUP_2026_SLUG } },
    orderBy: { order: "asc" },
    include: {
      teams: { orderBy: { name: "asc" } },
      matches: {
        include: { homeTeam: true, awayTeam: true },
        orderBy: { matchDate: "asc" },
      },
    },
  });

  return validateGroupStageCompletenessFromSeededGroups(
    groups.map((group) => ({
      groupName: group.name,
      teams: group.teams.map((team) => ({
        id: team.id,
        name: team.name,
        groupName: group.name,
      })),
      matches: group.matches.map((match) => ({
        id: match.id,
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          groupName: group.name,
        },
        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          groupName: group.name,
        },
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        groupName: group.name,
        stage: match.stage,
        status: match.status,
      })),
    })),
    tournamentConfig,
  );
}

export async function buildTournamentRulesAudit(options?: { liveProjection?: boolean }) {
  const groups = await getOfficialGroupsWithStandings();
  const state = deriveOfficialWorldCupState(groups, options);
  const allMatches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
  });
  const placeholders = groups.flatMap((group) => group.teams.filter((team) => team.isPlaceholder));
  const activeTeamsByCanonicalName = new Map<string, string>();
  const duplicateTeams = new Set<string>();

  for (const group of groups) {
    for (const team of group.teams) {
      const canonicalName = canonicalTeamName(team.name);

      if (activeTeamsByCanonicalName.has(canonicalName)) {
        duplicateTeams.add(team.name);
      }

      activeTeamsByCanonicalName.set(canonicalName, group.name);
    }
  }

  const matchesWithoutGroup = allMatches.filter((match) => {
    if (match.groupId) {
      return false;
    }

    const homeGroup = persistedGroupForTeam(match.homeTeam, groups);
    const awayGroup = persistedGroupForTeam(match.awayTeam, groups);

    return Boolean(homeGroup && awayGroup && homeGroup.name === awayGroup.name);
  });
  const directCount = state.qualifiedRows.filter((row) => row.qualifiedStatus === "DIRECT").length;
  const bestThirdCount = state.qualifiedRows.filter((row) => row.qualifiedStatus === "BEST_THIRD").length;
  const eliminatedCount = state.qualifiedRows.filter((row) => row.qualifiedStatus === "ELIMINATED").length;
  const projectedCount = state.qualifiedRows.filter(
    (row) =>
      row.qualifiedStatus === "PROJECTED_DIRECT" || row.qualifiedStatus === "PROJECTED_BEST_THIRD",
  ).length;

  return {
    config: tournamentConfig,
    expectedTeams: tournamentConfig.totalTeams,
    actualTeams: groups.reduce((sum, group) => sum + group.teams.length, 0),
    expectedGroups: tournamentConfig.groups,
    actualGroups: groups.length,
    placeholders: placeholders.length,
    duplicateTeams: [...duplicateTeams],
    matchesWithoutGroupId: matchesWithoutGroup.length,
    directCount,
    bestThirdCount,
    eliminatedCount,
    projectedCount,
    fixtureValidation: state.fixtureValidation,
    rankedThirdRows: state.rankedThirdRows,
    qualifiedRows: state.qualifiedRows,
    bracket: {
      roundOf32Matches: tournamentConfig.knockoutTeams / 2,
      roundOf16Matches: tournamentConfig.knockoutTeams / 4,
      quarterFinalsMatches: tournamentConfig.knockoutTeams / 8,
      semiFinalsMatches: tournamentConfig.knockoutTeams / 16,
      thirdPlaceMatches: 1,
      finalMatches: 1,
      ready: state.confirmedQualifiedRows.length === tournamentConfig.knockoutTeams,
    },
  };
}
