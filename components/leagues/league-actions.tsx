"use client";

import confetti from "canvas-confetti";
import { Copy, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MAX_LEAGUES_PER_USER } from "@/lib/leagues";

type ActionState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  inviteCode?: string;
};

export function LeagueActions({
  defaultInviteCode,
  initialLeagueCount,
}: {
  defaultInviteCode: string;
  initialLeagueCount: number;
}) {
  const router = useRouter();
  const [leagueName, setLeagueName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [leagueCount, setLeagueCount] = useState(initialLeagueCount);
  const [state, setState] = useState<ActionState>({
    status: "idle",
    message: "Crea una liga o entra con codigo. Tus pronosticos y fantasy se comparten en las ligas que juegues.",
  });
  const reachedLeagueLimit = leagueCount >= MAX_LEAGUES_PER_USER;

  async function submit(endpoint: string, payload: Record<string, string>) {
    if (reachedLeagueLimit) {
      setState({
        status: "error",
        message: `Llegaste al maximo de ${MAX_LEAGUES_PER_USER} ligas. Sal de una antes de entrar a otra.`,
      });
      return;
    }

    setState({ status: "loading", message: "Procesando jugada..." });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        message?: string;
        league?: { inviteCode?: string };
        leagueCount?: number;
      };

      if (!response.ok) {
        setState({ status: "error", message: data.message ?? "La jugada no pudo completarse." });
        return;
      }

      const nextCode = data.league?.inviteCode ?? defaultInviteCode;
      setState({
        status: "success",
        message: data.message ?? "Listo. La liga quedo guardada.",
        inviteCode: nextCode,
      });
      setLeagueCount(data.leagueCount ?? leagueCount);
      setLeagueName("");
      setInviteCode("");
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
      router.refresh();
    } catch {
      setState({
        status: "error",
        message: "No se pudo conectar con el backend. Revisa que la app y la DB esten corriendo.",
      });
    }
  }

  return (
    <div className="space-y-5">
      <GlassCard className="sport-card">
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <Plus className="size-5 text-amber-200" />
          Crear liga
        </h2>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-white/60">Maximo {MAX_LEAGUES_PER_USER} ligas por usuario.</p>
          <Badge tone={reachedLeagueLimit ? "red" : "green"}>{leagueCount}/{MAX_LEAGUES_PER_USER}</Badge>
        </div>
        <div className="mt-4 space-y-3">
          <Input
            placeholder="Nombre de la liga"
            value={leagueName}
            onChange={(event) => setLeagueName(event.target.value)}
          />
          <Button
            className="w-full"
            disabled={state.status === "loading" || leagueName.length < 3 || reachedLeagueLimit}
            onClick={() => submit("/api/leagues", { name: leagueName })}
          >
            Crear liga
          </Button>
        </div>
      </GlassCard>
      <GlassCard className="sport-card">
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <Users className="size-5 text-emerald-200" />
          Unirme con codigo
        </h2>
        <div className="mt-4 space-y-3">
          <Input
            placeholder="BATTLE26"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
          />
          <Button
            variant="secondary"
            className="w-full"
            disabled={state.status === "loading" || inviteCode.length < 5 || reachedLeagueLimit}
            onClick={() => submit("/api/leagues/join", { inviteCode })}
          >
            Unirme
          </Button>
        </div>
      </GlassCard>
      <GlassCard className="bg-amber-300/12">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-100">
          <Copy className="size-4" />
          Codigo de invitacion
        </p>
        <p className="mt-2 text-3xl font-black">{state.inviteCode ?? defaultInviteCode ?? "-----"}</p>
        <div className="mt-4">
          <Badge tone={state.status === "error" ? "red" : state.status === "success" ? "green" : "gold"}>
            {state.status}
          </Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/68">{state.message}</p>
      </GlassCard>
    </div>
  );
}
