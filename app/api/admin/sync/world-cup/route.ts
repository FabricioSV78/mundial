import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rateLimit";
import { getLatestWorldCupSyncLog, syncWorldCupFromTheSportsDb } from "@/lib/sync/worldCupSync";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(buildRateLimitKey(request, "admin-world-cup-sync"), {
    limit: 6,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "Demasiadas sincronizaciones. Espera un momento." },
      { status: 429, headers: { "retry-after": String(rateLimit.retryAfter) } },
    );
  }

  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json(
      { ok: false, message: "No autorizado. Usa un token admin para sincronizar." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await syncWorldCupFromTheSportsDb({
      includeTimeline: Boolean(body?.includeTimeline),
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (error) {
    console.error("[sync/world-cup] failed", error);

    return NextResponse.json(
      {
        ok: false,
        message: "La sincronizacion fallo. Se mantienen los datos ya guardados.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  const latest = await getLatestWorldCupSyncLog();

  return NextResponse.json({
    ok: true,
    latest,
  });
}
