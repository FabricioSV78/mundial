import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { syncRecentMatchTimelines } from "@/lib/matches/matchTimeline";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(buildRateLimitKey(request, "admin-timeline-sync"), {
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "Demasiadas sincronizaciones de eventos. Espera un momento." },
      { status: 429, headers: { "retry-after": String(rateLimit.retryAfter) } },
    );
  }

  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json(
      { ok: false, message: "No autorizado. Usa un token admin para sincronizar timeline." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await syncRecentMatchTimelines(body?.matchId);

    return NextResponse.json({
      ...result,
      message: `Timeline listo: ${result.events} eventos, ${result.goals} goles y ${result.redCards} rojas.`,
    });
  } catch (error) {
    console.error("[sync/match-timeline] failed", error);

    return NextResponse.json(
      { ok: false, message: "La sincronizacion de timeline fallo. Se mantienen los eventos ya guardados." },
      { status: 500 },
    );
  }
}
