import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { createOfficialGroups2026 } from "@/lib/tournament/officialGroupsService";

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  try {
    const result = await createOfficialGroups2026();
    return NextResponse.json({
      ok: true,
      message: `Grupos oficiales creados: ${result.groups} grupos, ${result.teamsUpserted} selecciones, ${result.matchesUpdated} partidos asignados.`,
      result,
    });
  } catch (error) {
    console.error("[admin/groups/official] failed", error);
    return NextResponse.json(
      { ok: false, message: "No se pudieron crear los grupos oficiales." },
      { status: 500 },
    );
  }
}
