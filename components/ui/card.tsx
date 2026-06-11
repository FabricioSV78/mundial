import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-white/12 bg-slate-950/55 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
