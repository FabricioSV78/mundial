"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

const labelMap: Record<string, string> = {
  auth: "Entrar",
  admin: "Admin",
  dashboard: "Dashboard",
  predictions: "Pronosticos",
  fantasy: "Fantasy",
  groups: "Grupos",
  bracket: "Bracket",
  map: "Mapa",
  ranking: "Ranking",
  leagues: "Ligas",
  matches: "Partidos",
  events: "Eventos",
};

function looksLikeDynamicId(segment: string) {
  return /^[a-z0-9]{12,}$/i.test(segment);
}

function formatSegmentLabel(segment: string, previousSegment?: string) {
  if (labelMap[segment]) {
    return labelMap[segment];
  }

  if (looksLikeDynamicId(segment)) {
    if (previousSegment === "matches") {
      return "Detalle";
    }

    return "Registro";
  }

  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function buildItemsFromPathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length) {
    return [];
  }

  const items: BreadcrumbItem[] = [{ label: "Inicio", href: "/" }];
  let href = "";

  for (const [index, segment] of segments.entries()) {
    href += `/${segment}`;
    const previousSegment = segments[index - 1];
    const isLast = index === segments.length - 1;

    items.push({
      label: formatSegmentLabel(segment, previousSegment),
      href: isLast || looksLikeDynamicId(segment) ? undefined : href,
    });
  }

  return items;
}

export function BreadcrumbTrail({
  items,
  className,
}: {
  items?: BreadcrumbItem[] | false;
  className?: string;
}) {
  const pathname = usePathname();

  if (items === false || pathname === "/") {
    return null;
  }

  const resolvedItems = items?.length ? items : buildItemsFromPathname(pathname);

  if (resolvedItems.length < 2) {
    return null;
  }

  return (
    <div className={cn("border-b border-white/8 bg-white/[0.03]", className)}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 text-sm">
        {resolvedItems.map((item, index) => {
          const isLast = index === resolvedItems.length - 1;

          return (
            <div key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="font-semibold text-white/55 transition hover:text-white">
                  {item.label}
                </Link>
              ) : (
                <span className={cn("font-semibold", isLast ? "text-white" : "text-white/55")}>{item.label}</span>
              )}
              {!isLast ? <ChevronRight className="size-4 text-white/28" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
