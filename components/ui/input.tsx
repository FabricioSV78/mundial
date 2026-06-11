import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[8px] border border-white/15 bg-slate-950/40 px-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-amber-300",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-[8px] border border-white/15 bg-slate-950/40 px-3 text-sm text-white outline-none transition focus:border-amber-300",
        className,
      )}
      {...props}
    />
  );
}
