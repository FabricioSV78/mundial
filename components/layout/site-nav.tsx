"use client";

import { GitBranch, ListOrdered, Map, Shield, Sparkles, Trophy, Users } from "lucide-react";
import { useLinkStatus } from "next/link";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navIcons = {
  sparkles: Sparkles,
  shield: Shield,
  users: Users,
  listOrdered: ListOrdered,
  gitBranch: GitBranch,
  map: Map,
  trophy: Trophy,
} as const;

export type SiteNavItem = {
  href: string;
  label: string;
  icon: keyof typeof navIcons;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function PendingGlow() {
  const { pending } = useLinkStatus();

  if (!pending) {
    return null;
  }

  return <span className="absolute inset-0 rounded-full border border-emerald-300/60" />;
}

export function SiteNav({
  items,
  mobile = false,
}: {
  items: SiteNavItem[];
  mobile?: boolean;
}) {
  const pathname = usePathname();

  return items.map((item) => {
    const active = isActivePath(pathname, item.href);
    const Icon = navIcons[item.icon];

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch
        transitionTypes={["nav-forward"]}
        className={cn(
          "relative transition",
          mobile
            ? "flex min-w-0 flex-col items-center gap-1 overflow-hidden rounded-[8px] px-1 py-1 text-center text-[11px] font-semibold"
            : "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold",
          active
            ? "bg-emerald-300 text-slate-950 shadow-[0_0_24px_rgba(74,222,128,0.28)]"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <PendingGlow />
        <Icon className={cn(mobile ? "size-5 shrink-0" : "size-4", active ? "text-slate-950" : "")} />
        <span className={cn(mobile ? "max-w-full truncate" : "", active ? "text-slate-950" : "")}>{item.label}</span>
      </Link>
    );
  });
}
