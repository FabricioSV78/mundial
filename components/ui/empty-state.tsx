import { Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/card";

export function EmptyState({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <GlassCard className="grid place-items-center py-12 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-amber-300 text-slate-950">
        <Trophy className="size-8" />
      </div>
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-white/62">{copy}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </GlassCard>
  );
}
