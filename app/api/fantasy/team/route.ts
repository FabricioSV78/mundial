import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/currentUser";
import { validateFantasyTeam } from "@/lib/fantasyRules";
import { prisma } from "@/lib/prisma";
import { recalculateUserLeaguePoints } from "@/lib/rankings";
import { fantasyTeamSchema } from "@/lib/validations/fantasy";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = fantasyTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: parsed.error.issues[0]?.message ?? "Equipo fantasy invalido." },
        { status: 400 },
      );
    }

    const players = await prisma.player.findMany({
      where: { id: { in: parsed.data.playerIds } },
      include: { team: true },
    });

    const validation = validateFantasyTeam({
      formation: parsed.data.formation,
      players: players.map((player) => ({
        id: player.id,
        name: player.name,
        country: player.team.name,
        countryCode: player.team.code,
        position: player.position,
        price: player.price,
        points: player.points,
        avatar: player.avatar,
        stats: {
          goals: player.goals,
          assists: player.assists,
          cleanSheets: player.cleanSheets,
          saves: player.saves,
          yellowCards: player.yellowCards,
          redCards: player.redCards,
          minutes: player.minutes,
        },
      })),
    });

    if (!validation.valid) {
      return NextResponse.json(
        { ok: false, message: validation.errors.join(" "), validation },
        { status: 400 },
      );
    }

    const user = await requireCurrentUser();
    const existing = await prisma.fantasyTeam.findFirst({ where: { userId: user.id } });
    const fantasyTeam = existing
      ? await prisma.fantasyTeam.update({
          where: { id: existing.id },
          data: {
            formation: parsed.data.formation,
            budget: 100,
            slots: {
              deleteMany: {},
              create: parsed.data.playerIds.map((playerId) => ({ playerId })),
            },
          },
          include: { slots: true },
        })
      : await prisma.fantasyTeam.create({
          data: {
            userId: user.id,
            formation: parsed.data.formation,
            budget: 100,
            slots: {
              create: parsed.data.playerIds.map((playerId) => ({ playerId })),
            },
          },
          include: { slots: true },
        });
    const ranking = await recalculateUserLeaguePoints(user.id);

    return NextResponse.json({
      ok: true,
      message: "Tu equipo fantasy esta listo.",
      fantasyTeam,
      validation,
      ranking,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { ok: false, message: "Debes iniciar sesion para guardar fantasy." },
        { status: 401 },
      );
    }

    console.error("[api/fantasy/team] save failed", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo guardar el equipo fantasy. Revisa la base de datos." },
      { status: 500 },
    );
  }
}
