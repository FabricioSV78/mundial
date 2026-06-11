import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";
import type { LinkProps } from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-amber-300 text-slate-950 shadow-[0_0_30px_rgba(252,211,77,0.25)] hover:bg-amber-200",
  secondary: "border border-white/15 bg-white/10 text-white hover:bg-white/15",
  danger: "bg-red-500 text-white hover:bg-red-400",
  ghost: "text-white/80 hover:bg-white/10 hover:text-white",
};

type ButtonVariant = keyof typeof variants;

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-300/70 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: LinkProps & {
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
}) {
  return (
    <Link
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-300/70",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
