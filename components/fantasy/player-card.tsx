import { cn } from "@/lib/utils";
import type { Player } from "@/lib/types";
import Image from "next/image";
import type { DragEventHandler, ReactNode } from "react";

export function PlayerCard({
  player,
  selected,
  disabled,
  draggable,
  compact,
  action,
  className,
  onDragStart,
  onDragEnd,
}: {
  player: Player;
  selected?: boolean;
  disabled?: boolean;
  draggable?: boolean;
  compact?: boolean;
  action?: ReactNode;
  className?: string;
  onDragStart?: DragEventHandler<HTMLElement>;
  onDragEnd?: DragEventHandler<HTMLElement>;
}) {
  return (
    <article
      draggable={draggable && !disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "relative flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/[0.07] p-3 transition",
        selected && "border-amber-200/45 bg-amber-300/10 shadow-[0_0_24px_rgba(250,204,21,0.12)]",
        draggable && !disabled && "cursor-grab hover:-translate-y-0.5 hover:border-amber-200/45 active:cursor-grabbing",
        disabled && "cursor-not-allowed",
        compact && "min-h-[76px] flex-wrap items-start gap-2 p-2 pr-9",
        className,
      )}
    >
      <div className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-300 to-sky-400 font-black text-slate-950",
        compact ? "size-9 text-sm" : "size-12",
      )}>
        {player.photoUrl ? (
          <Image src={player.photoUrl} alt={player.name} fill className="object-cover" sizes={compact ? "40px" : "48px"} />
        ) : (
          player.avatar
        )}
      </div>
      <div className={cn("min-w-0 flex-1", compact && "min-w-[72px]")}>
        <h4 className={cn("font-black", compact ? "text-sm leading-tight" : "truncate")}>{player.name}</h4>
        <p className="text-xs font-semibold text-white/50">
          {player.countryCode} · {player.position}
        </p>
        {player.recentFantasyEvents?.length ? (
          <div className="mt-2 space-y-1">
            {player.recentFantasyEvents.slice(0, compact ? 2 : 3).map((entry) => (
              <p key={`${entry.matchId}-${entry.description}`} className="text-[11px] font-semibold text-white/68">
                <span className={cn("mr-1 font-black", entry.points >= 0 ? "text-emerald-200" : "text-red-200")}>
                  {entry.points > 0 ? `+${entry.points}` : entry.points}
                </span>
                {entry.description}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <div className={cn("text-right", compact && "w-full pl-11 text-left")}>
        <p className="text-xs font-bold text-emerald-200">{player.points} pts</p>
      </div>
      {action}
    </article>
  );
}
