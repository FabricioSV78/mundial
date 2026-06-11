"use client";

import { GripVertical, Lock, RotateCcw, Trophy, X } from "lucide-react";
import type { DragEvent } from "react";
import { useMemo, useState } from "react";
import { FantasySavePanel } from "@/components/fantasy/fantasy-save-panel";
import { PlayerCard } from "@/components/fantasy/player-card";
import { PlayerSelector } from "@/components/fantasy/player-selector";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import type { FantasyPointBreakdown, Formation, Player, Position } from "@/lib/types";
import { cn } from "@/lib/utils";

type LineupSlot = {
  id: string;
  position: Position;
  lineIndex: number;
  slotIndex: number;
};

type DraggedPlayer = {
  playerId: string;
  fromSlotId?: string;
};

const linesByFormation: Record<Formation, Position[][]> = {
  "4-3-3": [["FWD", "FWD", "FWD"], ["MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "4-4-2": [["FWD", "FWD"], ["MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "3-5-2": [["FWD", "FWD"], ["MID", "MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF"], ["GK"]],
  "4-2-3-1": [["FWD"], ["MID", "MID", "MID"], ["MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
};

const positionLabel: Record<Position, string> = {
  GK: "POR",
  DEF: "DEF",
  MID: "MED",
  FWD: "DEL",
};

function buildSlots(formation: Formation) {
  return linesByFormation[formation].flatMap((line, lineIndex) =>
    line.map((position, slotIndex) => ({
      id: `${formation}-${lineIndex}-${slotIndex}`,
      position,
      lineIndex,
      slotIndex,
    })),
  );
}

function emptyLineup(slots: LineupSlot[]) {
  return Object.fromEntries(slots.map((slot) => [slot.id, null])) as Record<string, string | null>;
}

function lineupFromPlayerIds(playerIds: string[], slots: LineupSlot[], playersById: Map<string, Player>) {
  const lineup = emptyLineup(slots);

  for (const playerId of playerIds) {
    const player = playersById.get(playerId);

    if (!player) {
      continue;
    }

    const targetSlot = slots.find((slot) => slot.position === player.position && !lineup[slot.id]);

    if (targetSlot) {
      lineup[targetSlot.id] = player.id;
    }
  }

  return lineup;
}

function applyFantasyBreakdown(
  player: Player,
  fantasyBreakdowns: Record<string, FantasyPointBreakdown>,
) {
  const breakdown = fantasyBreakdowns[player.id];

  if (!breakdown) {
    return player;
  }

  return {
    ...player,
    points: breakdown.total,
    recentFantasyEvents: breakdown.entries.slice(0, 3),
  };
}

export function FantasyTeamBuilder({
  players,
  initialFormation = "4-3-3",
  initialPlayerIds = [],
  initiallyLocked = false,
  fantasyBreakdowns = {},
}: {
  players: Player[];
  initialFormation?: Formation;
  initialPlayerIds?: string[];
  initiallyLocked?: boolean;
  fantasyBreakdowns?: Record<string, FantasyPointBreakdown>;
}) {
  const initialPlayersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const [formation, setFormation] = useState<Formation>(initialFormation);
  const slots = useMemo(() => buildSlots(formation), [formation]);
  const [slotPlayerIds, setSlotPlayerIds] = useState<Record<string, string | null>>(() =>
    lineupFromPlayerIds(initialPlayerIds, buildSlots(initialFormation), initialPlayersById),
  );
  const [draggedPlayer, setDraggedPlayer] = useState<DraggedPlayer | null>(null);
  const [locked, setLocked] = useState(initiallyLocked);
  const [notice, setNotice] = useState(
    initiallyLocked
      ? "Equipo guardado. Las fichas estan bloqueadas."
      : "Arrastra jugadores desde la lista hacia su posicion en la cancha.",
  );

  const playersById = initialPlayersById;
  const selectedPlayerIds = useMemo(
    () => slots.map((slot) => slotPlayerIds[slot.id]).filter((playerId): playerId is string => Boolean(playerId)),
    [slotPlayerIds, slots],
  );
  const selectedPlayers = useMemo(
    () =>
      selectedPlayerIds
        .map((playerId) => playersById.get(playerId))
        .filter((player): player is Player => Boolean(player))
        .map((player) => applyFantasyBreakdown(player, fantasyBreakdowns)),
    [fantasyBreakdowns, playersById, selectedPlayerIds],
  );
  const selectedFantasyPoints = selectedPlayers.reduce((total, player) => total + player.points, 0);
  const availablePlayers = useMemo(
    () => players.map((player) => applyFantasyBreakdown(player, fantasyBreakdowns)),
    [fantasyBreakdowns, players],
  );

  function startDrag(event: DragEvent<HTMLElement>, player: Player, fromSlotId?: string) {
    if (locked) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-player-id", player.id);

    if (fromSlotId) {
      event.dataTransfer.setData("application/x-slot-id", fromSlotId);
    }

    setDraggedPlayer({ playerId: player.id, fromSlotId });
    setNotice(`${player.name}: sueltalo en un slot ${positionLabel[player.position]}.`);
  }

  function finishDrag() {
    setDraggedPlayer(null);
  }

  function dropPlayer(event: DragEvent<HTMLDivElement>, targetSlot: LineupSlot) {
    event.preventDefault();

    if (locked) {
      return;
    }

    const playerId = event.dataTransfer.getData("application/x-player-id") || draggedPlayer?.playerId;
    const fromSlotId = event.dataTransfer.getData("application/x-slot-id") || draggedPlayer?.fromSlotId;
    const player = playerId ? playersById.get(playerId) : undefined;

    if (!player) {
      return;
    }

    if (player.position !== targetSlot.position) {
      setNotice(`${player.name} es ${positionLabel[player.position]}. Esta posicion pide ${positionLabel[targetSlot.position]}.`);
      return;
    }

    const sourceSlot = fromSlotId ? slots.find((slot) => slot.id === fromSlotId) : undefined;
    const targetPlayerId = slotPlayerIds[targetSlot.id];
    const targetPlayer = targetPlayerId ? playersById.get(targetPlayerId) : undefined;

    if (sourceSlot && targetPlayer && targetPlayer.position !== sourceSlot.position) {
      setNotice(`No se puede intercambiar: ${targetPlayer.name} no encaja en ${positionLabel[sourceSlot.position]}.`);
      return;
    }

    setSlotPlayerIds((current) => {
      const next = { ...current };

      for (const slot of slots) {
        if (next[slot.id] === player.id) {
          next[slot.id] = null;
        }
      }

      if (sourceSlot && targetPlayer) {
        next[sourceSlot.id] = targetPlayer.id;
      }

      next[targetSlot.id] = player.id;
      return next;
    });

    setNotice(`${player.name} colocado como ${positionLabel[targetSlot.position]}.`);
    setDraggedPlayer(null);
  }

  function removePlayer(slotId: string) {
    if (locked) {
      return;
    }

    setSlotPlayerIds((current) => ({ ...current, [slotId]: null }));
    setNotice("Jugador removido. Puedes elegir otro desde la lista.");
  }

  function clearLineup() {
    if (locked) {
      return;
    }

    setSlotPlayerIds(emptyLineup(slots));
    setNotice("Cancha limpia. Vuelve a armar tus 11 chocolateros.");
  }

  function changeFormation(value: Formation) {
    if (locked) {
      return;
    }

    const nextSlots = buildSlots(value);
    const nextLineup = lineupFromPlayerIds(selectedPlayerIds, nextSlots, playersById);

    setFormation(value);
    setSlotPlayerIds(nextLineup);
    setNotice("Formacion actualizada. Se conservaron los jugadores que encajan.");
  }

  return (
    <div className="mt-6 space-y-6">
      <FantasySavePanel
        players={selectedPlayers}
        formation={formation}
        playerIds={selectedPlayerIds}
        locked={locked}
        onSaved={() => {
          setLocked(true);
          setNotice("Equipo guardado. Las fichas quedan bloqueadas.");
        }}
      />

      <div
        className={cn(
          "grid items-start gap-5",
          !locked && "xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]",
        )}
      >
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-white/12 bg-white/[0.07] p-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-white">Cancha fantasy</p>
              <p className="mt-1 text-xs font-semibold text-white/55">{notice}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-10 items-center gap-2 rounded-[8px] border border-amber-200/25 bg-amber-300/10 px-3 text-amber-50">
                <Trophy className="size-4 text-amber-200" />
                <span className="text-xs font-black uppercase">Total</span>
                <span className="text-sm font-black">{selectedFantasyPoints} pts</span>
              </div>
              <Select
                value={formation}
                disabled={locked}
                onChange={(event) => changeFormation(event.target.value as Formation)}
                className="w-[136px]"
                aria-label="Formacion"
              >
                <option value="4-3-3">4-3-3</option>
                <option value="4-4-2">4-4-2</option>
                <option value="3-5-2">3-5-2</option>
                <option value="4-2-3-1">4-2-3-1</option>
              </Select>
              <Button variant="secondary" onClick={clearLineup} disabled={locked || selectedPlayerIds.length === 0}>
                {locked ? <Lock className="mr-2 size-4" /> : <RotateCcw className="mr-2 size-4" />}
                Limpiar
              </Button>
            </div>
          </div>

          <FantasyDraftPitch
            locked={locked}
            slots={slots}
            slotPlayerIds={slotPlayerIds}
            playersById={playersById}
            fantasyBreakdowns={fantasyBreakdowns}
            draggedPlayer={draggedPlayer}
            onDrop={dropPlayer}
            onDragStart={startDrag}
            onDragEnd={finishDrag}
            onRemove={removePlayer}
          />
        </section>

        {!locked ? (
          <PlayerSelector
            players={availablePlayers}
            selectedPlayerIds={selectedPlayerIds}
            locked={locked}
            onPlayerDragStart={(event, player) => startDrag(event, player)}
            onPlayerDragEnd={finishDrag}
          />
        ) : null}
      </div>
    </div>
  );
}

function FantasyDraftPitch({
  locked,
  slots,
  slotPlayerIds,
  playersById,
  fantasyBreakdowns,
  draggedPlayer,
  onDrop,
  onDragStart,
  onDragEnd,
  onRemove,
}: {
  locked: boolean;
  slots: LineupSlot[];
  slotPlayerIds: Record<string, string | null>;
  playersById: Map<string, Player>;
  fantasyBreakdowns: Record<string, FantasyPointBreakdown>;
  draggedPlayer: DraggedPlayer | null;
  onDrop: (event: DragEvent<HTMLDivElement>, slot: LineupSlot) => void;
  onDragStart: (event: DragEvent<HTMLElement>, player: Player, fromSlotId?: string) => void;
  onDragEnd: () => void;
  onRemove: (slotId: string) => void;
}) {
  const lines = slots.reduce<LineupSlot[][]>((acc, slot) => {
    acc[slot.lineIndex] = [...(acc[slot.lineIndex] ?? []), slot];
    return acc;
  }, []);

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-[14px] border border-white/15 bg-emerald-800 p-5 shadow-inner">
      <div className="absolute inset-4 rounded-[12px] border-2 border-white/25" />
      <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />
      <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px -translate-x-1/2 bg-white/20" />
      <div className="absolute left-1/2 top-4 h-24 w-52 -translate-x-1/2 rounded-b-[90px] border-x-2 border-b-2 border-white/20" />
      <div className="absolute bottom-4 left-1/2 h-24 w-52 -translate-x-1/2 rounded-t-[90px] border-x-2 border-t-2 border-white/20" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[length:88px_88px]" />

      <div className="relative z-10 flex min-h-[480px] flex-col justify-between gap-3">
        {lines.map((line, lineIndex) => (
          <div
            key={lineIndex}
            className="grid items-center gap-3 2xl:gap-4"
            style={{ gridTemplateColumns: `repeat(${line.length}, minmax(0, 1fr))` }}
          >
            {line.map((slot) => {
              const playerId = slotPlayerIds[slot.id];
              const basePlayer = playerId ? playersById.get(playerId) : undefined;
              const player = basePlayer ? applyFantasyBreakdown(basePlayer, fantasyBreakdowns) : undefined;
              const dragged = draggedPlayer?.playerId ? playersById.get(draggedPlayer.playerId) : undefined;
              const compatible = Boolean(dragged && dragged.position === slot.position);

              return (
                <div
                  key={slot.id}
                  onDragOver={(event) => {
                    if (!locked) {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = compatible ? "move" : "none";
                    }
                  }}
                  onDrop={(event) => onDrop(event, slot)}
                  className={cn(
                    "min-h-[76px] rounded-[14px] border border-dashed border-white/28 bg-slate-950/24 p-2 transition",
                    compatible && "border-amber-200 bg-amber-200/12 shadow-[0_0_28px_rgba(250,204,21,0.18)]",
                    locked && "border-solid border-amber-200/25",
                  )}
                >
                  {player ? (
                    <PlayerCard
                      player={player}
                      selected
                      compact
                      draggable={!locked}
                      disabled={false}
                      onDragStart={(event) => onDragStart(event, player, slot.id)}
                      onDragEnd={onDragEnd}
                      action={
                        locked ? null : (
                          <button
                            type="button"
                            aria-label={`Quitar ${player.name}`}
                            onClick={() => onRemove(slot.id)}
                            className="absolute right-1.5 top-1.5 grid size-7 shrink-0 place-items-center rounded-full border border-white/10 bg-slate-950/40 text-white/70 transition hover:bg-red-400/30 hover:text-red-100"
                          >
                            <X className="size-4" />
                          </button>
                        )
                      }
                    />
                  ) : (
                    <div className="grid h-full min-h-[60px] place-items-center rounded-[10px] border border-white/10 bg-white/[0.06] text-center">
                      <div>
                        <GripVertical className="mx-auto mb-2 size-5 text-white/35" />
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/80">
                          {positionLabel[slot.position]}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-white/42">Suelta aqui</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
