import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  const [placeholders, ungroupedMatches, teams] = await Promise.all([
    prisma.team.findMany({
      where: { isPlaceholder: true, groupId: { not: null }, replacedByTeamId: null },
      orderBy: [{ group: "asc" }, { name: "asc" }],
      select: { id: true, name: true, group: true, placeholderType: true, replacedByTeamId: true },
    }),
    prisma.match.findMany({
      where: { groupId: null },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: "asc" },
      take: 50,
    }),
    prisma.team.findMany({
      where: { isPlaceholder: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, group: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    placeholders,
    teams,
    ungroupedMatches: ungroupedMatches.map((match) => ({
      id: match.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      date: match.matchDate,
      stadiumName: match.stadiumName,
    })),
  });
}
