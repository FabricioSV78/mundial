"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SyncState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

function getStoredAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem("admin-sync-token") ?? "";
}

export function AdminSyncPanel() {
  const [token, setToken] = useState(getStoredAdminToken);
  const [state, setState] = useState<SyncState>({
    status: "idle",
    message: "Listo para sincronizar desde el backend.",
  });

  const fetchLatestSync = useCallback(async (nextToken = token) => {
    if (!nextToken) return;

    const response = await fetch("/api/admin/sync/world-cup", {
      headers: { authorization: `Bearer ${nextToken}` },
    });

    if (!response.ok) return;

    const data = (await response.json()) as {
      latest?: { status: string; message: string; createdAt: string } | null;
    };

    if (data.latest) {
      setState({
        status: data.latest.status === "SUCCESS" ? "success" : "error",
        message: `Ultimo sync: ${data.latest.message} (${new Date(
          data.latest.createdAt,
        ).toLocaleString("es")})`,
      });
    }
  }, [token]);

  async function syncWorldCup(includeTimeline = false) {
    setState({
      status: "loading",
      message: includeTimeline
        ? "Sincronizando Mundial y timeline desde TheSportsDB..."
        : "Sincronizando Mundial desde TheSportsDB...",
    });

    try {
      const response = await fetch("/api/admin/sync/world-cup", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ includeTimeline }),
      });
      const data = (await response.json()) as { message?: string };

      setState({
        status: response.ok ? "success" : "error",
        message: data.message ?? "Sin respuesta detallada del servidor.",
      });
      await fetchLatestSync();
    } catch {
      setState({
        status: "error",
        message: "No se pudo contactar el endpoint interno. Los datos existentes siguen intactos.",
      });
    }
  }

  return (
    <GlassCard className="border-emerald-300/25 bg-emerald-400/10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone={state.status === "success" ? "green" : state.status === "error" ? "red" : "gold"}>
            TheSportsDB sync
          </Badge>
          <h2 className="mt-3 text-2xl font-black">Sincronizar Mundial 2026</h2>
          <p className="mt-2 text-sm leading-6 text-white/68">{state.message}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <Input
          type="password"
          placeholder="ADMIN_SYNC_TOKEN"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
        <Button onClick={() => syncWorldCup(false)} disabled={state.status === "loading" || !token}>
          <RefreshCw className="mr-2 size-4" />
          Sincronizar Mundial desde TheSportsDB
        </Button>
        <Button variant="secondary" onClick={() => fetchLatestSync()} disabled={!token}>
          Ver ultimo sync
        </Button>
      </div>
      <div className="mt-3">
        <Button variant="secondary" onClick={() => syncWorldCup(true)} disabled={state.status === "loading" || !token}>
          <RefreshCw className="mr-2 size-4" />
          Sincronizar Mundial + timeline
        </Button>
      </div>
    </GlassCard>
  );
}
