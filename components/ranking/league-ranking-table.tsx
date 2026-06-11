import { Medal, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/card";
import type { LeagueMember } from "@/lib/types";

export function LeagueRankingTable({ members }: { members: LeagueMember[] }) {
  const ranked = [...members].sort(
    (a, b) =>
      b.predictionPoints + b.fantasyPoints - (a.predictionPoints + a.fantasyPoints),
  );

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="grid grid-cols-[56px_1fr_80px] gap-3 border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/45 md:grid-cols-[72px_1fr_120px_120px_120px]">
        <span className="text-center">#</span>
        <span>Usuario</span>
        <span className="text-center">Total</span>
        <span className="hidden text-center md:block">Pron.</span>
        <span className="hidden text-center md:block">Fantasy</span>
      </div>
      {ranked.map((member, index) => {
        const total = member.predictionPoints + member.fantasyPoints;

        return (
          <div
            key={member.id}
            className="grid grid-cols-[56px_1fr_80px] items-center gap-3 border-b border-white/8 px-4 py-4 last:border-0 md:grid-cols-[72px_1fr_120px_120px_120px]"
          >
            <span className="flex items-center justify-center gap-2 font-black">
              {index < 3 ? <Medal className="size-5 text-amber-300" /> : null}
              {index + 1}
            </span>
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-slate-950">
                {member.avatar}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-black">{member.name}</span>
                <span className="flex items-center gap-2 text-xs text-white/50">
                  @{member.username}
                  {member.movement > 0 ? (
                    <TrendingUp className="size-3 text-emerald-300" />
                  ) : member.movement < 0 ? (
                    <TrendingDown className="size-3 text-red-300" />
                  ) : null}
                </span>
              </span>
            </div>
            <div className="flex justify-center">
              <Badge tone={index < 3 ? "gold" : "green"}>{total}</Badge>
            </div>
            <span className="hidden text-center font-bold text-white/75 md:block">
              {member.predictionPoints}
            </span>
            <span className="hidden text-center font-bold text-white/75 md:block">
              {member.fantasyPoints}
            </span>
          </div>
        );
      })}
    </GlassCard>
  );
}
