import Image from "next/image";
import { GitBranch, ListOrdered, MapPinned, ShieldAlert, ShieldCheck, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type WorldCupVisualKey, worldCupVisuals } from "@/lib/worldCupVisuals";

const heroIcons = {
  trophy: Trophy,
  shieldCheck: ShieldCheck,
  users: Users,
  listOrdered: ListOrdered,
  gitBranch: GitBranch,
  mapPinned: MapPinned,
  shieldAlert: ShieldAlert,
} as const;

export function SportsHero({
  eyebrow,
  title,
  copy,
  icon,
  visual,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  icon?: keyof typeof heroIcons;
  visual?: WorldCupVisualKey;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = icon ? heroIcons[icon] : null;
  const heroVisual = visual ? worldCupVisuals[visual] : null;

  return (
    <GlassCard className={cn("stadium-hero relative overflow-hidden p-6 md:p-8", className)}>
      {heroVisual ? (
        <>
          <Image
            src={heroVisual.src}
            alt=""
            fill
            sizes="(min-width: 1280px) 1180px, 100vw"
            className={cn(
              "absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.42] saturate-125",
              heroVisual.focus,
            )}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.72)_42%,rgba(2,6,23,0.28)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(0deg,rgba(2,6,23,0.88),transparent)]" />
        </>
      ) : null}
      <div className="relative z-10 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Badge tone="gold">{eyebrow}</Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/68">{copy}</p>
        </div>
        {Icon ? (
          <div className="hidden size-20 place-items-center rounded-full border border-white/20 bg-amber-300 text-slate-950 shadow-[0_0_60px_rgba(250,204,21,0.35)] md:grid">
            <Icon className="size-9" />
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none absolute bottom-5 right-6 z-10 hidden text-right text-[10px] font-black uppercase tracking-[0.34em] text-white/35 md:block">
        Mundial Battle
      </div>
      {children ? <div className="relative z-10 mt-6">{children}</div> : null}
    </GlassCard>
  );
}
