import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/currentUser";
import { MAX_LEAGUES_PER_USER, canJoinMoreLeagues } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";
import { joinLeagueSchema } from "@/lib/validations/league";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = joinLeagueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: parsed.error.issues[0]?.message ?? "Codigo invalido." },
        { status: 400 },
      );
    }

    const user = await requireCurrentUser();
    const league = await prisma.league.findUnique({
      where: { inviteCode: parsed.data.inviteCode.toUpperCase() },
    });

    if (!league) {
      return NextResponse.json(
        { ok: false, message: "No encontramos una liga con ese codigo." },
        { status: 404 },
      );
    }

    const existingMembership = await prisma.leagueMember.findUnique({
      where: { userId_leagueId: { userId: user.id, leagueId: league.id } },
    });

    if (existingMembership) {
      const leagueCount = await prisma.leagueMember.count({ where: { userId: user.id } });

      return NextResponse.json(
        {
          ok: false,
          message: "Ya formas parte de esta liga.",
          league,
          member: existingMembership,
          leagueCount,
        },
        { status: 409 },
      );
    }

    const existingMemberships = await prisma.leagueMember.count({
      where: { userId: user.id },
    });

    if (!canJoinMoreLeagues(existingMemberships)) {
      return NextResponse.json(
        { ok: false, message: `Solo puedes participar en ${MAX_LEAGUES_PER_USER} ligas al mismo tiempo.` },
        { status: 400 },
      );
    }

    const member = await prisma.leagueMember.create({
      data: { userId: user.id, leagueId: league.id },
    });

    return NextResponse.json({
      ok: true,
      message: "Te uniste a la liga. Bienvenido a la batalla.",
      league,
      member,
      leagueCount: existingMemberships + 1,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { ok: false, message: "Debes iniciar sesion para unirte a una liga." },
        { status: 401 },
      );
    }

    console.error("[api/leagues/join] failed", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo unir a la liga. Revisa la base de datos." },
      { status: 500 },
    );
  }
}
