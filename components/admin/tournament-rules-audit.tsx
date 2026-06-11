"use client";

import { AlertTriangle, Download, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";

type AuditRow = {
  teamId: string;
  teamName: string;
  groupName: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  thirdPlaceRank?: number;
  qualifiedStatus?: string;
};

type GroupAudit = {
  groupName: string;
  teamCount: number;
  matchCount: number;
  complete: boolean;
  teamWarnings: string[];
};

type AuditReport = {
  config: {
    totalTeams: number;
    groups: number;
    totalGroupStageMatches: number;
  };
  expectedTeams: number;
  actualTeams: number;
  expectedGroups: number;
  actualGroups: number;
  placeholders: number;
  duplicateTeams: string[];
  matchesWithoutGroupId: number;
  directCount: number;
  bestThirdCount: number;
  eliminatedCount: number;
  projectedCount: number;
  fixtureValidation: {
    isComplete: boolean;
    totalGroups: number;
    groupsWithFourTeams: number;
    totalGroupStageMatches: number;
    expectedGroupStageMatches: number;
    warnings: string[];
    groups: GroupAudit[];
  };
  rankedThirdRows: AuditRow[];
  qualifiedRows: AuditRow[];
  bracket: {
    roundOf32Matches: number;
    roundOf16Matches: number;
    quarterFinalsMatches: number;
    semiFinalsMatches: number;
    thirdPlaceMatches: number;
    finalMatches: number;
    ready: boolean;
  };
};

function getStoredAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem("admin-sync-token") ?? "";
}

