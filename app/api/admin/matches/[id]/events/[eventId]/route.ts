import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { recalculateFantasyForMatch } from "@/lib/matches/matchTimeline";
import { prisma } from "@/lib/prisma";

const eventUpdateSchema = z.object({
  minute: z.number().int().min(0).max(130).optional().nullable(),
  eventType: z.enum(["GOAL", "RED_CARD", "YELLOW_CARD", "ASSIST", "SUBSTITUTION", "UNKNOWN"]).optional(),
  playerId: z.string().optional().nullable(),
  playerName: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  teamName: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string; eventId: string }> },
) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  const params = await props.params;
  const body = await request.json();
  const parsed = eventUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Actualizacion invalida." },
      { status: 400 },
    );
  }

  const event = await prisma.matchEvent.update({
    where: { id: params.eventId },
    data: {
      minute: parsed.data.minute ?? null,
      eventType: parsed.data.eventType,
      playerId: parsed.data.playerId ?? null,
      playerName: parsed.data.playerName ?? null,
      teamId: parsed.data.teamId ?? null,
      teamName: parsed.data.teamName ?? null,
      rawPayload: parsed.data,
    },
  });

  await recalculateFantasyForMatch(params.id);

  return NextResponse.json({ ok: true, event, message: "Evento actualizado y fantasy recalculado." });
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string; eventId: string }> },
) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  const params = await props.params;
  await prisma.matchEvent.delete({ where: { id: params.eventId } });
  await recalculateFantasyForMatch(params.id);

  return NextResponse.json({ ok: true, message: "Evento eliminado y fantasy recalculado." });
}
