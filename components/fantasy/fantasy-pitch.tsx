import { PlayerCard } from "@/components/fantasy/player-card";
import type { Formation, Player, Position } from "@/lib/types";

const linesByFormation: Record<Formation, Position[][]> = {
  "4-3-3": [["FWD", "FWD", "FWD"], ["MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "4-4-2": [["FWD", "FWD"], ["MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "3-5-2": [["FWD", "FWD"], ["MID", "MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF"], ["GK"]],
  "4-2-3-1": [["FWD"], ["MID", "MID", "MID"], ["MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
};

export function FantasyPitch({
  players,
  formation = "4-3-3",
}: {
  players: Player[];
  formation?: Formation;
}) {
  const grouped = new Map<Position, Player[]>();
  players.forEach((player) => {
    grouped.set(player.position, [...(grouped.get(player.position) ?? []), player]);
  });

  return (
    <div className="relative min-h-[680px] overflow-hidden rounded-[8px] border border-white/15 bg-emerald-700 p-4 shadow-inner">
      <div className="absolute inset-3 rounded-[8px] border-2 border-white/25" />
      <div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />
      <div className="relative z-10 flex h-full min-h-[640px] flex-col justify-between gap-4">
        {linesByFormation[formation].map((line, lineIndex) => (
          <div
            key={`${formation}-${lineIndex}`}
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${line.length}, minmax(0, 1fr))` }}
          >
            {line.map((position, index) => {
              const player = grouped.get(position)?.shift();

              return (
                <div key={`${position}-${index}`} className="min-w-0">
                  {player ? (
                    <PlayerCard player={player} selected />
                  ) : (
                    <div className="grid h-20 place-items-center rounded-[8px] border border-dashed border-white/30 bg-white/10 text-xs font-bold text-white/70">
                      {position}
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
