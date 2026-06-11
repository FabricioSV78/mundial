"use client";

import confetti from "canvas-confetti";
import { AlertTriangle, Goal, Lock, Save, ShieldAlert, Trophy } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { validateFantasyTeam } from "@/lib/fantasyRules";
import { fantasyScoringRules } from "@/lib/scoring";
import type { Formation, Player } from "@/lib/types";

export function FantasySavePanel({
  players,
  formation,
  playerIds,
  locked = false,
  onSaved,
}: {
  players: Player[];
  formation: Formation;
  playerIds: string[];
  locked?: boolean;
  onSaved?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const validation = validateFantasyTeam({ players, formation });

  async function saveTeam() {
    if (!validation.valid) {
      setStatus("error");
      setMessage("Corrige las reglas antes de guardar tu equipo.");
      return;
    }

    setStatus("loading");
    setMessage("Guardando equipo fantasy...");

    try {
      const response = await fetch("/api/fantasy/team", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formation, playerIds }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message ?? "No se pudo guardar el equipo.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "¡Equipo fantasy guardado!");
      onSaved?.();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.8 } });
    } catch {
      setStatus("error");
      setMessage("No se pudo contactar el backend. Revisa la DB y vuelve a intentar.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <p className="text-sm font-bold text-white/50">Formacion activa</p>
          <p className="mt-2 text-3xl font-black">{formation}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-bold text-white/50">Jugadores elegidos</p>
          <p className="mt-2 text-3xl font-black">{players.length}/11</p>
        </GlassCard>
        <GlassCard className={validation.valid ? "border-emerald-300/30 bg-emerald-300/10" : "border-amber-300/30 bg-amber-300/10"}>
          <p className="flex items-center gap-2 text-sm font-bold text-amber-100">
            <AlertTriangle className="size-4" />
            Reglas fantasy
          </p>
          <div className="mt-2 space-y-1 text-sm text-white/68">
            {validation.errors.length ? (
              validation.errors.map((error) => <p key={error}>{error}</p>)
            ) : (
              <p>Equipo valido. Puedes guardar sin sancion.</p>
            )}
            {validation.warnings.map((warning) => (
              <p key={warning} className="text-amber-100">
                {warning}
              </p>
            ))}
          </div>
        </GlassCard>
      </div>
      <GlassCard className="border-sky-300/20 bg-sky-400/10">
        <div className="flex items-center gap-2 text-sm font-bold text-sky-100">
          <Goal className="size-4" />
          Reglas de puntuacion
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[10px] border border-white/10 bg-slate-950/30 p-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-white/45">Ataque</p>
            <p className="mt-2 text-sm font-semibold text-white">Gol de un chocolatero de tus 11: +{fantasyScoringRules.goal}</p>
          </div>
          <div className="rounded-[10px] border border-white/10 bg-slate-950/30 p-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/45">
              <Trophy className="size-3.5" />
              Resultado
            </p>
            <p className="mt-2 text-sm font-semibold text-white">Si el equipo del jugador gana: +{fantasyScoringRules.teamWin}</p>
          </div>
          <div className="rounded-[10px] border border-white/10 bg-slate-950/30 p-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/45">
              <ShieldAlert className="size-3.5" />
              Tarjetas
            </p>
            <p className="mt-2 text-sm font-semibold text-white">Si ve roja: +{fantasyScoringRules.redCard}</p>
          </div>
        </div>
      </GlassCard>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={saveTeam} disabled={locked || !validation.valid || status === "loading"}>
          {locked ? <Lock className="mr-2 size-4" /> : <Save className="mr-2 size-4" />}
          {locked ? "Equipo guardado" : status === "loading" ? "Guardando..." : "Guardar equipo"}
        </Button>
        <Badge tone={locked ? "gold" : validation.valid ? "green" : "red"}>
          {locked ? "Arrastre bloqueado" : validation.valid ? "Listo para guardar" : "Reglas incumplidas"}
        </Badge>
        {message ? (
          <p className={status === "error" ? "text-sm font-semibold text-red-200" : "text-sm font-semibold text-emerald-200"}>
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