export function TournamentRulesAudit({ initialReport }: { initialReport: AuditReport }) {
  const [token] = useState(getStoredAdminToken);
  const [report, setReport] = useState(initialReport);
  const [message, setMessage] = useState("Auditoria lista.");
  const [loading, setLoading] = useState(false);

  async function fetchReport() {
    if (!token) {
      setMessage("Falta ADMIN_SYNC_TOKEN en la sesion admin.");
      return;
    }

    const response = await fetch("/api/admin/tournament-rules/report", {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as AuditReport & { message?: string };

    if (!response.ok) {
      setMessage(data.message ?? "No se pudo cargar el reporte.");
      return;
    }

    setReport(data);
    setMessage("Reporte actualizado.");
  }

  async function runAction(action: string) {
    if (!token) {
      setMessage("Falta ADMIN_SYNC_TOKEN en la sesion admin.");
      return;
    }

    setLoading(true);
    setMessage("Procesando auditoria del torneo...");

    try {
      const response = await fetch("/api/admin/tournament-rules/actions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { message?: string; report?: AuditReport };
      setMessage(data.message ?? "Accion completada.");

      if (data.report) {
        setReport(data.report);
      } else {
        await fetchReport();
      }
    } catch {
      setMessage("No se pudo ejecutar la accion admin.");
    } finally {
      setLoading(false);
    }
  }

  async function exportReport() {
    if (!token) {
      setMessage("Falta ADMIN_SYNC_TOKEN en la sesion admin.");
      return;
    }

    try {
      const response = await fetch("/api/admin/tournament-rules/report?export=1", {
        headers: { authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setMessage("No se pudo exportar el reporte.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "tournament-rules-2026-report.json";
      anchor.click();
      window.URL.revokeObjectURL(url);
      setMessage("Reporte exportado.");
    } catch {
      setMessage("No se pudo exportar el reporte.");
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard className="border-amber-300/20 bg-amber-300/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="gold">Auditoria 2026</Badge>
            <h2 className="mt-3 text-2xl font-black">Reglas del torneo</h2>
            <p className="mt-2 text-sm text-white/68">{message}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void fetchReport()} disabled={loading}>
              <RefreshCw className="mr-2 size-4" />
              Refrescar reporte
            </Button>
            <Button
              variant="secondary"
              onClick={() => void exportReport()}
              disabled={!token}
            >
              <Download className="mr-2 size-4" />
              Exportar reporte
            </Button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => void runAction("recalculate_tables")} disabled={loading || !token}>
            Recalcular tablas
          </Button>
          <Button variant="secondary" onClick={() => void runAction("recalculate_qualified")} disabled={loading || !token}>
            Recalcular clasificados
          </Button>
          <Button variant="secondary" onClick={() => void runAction("validate_rules")} disabled={loading || !token}>
            Validar reglas Mundial 2026
          </Button>
          <Button variant="secondary" onClick={() => void runAction("validate_fixture")} disabled={loading || !token}>
            Validar fixture fase de grupos
          </Button>
          <Button variant="secondary" onClick={() => void runAction("recalculate_bracket")} disabled={loading || !token}>
            Recalcular bracket
          </Button>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard>
          <p className="text-sm font-bold text-white/52">Equipos</p>
          <p className="mt-2 text-3xl font-black">{report.actualTeams}/{report.expectedTeams}</p>
          <p className="mt-1 text-sm text-white/58">{report.placeholders} placeholders activos.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-bold text-white/52">Grupos</p>
          <p className="mt-2 text-3xl font-black">{report.actualGroups}/{report.expectedGroups}</p>
          <p className="mt-1 text-sm text-white/58">{report.fixtureValidation.groupsWithFourTeams} con 4 equipos.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-bold text-white/52">Partidos grupos</p>
          <p className="mt-2 text-3xl font-black">
            {report.fixtureValidation.totalGroupStageMatches}/{report.fixtureValidation.expectedGroupStageMatches}
          </p>
          <p className="mt-1 text-sm text-white/58">{report.matchesWithoutGroupId} partidos sin `groupId`.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-bold text-white/52">Bracket</p>
          <p className="mt-2 text-3xl font-black">{report.bracket.ready ? "Listo" : "Pendiente"}</p>
          <p className="mt-1 text-sm text-white/58">{report.bracket.roundOf32Matches} cruces de dieciseisavos.</p>
        </GlassCard>
      </div>

      {report.fixtureValidation.warnings.length || report.duplicateTeams.length ? (
        <GlassCard className="border-red-300/20 bg-red-400/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-200" />
            <h3 className="text-xl font-black">Advertencias</h3>
          </div>
          <div className="mt-4 space-y-2 text-sm text-white/72">
            {report.fixtureValidation.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
            {report.duplicateTeams.map((team) => (
              <p key={team}>Seleccion duplicada detectada: {team}</p>
            ))}
          </div>
        </GlassCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-200" />
            <h3 className="text-xl font-black">Clasificacion</h3>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm">
              Directos: <span className="font-black">{report.directCount}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm">
              Mejores terceros: <span className="font-black">{report.bestThirdCount}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm">
              Eliminados: <span className="font-black">{report.eliminatedCount}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm">
              Proyectados: <span className="font-black">{report.projectedCount}</span>
            </div>
          </div>

          <h4 className="mt-6 text-lg font-black">Mejores terceros</h4>
          <div className="mt-3 space-y-2">
            {report.rankedThirdRows.map((row) => (
              <div key={row.teamId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                <span className="font-bold">
                  #{row.thirdPlaceRank} {row.teamName} · Grupo {row.groupName}
                </span>
                <span className="text-white/65">
                  {row.points} pts · DG {row.goalDifference} · GF {row.goalsFor}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-black">Revision por grupo</h3>
          <div className="mt-4 space-y-2">
            {report.fixtureValidation.groups.map((group) => (
              <div key={group.groupName} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">Grupo {group.groupName}</p>
                  <Badge tone={group.complete ? "green" : "gold"}>
                    {group.complete ? "Completo" : "Incompleto"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-white/65">
                  {group.teamCount} equipos · {group.matchCount}/6 partidos
                </p>
                {group.teamWarnings.length ? (
                  <div className="mt-2 space-y-1 text-xs text-amber-100/85">
                    {group.teamWarnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
