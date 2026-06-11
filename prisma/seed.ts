import { prisma } from "../lib/prisma";
import { syncWorldCupFromTheSportsDb } from "../lib/sync/worldCupSync";
import { createOfficialGroups2026 } from "../lib/tournament/officialGroupsService";

async function clearData() {
  await prisma.fantasySlot.deleteMany();
  await prisma.fantasyTeam.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.leagueMember.deleteMany();
  await prisma.league.deleteMany();
  await prisma.player.deleteMany();
  await prisma.match.deleteMany();
  await prisma.stadium.deleteMany();
  await prisma.team.deleteMany();
  await prisma.tournamentGroup.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.syncLog.deleteMany();
}

async function main() {
  await clearData();
  const result = await syncWorldCupFromTheSportsDb();
  const groups = await createOfficialGroups2026();
  console.log(result.message);
  console.log(`Grupos oficiales creados: ${groups.groups} grupos, ${groups.teamsUpserted} selecciones.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
