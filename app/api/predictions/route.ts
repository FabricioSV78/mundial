import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/currentUser";
import { isPredictionLocked } from "@/lib/predictions";
import { prisma } from "@/lib/prisma";
import { recalculateUserLeaguePoints } from "@/lib/rankings";
import { getOfficialKickoffDate } from "@/lib/officialKickoffs";
import { predictionSchema } from "@/lib/validations/prediction";
import { z } from "zod";

const savePredictionSchema = predictionSchema.extend({
  matchId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = savePredictionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: parsed.error.issues[0]?.message ?? "Pronostico invalido." },
        { status: 400 },
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: parsed.data.matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      return NextResponse.json(
        { ok: false, message: "El partido no existe en la base de datos. Ejecuta el seed o sync." },
        { status: 404 },
      );
    }

    const officialKickoff = getOfficialKickoffDate({
      homeTeamName: match.homeTeam.name,
      awayTeamName: match.awayTeam.name,
      stadiumName: match.stadiumName,
      matchDate: match.matchDate,
    }) ?? match.matchDate;

    if (isPredictionLocked(officialKickoff)) {
      return NextResponse.json(
        { ok: false, message: "Partido bloqueado: ya comenzo." },
        { status: 423 },
      );
    }

    const user = await requireCurrentUser();
    const scorer = parsed.data.scorer?.trim() || null;
    const prediction = await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId: match.id } },
      update: {
        homeGoals: parsed.data.homeGoals,
        awayGoals: parsed.data.awayGoals,
        scorer,
        winnerTeamId: parsed.data.winnerTeamId || null,
      },
      create: {
        userId: user.id,
        matchId: match.id,
        homeGoals: parsed.data.homeGoals,
        awayGoals: parsed.data.awayGoals,
        scorer,
        winnerTeamId: parsed.data.winnerTeamId || null,
      },
    });
    const ranking = await recalculateUserLeaguePoints(user.id);

    return NextResponse.json({
      ok: true,
      message: "¡Pronostico guardado!",
      prediction,
      ranking,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { ok: false, message: "Debes iniciar sesion para guardar pronosticos." },
        { status: 401 },
      );
    }

    console.error("[api/predictions] save failed", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo guardar el pronostico. Revisa la base de datos." },
      { status: 500 },
    );
  }
}
