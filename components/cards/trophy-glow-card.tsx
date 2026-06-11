import { CalendarClock, Gauge, Goal, Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const trophyIcons = {
  trophy: Trophy,
  goal: Goal,
  calendarClock: CalendarClock,
  gauge: Gauge,
} as const;

export function TrophyGlowCard({
  icon,
  title,
  value,
  copy,
  className,
}: {
  icon: keyof typeof trophyIcons;
  title: string;
  value: string;
  copy: string;
  className?: string;
}) {
  const Icon = trophyIcons[icon];

  return (
    <GlassCard className={cn("trophy-glow-card group overflow-hidden", className)}>
      <div className="relative z-10">
        <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-amber-300 text-slate-950 transition group-hover:scale-110">
          <Icon className="size-6" />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-200">{title}</p>
        <h3 className="mt-2 text-3xl font-black">{value}</h3>
        <p className="mt-3 text-sm leading-6 text-white/65">{copy}</p>
      </div>
    </GlassCard>
  );
}
