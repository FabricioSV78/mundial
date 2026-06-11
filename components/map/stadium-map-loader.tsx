"use client";

import dynamic from "next/dynamic";
import { GlassCard } from "@/components/ui/card";
import type { Match, Stadium } from "@/lib/types";

const StadiumMap = dynamic(
  () => import("@/components/map/stadium-map").then((mod) => mod.StadiumMap),
  {
    ssr: false,
    loading: () => (
      <GlassCard className="grid h-[620px] place-items-center text-white/60">
        Cargando mapa interactivo...
      </GlassCard>
    ),
  },
);

export function StadiumMapLoader({
  stadiums,
  matches,
}: {
  stadiums: Stadium[];
  matches: Match[];
}) {
  return <StadiumMap stadiums={stadiums} matches={matches} />;
}
