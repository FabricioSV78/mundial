import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { LeagueSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LeagueSwitcher({
  pathname,
  leagues,
  activeLeagueId,
  className,
}: {
  pathname: string;
  leagues: LeagueSummary[];
  activeLeagueId?: string;
  className?: string;
}) {
  if (!leagues.length) {
    return null;
  }

  return (
    <div className={cn("rounded-[14px] border border-white/12 bg-white/[0.06] p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/45">Tus ligas</p>
        </div>
        <Badge tone="blue">{leagues.length} activas</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {leagues.map((league) => (
          <Link
            key={league.id}
            href={`${pathname}?league=${encodeURIComponent(league.id)}`}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-bold transition",
              league.id === activeLeagueId
                ? "border-emerald-300 bg-emerald-300 text-slate-950"
                : "border-white/12 bg-white/[0.05] text-white/75 hover:bg-white/10 hover:text-white",
            )}
          >
            {league.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
