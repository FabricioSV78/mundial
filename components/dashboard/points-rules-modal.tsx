"use client";

import { HelpCircle, ShieldAlert, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fantasyScoringRules } from "@/lib/scoring";

function formatPoints(points: number) {
  return points > 0 ? `+${points}` : `${points}`;
}

const predictionRules = [
  { label: "Marcador exacto", points: "+5", copy: "Aciertas los goles de ambos equipos." },
  { label: "Ganador correcto", points: "+3", copy: "Aciertas si gana local, visitante o empatan." },
  { label: "Diferencia de gol", points: "+2", copy: "Aciertas la diferencia aunque falle el marcador exacto." },
  { label: "Goleador", points: "+2", copy: "Tu jugador cuenta si aparece entre cualquier goleador real del partido." },
];

export function PointsRulesModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="gap-2">
        <HelpCircle className="size-4" />
        Reglas / sistema de puntos
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/78 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="points-rules-title"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[24px] border border-white/14 bg-slate-950 shadow-2xl shadow-black/50"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#22c55e,#facc15,#ef4444)]" />
            <button
              type="button"
              className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-white/10 bg-white/8 text-white/70 transition hover:bg-white/14 hover:text-white"
              aria-label="Cerrar reglas"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </button>

            <div className="p-5 sm:p-7">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200/75">
                  Battle Mundial
                </p>
                <h2 id="points-rules-title" className="mt-3 text-3xl font-black">
                  Reglas y sistema de puntos
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  Los puntos se actualizan cuando el partido termina y el admin sincroniza resultados/timeline desde TheSportsDB.
                </p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <section className="rounded-[18px] border border-emerald-300/18 bg-emerald-400/10 p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-5 text-emerald-200" />
                    <h3 className="text-xl font-black">Pronosticos</h3>
                  </div>
                  <p className="mt-2 text-sm text-white/60">
                    El goleador suma si está entre todos los jugadores que marcaron, aunque no sea el primero.
                  </p>
                  <div className="mt-4 space-y-3">
                    {predictionRules.map((rule) => (
                      <div key={rule.label} className="rounded-[14px] border border-white/10 bg-slate-950/45 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-black text-white">{rule.label}</p>
                          <span className="rounded-full bg-emerald-300 px-3 py-1 text-sm font-black text-slate-950">
                            {rule.points}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-white/58">{rule.copy}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 rounded-[12px] border border-amber-300/18 bg-amber-300/10 p-3 text-sm font-semibold text-amber-50">
                    Maximo por pronostico: +7 si aciertas marcador exacto y goleador.
                  </p>
                </section>

                <section className="rounded-[18px] border border-sky-300/18 bg-sky-400/10 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-5 text-sky-200" />
                    <h3 className="text-xl font-black">Once fantasy</h3>
                  </div>
                  <p className="mt-2 text-sm text-white/60">
                    Solo cuentan los jugadores guardados en tu once fantasy al momento de la competencia.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[14px] border border-white/10 bg-slate-950/45 p-3">
                      <p className="font-black">Gol del jugador</p>
                      <p className="mt-2 text-2xl font-black text-emerald-200">{formatPoints(fantasyScoringRules.goal)}</p>
                    </div>
                    <div className="rounded-[14px] border border-white/10 bg-slate-950/45 p-3">
                      <p className="font-black">Gana su seleccion</p>
                      <p className="mt-2 text-2xl font-black text-emerald-200">{formatPoints(fantasyScoringRules.teamWin)}</p>
                    </div>
                    <div className="rounded-[14px] border border-white/10 bg-slate-950/45 p-3">
                      <p className="font-black">Arquero con arco en cero</p>
                      <p className="mt-2 text-2xl font-black text-emerald-200">{formatPoints(fantasyScoringRules.cleanSheet)}</p>
                    </div>
                    <div className="rounded-[14px] border border-white/10 bg-slate-950/45 p-3">
                      <p className="font-black">Tarjetas</p>
                      <p className="mt-2 text-lg font-black text-red-200">
                        Amarilla {formatPoints(fantasyScoringRules.yellowCard)} · Roja {formatPoints(fantasyScoringRules.redCard)}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
