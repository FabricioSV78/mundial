"use client";

import { X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Match, Stadium } from "@/lib/types";
import { formatMatchDate, formatNumber } from "@/lib/utils";

const STADIUM_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80";

export function StadiumModal({
  stadium,
  matches,
  onClose,
}: {
  stadium: Stadium;
  matches: Match[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-end bg-slate-950/70 p-4 backdrop-blur-sm md:place-items-center">
      <section className="w-full max-w-2xl overflow-hidden rounded-[8px] border border-white/15 bg-slate-950 text-white shadow-2xl">
        <div className="relative h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={stadium.image || STADIUM_IMAGE_FALLBACK}
            alt={stadium.name}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-slate-950/80"
            aria-label="Cerrar modal"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-5 p-5">
          <div>
            <Badge tone="gold">{formatNumber(stadium.capacity)} asistentes</Badge>
            <h2 className="mt-3 text-3xl font-black">{stadium.name}</h2>
            <p className="text-white/60">
              {stadium.city}, {stadium.country}
            </p>
          </div>
          <p className="rounded-[8px] bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
            {stadium.funFact}
          </p>
          <div className="space-y-2">
            <h3 className="font-black">Partidos en esta sede</h3>
            {matches.length ? (
              matches.map((match) => (
                <div key={match.id} className="rounded-[8px] bg-white/8 p-3 text-sm text-white/75">
                  {match.homeTeam.name} vs {match.awayTeam.name} · {formatMatchDate(match.date)}
                </div>
              ))
            ) : (
              <p className="rounded-[8px] bg-white/8 p-3 text-sm text-white/60">
                Calendario por confirmar para esta sede.
              </p>
            )}
          </div>
          <ButtonLink href="/predictions">Ver partidos</ButtonLink>
        </div>
      </section>
    </div>
  );
}
