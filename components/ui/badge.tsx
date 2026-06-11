import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  green: "border-emerald-300/30 bg-emerald-400/15 text-emerald-100",
  blue: "border-sky-300/30 bg-sky-400/15 text-sky-100",
  gold: "border-amber-300/40 bg-amber-300/20 text-amber-100",
  red: "border-red-300/40 bg-red-400/15 text-red-100",
  slate: "border-white/15 bg-white/10 text-white/80",
};

export function Badge({
  className,
  tone = "slate",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
