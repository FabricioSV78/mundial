import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { assignWorldCupMatchesToOfficialGroups } from "@/lib/tournament/officialGroupsService";

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  try {
    const matchesUpdated = await assignWorldCupMatchesToOfficialGroups();

    return NextResponse.json({
      ok: true,
      message: `Tablas listas y ${matchesUpdated} partidos reasignados a grupos oficiales.`,
      result: { matchesUpdated },
    });
  } catch (error) {
    console.error("[admin/groups/recalculate] failed", error);
    return NextResponse.json({ ok: false, message: "No se pudieron recalcular los grupos." }, { status: 500 });
  }
}
