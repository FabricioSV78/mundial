"use client";

import { Flag, RefreshCw, Trophy } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";

type PlaceholderTeam = {
  id: string;
  name: string;
  group: string;
  placeholderType: string | null;
  replacedByTeamId: string | null;
};

type AdminTeam = {
  id: string;
  name: string;
  group: string;
};

type UngroupedMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  stadiumName: string | null;
};

type StatusResponse = {
  ok?: boolean;
  message?: string;
  placeholders: PlaceholderTeam[];
  teams: AdminTeam[];
  ungroupedMatches: UngroupedMatch[];
};

function getStoredAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem("admin-sync-token") ?? "";
}

export function OfficialGroupsAdmin() {
  const [token, setToken] = useState(getStoredAdminToken);
  const [message, setMessage] = useState("Listo para crear o recalcular grupos oficiales.");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [placeholderTeamId, setPlaceholderTeamId] = useState("");
  const [realTeamId, setRealTeamId] = useState("");

  const adminFetch = useCallback(async (path: string, init?: RequestInit, nextToken = token) => {
    return fetch(path, {
      ...init,
      headers: {
        ...init?.headers,
        authorization: `Bearer ${nextToken}`,
      },
    });
  }, [token]);

  const loadStatus = useCallback(async (nextToken = token) => {
    if (!nextToken) return;

    const response = await adminFetch("/api/admin/groups/status", undefined, nextToken);
    const data = (await response.json()) as StatusResponse;

    if (!response.ok) {
      setMessage(data.message ?? "No se pudo leer el estado de grupos.");
      return;
    }

    setStatus(data);
    setPlaceholderTeamId((current) => current || data.placeholders[0]?.id || "");
    setRealTeamId((current) => current || data.teams[0]?.id || "");
  }, [adminFetch, token]);

  async function runAction(path: string, body?: unknown) {
    setLoading(true);
    setMessage("Procesando cambios de grupos oficiales...");

    try {
      const response = await adminFetch(path, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await response.json()) as { message?: string };
      setMessage(data.message ?? "Operacion completada.");
      await loadStatus();
    } catch {
      setMessage("No se pudo contactar el endpoint admin de grupos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="border-amber-300/25 bg-amber-300/10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone="gold">Grupos oficiales</Badge>
          <h2 className="mt-3 flex items-center gap-2 text-2xl font-black">
            <Trophy className="size-5 text-amber-200" />
            Mundial 2026 A-L
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/68">{message}</p>
        </div>
        <Button variant="secondary" onClick={() => loadStatus()} disabled={loading || !token}>
          <RefreshCw className="mr-2 size-4" />
          Refrescar estado
        </Button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <Input
          type="password"
          placeholder="ADMIN_SYNC_TOKEN"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
        <Button onClick={() => runAction("/api/admin/groups/official")} disabled={loading || !token}>
          Crear grupos oficiales 2026
        </Button>
        <Button
          variant="secondary"
          onClick={() => runAction("/api/admin/groups/recalculate")}
          disabled={loading || !token}
        >
          Recalcular tablas
        </Button>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
          <h3 className="flex items-center gap-2 font-black">
            <Flag className="size-4 text-emerald-200" />
            Reemplazar placeholder
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Select value={placeholderTeamId} onChange={(event) => setPlaceholderTeamId(event.target.value)}>
              {(status?.placeholders ?? []).map((team) => (
                <option key={team.id} value={team.id}>
                  Grupo {team.group} - {team.name}
                </option>
              ))}
            </Select>
            <Select value={realTeamId} onChange={(event) => setRealTeamId(event.target.value)}>
              {(status?.teams ?? []).map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} {team.group !== "Sin grupo" ? `(Grupo ${team.group})` : ""}
                </option>
              ))}
            </Select>
            <Button
              onClick={() =>
                runAction("/api/admin/groups/replace-placeholder", {
                  placeholderTeamId,
                  realTeamId,
                })
              }
              disabled={loading || !token || !placeholderTeamId || !realTeamId}
            >
              Reemplazar
            </Button>
          </div>
          <p className="mt-3 text-xs text-white/55">
            Asigna el grupo al equipo real, reasigna partidos y deja el placeholder marcado como reemplazado.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
          <h3 className="font-black">Partidos sin grupo asignado</h3>
          <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
            {(status?.ungroupedMatches ?? []).length ? (
              status!.ungroupedMatches.map((match) => (
                <div key={match.id} className="rounded-xl border border-white/8 bg-white/[0.04] p-3 text-sm">
                  <p className="font-bold">
                    {match.homeTeam} vs {match.awayTeam}
                  </p>
                  <p className="text-xs text-white/55">
                    {new Date(match.date).toLocaleString("es")} · {match.stadiumName ?? "Sede por confirmar"}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                No hay partidos pendientes de revision.
              </p>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
