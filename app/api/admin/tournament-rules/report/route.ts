import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { buildTournamentRulesAudit } from "@/lib/tournament/officialGroupsService";

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const exportMode = url.searchParams.get("export") === "1";
    const report = await buildTournamentRulesAudit();

    if (exportMode) {
      return new NextResponse(JSON.stringify(report, null, 2), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": "attachment; filename=\"tournament-rules-2026-report.json\"",
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("[admin/tournament-rules/report] failed", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo generar el reporte del torneo." },
      { status: 500 },
    );
  }
}
