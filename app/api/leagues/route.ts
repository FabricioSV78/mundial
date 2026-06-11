import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/currentUser";
import { createInviteCode } from "@/lib/invite";
import { MAX_LEAGUES_PER_USER, canJoinMoreLeagues } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";
import { createLeagueSchema } from "@/lib/validations/league";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createLeagueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: parsed.error.issues[0]?.message ?? "Liga invalida." },
        { status: 400 },
      );
    }

    const user = await requireCurrentUser();
    const existingMemberships = await prisma.leagueMember.count({
      where: { userId: user.id },
    });

    if (!canJoinMoreLeagues(existingMemberships)) {
      return NextResponse.json(
        { ok: false, message: `Solo puedes participar en ${MAX_LEAGUES_PER_USER} ligas al mismo tiempo.` },
        { status: 400 },
      );
    }

    let inviteCode = createInviteCode();
    let existing = await prisma.league.findUnique({ where: { inviteCode } });

    while (existing) {
      inviteCode = createInviteCode();
      existing = await prisma.league.findUnique({ where: { inviteCode } });
    }

    const league = await prisma.league.create({
      data: {
        name: parsed.data.name,
        inviteCode,
        members: {
          create: {
            userId: user.id,
            points: 0,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                name: true,
                avatar: true,
                favoriteCountry: true,
                role: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Liga creada. Ya puedes invitar a tu grupo.",
      league,
      leagueCount: existingMemberships + 1,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { ok: false, message: "Debes iniciar sesion para crear una liga." },
        { status: 401 },
      );
    }

    console.error("[api/leagues] create failed", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo crear la liga. Revisa la base de datos." },
      { status: 500 },
    );
  }
}
