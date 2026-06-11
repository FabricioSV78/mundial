"use client";

import { Clock3, Link2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";

type TimelineSyncState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

function getStoredAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem("admin-sync-token") ?? "";
}

export function AdminMatchTimelinePanel({
  matches,
}: {
  matches: Array<{
    id: string;
    label: string;
    status: string;
    lastSyncedAt?: string;
  }>;
}) {
  const [state, setState] = useState<TimelineSyncState>({
    status: "idle",
    message: "Sincroniza eventos de partidos live/finalizados o entra al detalle para corregir manualmente.",
  });

  async function syncTimeline(matchId?: string) {
    const token = getStoredAdminToken();

    if (!token) {
      setState({ status: "error", message: "Primero valida el token admin." });
      return;
    }

    setState({
      status: "loading",
      message: matchId ? "Sincronizando timeline del partido..." : "Sincronizando timelines recientes...",
    });

    try {
      const response = await fetch("/api/admin/sync/match-timeline", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(matchId ? { matchId } : {}),
      });
      const data = (await response.json()) as { message?: string };

      setState({
        status: response.ok ? "success" : "error",
        message: data.message ?? "Sin respuesta detallada del servidor.",
      });
    } catch {
      setState({
        status: "error",
        message: "Fallo la sincronizacion del timeline. Los eventos guardados siguen intactos.",
      });
    }
  }

  return (
    <GlassCard className="border-sky-300/20 bg-sky-400/10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone={state.status === "success" ? "green" : state.status === "error" ? "red" : "blue"}>
            Timeline de partidos
          </Badge>
          <h2 className="mt-3 text-2xl font-black">Eventos, goles y rojas</h2>
          <p className="mt-2 text-sm leading-6 text-white/68">{state.message}</p>
        </div>
        <Button variant="secondary" onClick={() => syncTimeline()} disabled={state.status === "loading"}>
          <RefreshCw className="mr-2 size-4" />
          Sincronizar timeline de partidos
        </Button>
      </div>

      <div className="mt-5 grid gap-3">
        {matches.slice(0, 8).map((match) => (
          <div
            key={match.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-white/10 bg-slate-950/28 p-3"
          >
            <div>
              <p className="font-black text-white">{match.label}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-white/55">
                <Clock3 className="size-3.5" />
                {match.status} {match.lastSyncedAt ? `· ultimo sync ${new Date(match.lastSyncedAt).toLocaleString("es")}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => syncTimeline(match.id)} disabled={state.status === "loading"}>
                <RefreshCw className="mr-2 size-4" />
                Sincronizar eventos
              </Button>
              <ButtonLink href={`/admin/matches/${match.id}/events`} variant="ghost">
                <Link2 className="mr-2 size-4" />
                Ver eventos
              </ButtonLink>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
