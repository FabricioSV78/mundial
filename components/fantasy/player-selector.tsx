"use client";

import { Lock, Search } from "lucide-react";
import type { DragEvent } from "react";
import { useMemo, useState } from "react";
import { PlayerCard } from "@/components/fantasy/player-card";
import { Input, Select } from "@/components/ui/input";
import type { Player, Position } from "@/lib/types";

export function PlayerSelector({
  players,
  selectedPlayerIds = [],
  locked = false,
  onPlayerDragStart,
  onPlayerDragEnd,
}: {
  players: Player[];
  selectedPlayerIds?: string[];
  locked?: boolean;
  onPlayerDragStart?: (event: DragEvent<HTMLElement>, player: Player) => void;
  onPlayerDragEnd?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const [country, setCountry] = useState("ALL");
  const selectedSet = useMemo(() => new Set(selectedPlayerIds), [selectedPlayerIds]);
  const countries = useMemo(
    () => [...new Set(players.map((player) => player.country))].sort(),
    [players],
  );

  const filtered = useMemo(
    () =>
      players.filter((player) => {
        const matchesQuery = `${player.name} ${player.country}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesPosition = position === "ALL" || player.position === position;
        const matchesCountry = country === "ALL" || player.country === country;

        return matchesQuery && matchesPosition && matchesCountry && !selectedSet.has(player.id);
      }),
    [country, players, position, query, selectedSet],
  );

  return (
    <aside className="space-y-4 xl:sticky xl:top-24">
      <div className="rounded-[14px] border border-white/12 bg-white/[0.07] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.12em] text-white">Jugadores</p>
            <p className="mt-1 text-xs font-semibold text-white/55">
              {locked ? "Equipo guardado. La lista queda bloqueada." : "Arrastra una card a una posicion compatible."}
            </p>
          </div>
          {locked ? <Lock className="size-5 shrink-0 text-amber-200" /> : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_150px_150px] xl:grid-cols-1">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar jugador o seleccion"
            className="pl-9"
          />
        </label>
        <Select
          value={position}
          onChange={(event) => setPosition(event.target.value as Position | "ALL")}
        >
          <option value="ALL">Todas</option>
          <option value="GK">Porteros</option>
          <option value="DEF">Defensas</option>
          <option value="MID">Medios</option>
          <option value="FWD">Delanteros</option>
        </Select>
        <Select value={country} onChange={(event) => setCountry(event.target.value)}>
          <option value="ALL">Todos los paises</option>
          {countries.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid max-h-[520px] gap-3 overflow-auto pr-1 md:grid-cols-2 xl:max-h-[560px] xl:grid-cols-1">
        {filtered.length ? (
          filtered.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              draggable={!locked}
              disabled={locked}
              onDragStart={(event) => onPlayerDragStart?.(event, player)}
              onDragEnd={onPlayerDragEnd}
            />
          ))
        ) : (
          <p className="rounded-[8px] border border-white/10 bg-white/[0.07] p-4 text-sm text-white/60">
            {selectedPlayerIds.length === players.length
              ? "Todos los jugadores disponibles ya estan en cancha."
              : "No hay jugadores con esos filtros."}
          </p>
        )}
      </div>
    </aside>
  );
}
