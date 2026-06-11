import { Badge } from "@/components/ui/badge";

export function MatchScorersList({
  scorers,
}: {
  scorers: Array<{ playerName: string; teamName: string; goals: number; minutes: number[] }>;
}) {
  if (!scorers.length) {
    return (
      <p className="text-sm font-semibold text-white/60">
        Todavia no hay eventos disponibles para este partido.
      </p>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {scorers.map((scorer) => (
        <div key={`${scorer.playerName}-${scorer.teamName}`} className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-black text-white">{scorer.playerName}</p>
              <p className="text-sm text-white/60">{scorer.teamName}</p>
            </div>
            <Badge tone="green">{scorer.goals} gol{scorer.goals === 1 ? "" : "es"}</Badge>
          </div>
          <p className="mt-2 text-sm text-white/65">
            {scorer.minutes.length ? `Minutos: ${scorer.minutes.join(", ")}'` : "Minuto no disponible"}
          </p>
        </div>
      ))}
    </div>
  );
}
