import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { recalculateFantasyForMatch } from "@/lib/matches/matchTimeline";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  const params = await props.params;
  const result = await recalculateFantasyForMatch(params.id);

  return NextResponse.json({
    ok: true,
    result,
    message: `Fantasy recalculado: ${result.created} logs actualizados.`,
  });
}
