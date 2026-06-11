import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { assignWorldCupMatchesToOfficialGroups, buildTournamentRulesAudit } from "@/lib/tournament/officialGroupsService";

const validActions = new Set([
  "recalculate_tables",
  "recalculate_qualified",
  "validate_rules",
  "validate_fixture",
  "recalculate_bracket",
]);

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { action?: string };

    if (!body.action || !validActions.has(body.action)) {
      return NextResponse.json({ ok: false, message: "Accion admin invalida." }, { status: 400 });
    }

    let message = "Auditoria recalculada.";

    if (
      body.action === "recalculate_tables" ||
      body.action === "recalculate_qualified" ||
      body.action === "recalculate_bracket"
    ) {
      const matchesUpdated = await assignWorldCupMatchesToOfficialGroups();
      message = `Operacion completada. ${matchesUpdated} partidos revisados para grupos oficiales.`;
    }

    if (body.action === "validate_rules") {
      message = "Reglas del Mundial 2026 auditadas.";
    }

    if (body.action === "validate_fixture") {
      message = "Fixture de fase de grupos auditado.";
    }

    const report = await buildTournamentRulesAudit({
      liveProjection: body.action === "recalculate_bracket",
    });

    return NextResponse.json({ ok: true, message, report });
  } catch (error) {
    console.error("[admin/tournament-rules/actions] failed", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo ejecutar la accion del torneo." },
      { status: 500 },
    );
  }
}
