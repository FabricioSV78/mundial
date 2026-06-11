import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PredictionStageOption } from "@/lib/predictions";

export function PredictionStageSwitcher({
  options,
  activeStage,
}: {
  options: PredictionStageOption[];
  activeStage?: string;
}) {
  if (!options.length) {
    return null;
  }

  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.12em] text-white">Fases</p>
          <p className="mt-1 text-xs font-semibold text-white/55">
            Tus pronosticos se conservan. Solo cambias la vista de la fase que quieres revisar o jugar.
          </p>
        </div>
        <Badge tone="blue">{options.length} fases disponibles</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.key === activeStage;

          return (
            <Link
              key={option.key}
              href={`/predictions?stage=${option.key}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition",
                active
                  ? "border-emerald-300/35 bg-emerald-300 text-slate-950 shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                  : "border-white/12 bg-white/[0.06] text-white/78 hover:bg-white/[0.1] hover:text-white",
              )}
            >
              <span>{option.label}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-black", active ? "bg-slate-950/15" : "bg-white/10")}>
                {option.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
