import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { getMatchEventsFromDb } from "@/lib/dbData";
import { recalculateFantasyForMatch } from "@/lib/matches/matchTimeline";
import { prisma } from "@/lib/prisma";

const eventSchema = z.object({
  minute: z.number().int().min(0).max(130).optional(),
  eventType: z.enum(["GOAL", "RED_CARD", "YELLOW_CARD", "ASSIST", "SUBSTITUTION", "UNKNOWN"]),
  playerId: z.string().optional().nullable(),
  playerName: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  teamName: z.string().optional().nullable(),
});

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  const params = await props.params;
  const matchId = params.id;
  const events = await getMatchEventsFromDb(matchId);

  return NextResponse.json({ ok: true, events });
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  const params = await props.params;
  const matchId = params.id;
  const body = await request.json();
  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Evento invalido." },
      { status: 400 },
    );
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });

  if (!match) {
    return NextResponse.json({ ok: false, message: "Partido no encontrado." }, { status: 404 });
  }

  const event = await prisma.matchEvent.create({
    data: {
      matchId,
      externalId: `${match.externalId ?? match.id}:manual:${Date.now()}`,
      externalProvider: "MANUAL",
      minute: parsed.data.minute ?? null,
      eventType: parsed.data.eventType,
      playerId: parsed.data.playerId ?? null,
      playerName: parsed.data.playerName ?? null,
      teamId: parsed.data.teamId ?? null,
      teamName: parsed.data.teamName ?? null,
      rawPayload: parsed.data,
    },
  });

  await recalculateFantasyForMatch(matchId);

  return NextResponse.json({ ok: true, event, message: "Evento manual creado y fantasy recalculado." });
}
