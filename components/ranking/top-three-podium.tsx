import type { LeagueMember } from "@/lib/types";

export function TopThreePodium({ members }: { members: LeagueMember[] }) {
  const top = [...members]
    .sort((a, b) => b.predictionPoints + b.fantasyPoints - (a.predictionPoints + a.fantasyPoints))
    .slice(0, 3);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="grid items-end gap-3 sm:grid-cols-3">
      {top.map((member, index) => (
        <div
          key={member.id}
          className="sport-card rounded-[14px] border border-white/12 bg-white/[0.08] p-5 text-center shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:-translate-y-1"
          style={{ minHeight: `${220 - index * 30}px` }}
        >
          <div className="relative z-10 mx-auto grid size-16 place-items-center rounded-full bg-amber-300 text-lg font-black text-slate-950">
            {member.avatar}
          </div>
          <p className="relative z-10 mt-4 text-4xl font-black text-amber-200">
            {medals[index]} #{index + 1}
          </p>
          <h3 className="relative z-10 mt-2 font-black">{member.name}</h3>
          <p className="relative z-10 text-sm text-white/55">
            {member.predictionPoints + member.fantasyPoints} pts
          </p>
        </div>
      ))}
    </div>
  );
}
