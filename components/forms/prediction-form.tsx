"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import confetti from "canvas-confetti";
import { Save, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isPredictionLocked } from "@/lib/predictions";
import { PREDICTION_SYNC_STORAGE_KEY } from "@/lib/predictionSync";
import { isSameComparableName } from "@/lib/scoring";
import { predictionSchema } from "@/lib/validations/prediction";

type PredictionValues = z.input<typeof predictionSchema>;
type SavedPrediction = {
  homeGoals: number;
  awayGoals: number;
  scorer: string;
};

export function PredictionForm({
  locked,
  startsAt,
  scorerOptions = [],
  matchId,
  defaultValues,
}: {
  locked?: boolean;
  startsAt?: string;
  scorerOptions?: string[];
  matchId: string;
  defaultValues?: Partial<PredictionValues>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [now, setNow] = useState(() => Date.now());
  const [scorerQuery, setScorerQuery] = useState(defaultValues?.scorer ?? "");
  const [scorerFocused, setScorerFocused] = useState(false);
  const [savedPrediction, setSavedPrediction] = useState<SavedPrediction | null>(
    defaultValues?.homeGoals !== undefined && defaultValues?.awayGoals !== undefined
      ? {
          homeGoals: Number(defaultValues.homeGoals),
          awayGoals: Number(defaultValues.awayGoals),
          scorer: defaultValues.scorer ?? "",
        }
      : null,
  );
  const lockedByTime = startsAt ? isPredictionLocked(startsAt, new Date(now)) : false;
  const isLocked = locked || lockedByTime || savedPrediction !== null;
  const scorerEnabled = scorerOptions.length > 0;
  const form = useForm<PredictionValues>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      homeGoals: defaultValues?.homeGoals ?? 1,
      awayGoals: defaultValues?.awayGoals ?? 1,
      scorer: defaultValues?.scorer ?? "",
    },
  });
  const filteredScorerOptions = useMemo(() => {
    const normalizedQuery = scorerQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return scorerOptions.slice(0, 8);
    }

    return scorerOptions
      .filter((option) => option.toLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  }, [scorerOptions, scorerQuery]);

  function resolveCanonicalScorer(value?: string) {
    return scorerOptions.find((option) => isSameComparableName(option, value));
  }

  function selectScorer(option: string) {
    setScorerQuery(option);
    form.setValue("scorer", option, { shouldValidate: true });
    setScorerFocused(false);
  }

  function notifyPredictionUpdated(updatedAt?: string) {
    window.localStorage.setItem(PREDICTION_SYNC_STORAGE_KEY, updatedAt ?? "updated");
  }

  async function onSubmit(values: PredictionValues) {
    const canonicalScorer = values.scorer ? resolveCanonicalScorer(values.scorer) : undefined;

    if (values.scorer && scorerEnabled && !canonicalScorer) {
      setStatus("error");
      setMessage("Elige un goleador de la lista para que coincida con la API.");
      return;
    }

    setStatus("loading");
    setMessage("Guardando pronostico...");

    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, scorer: canonicalScorer ?? "", matchId }),
      });
      const data = (await response.json()) as {
        message?: string;
        prediction?: { updatedAt?: string };
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message ?? "No se pudo guardar el pronostico.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "¡Pronostico guardado!");
      setSavedPrediction({
        homeGoals: Number(values.homeGoals),
        awayGoals: Number(values.awayGoals),
        scorer: canonicalScorer ?? "",
      });
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.8 } });
      notifyPredictionUpdated(data.prediction?.updatedAt);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("No se pudo contactar el backend. Revisa la DB y vuelve a intentar.");
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      {savedPrediction ? (
        <div className="rounded-[10px] border border-emerald-300/20 bg-emerald-400/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100/75">Tu pronostico</p>
          <p className="mt-2 text-2xl font-black">
            {savedPrediction.homeGoals} - {savedPrediction.awayGoals}
          </p>
          <p className="mt-1 text-sm text-white/65">
            {savedPrediction.scorer ? `Goleador: ${savedPrediction.scorer}` : "Sin goleador marcado."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <Input
              aria-label="Goles local"
              type="number"
              min={0}
              disabled={isLocked}
              {...form.register("homeGoals")}
            />
            <span className="font-black text-white/50">-</span>
            <Input
              aria-label="Goles visitante"
              type="number"
              min={0}
              disabled={isLocked}
              {...form.register("awayGoals")}
            />
          </div>
          {scorerEnabled ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                <Input
                  placeholder="Busca el goleador del partido"
                  disabled={isLocked}
                  value={scorerQuery}
                  onFocus={() => setScorerFocused(true)}
                  onBlur={() => {
                    window.setTimeout(() => setScorerFocused(false), 120);
                  }}
                  onChange={(event) => {
                    setScorerQuery(event.target.value);
                    form.setValue("scorer", event.target.value, { shouldValidate: true });
                  }}
                  className="pl-9 pr-10"
                />
                {scorerQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setScorerQuery("");
                      form.setValue("scorer", "", { shouldValidate: true });
                      setScorerFocused(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white"
                    aria-label="Limpiar goleador"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
              {scorerFocused && filteredScorerOptions.length ? (
                <div className="max-h-48 overflow-auto rounded-[10px] border border-white/10 bg-slate-950/80 p-2">
                  {filteredScorerOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectScorer(option)}
                      className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-sm font-semibold text-white/80 transition hover:bg-white/8 hover:text-white"
                    >
                      <span>{option}</span>
                      {isSameComparableName(option, scorerQuery) ? (
                        <span className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">ok</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="rounded-[8px] bg-white/8 p-3 text-xs font-semibold text-white/55">
              Sin lista de jugadores sincronizada todavia. Ejecuta el sync para habilitar el buscador de goleador.
            </p>
          )}
          <Button type="submit" disabled={isLocked || status === "loading"} className="w-full">
            <Save className="mr-2 size-4" />
            {isLocked ? "Pronostico bloqueado" : status === "loading" ? "Guardando..." : "Guardar pronostico"}
          </Button>
        </>
      )}
      {message && (
        <p className={status === "error" ? "text-sm font-semibold text-red-200" : "text-sm font-semibold text-emerald-200"}>
          {message}
        </p>
      )}
    </form>
  );
}
