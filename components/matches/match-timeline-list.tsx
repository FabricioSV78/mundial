import { CircleAlert, Goal, RectangleEllipsis } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MatchEventItem } from "@/lib/types";

const eventIcon = {
  GOAL: Goal,
  RED_CARD: RectangleEllipsis,
  YELLOW_CARD: CircleAlert,
  ASSIST: Goal,
  SUBSTITUTION: CircleAlert,
  PENALTY_SAVE: CircleAlert,
  UNKNOWN: CircleAlert,
} as const;

const eventTone = {
  GOAL: "green",
  RED_CARD: "red",
  YELLOW_CARD: "gold",
  ASSIST: "blue",
  SUBSTITUTION: "slate",
  PENALTY_SAVE: "green",
  UNKNOWN: "slate",
} as const;

export function MatchTimelineList({ events }: { events: MatchEventItem[] }) {
  if (!events.length) {
    return (
      <p className="text-sm font-semibold text-white/60">
        Todavia no hay eventos disponibles para este partido.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const Icon = eventIcon[event.eventType];

        return (
          <div
            key={event.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full border border-white/10 bg-slate-950/45">
                <Icon className={event.eventType === "RED_CARD" ? "size-5 text-red-300" : "size-5 text-amber-200"} />
              </span>
              <div className="min-w-0">
                <p className="font-black text-white">{event.playerName ?? "Jugador no vinculado"}</p>
                <p className="text-sm text-white/60">{event.teamName ?? "Equipo no identificado"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={eventTone[event.eventType] as "green" | "red" | "gold" | "blue" | "slate"}>
                {event.eventType}
              </Badge>
              <span className="text-sm font-black text-white/80">{event.minute ? `${event.minute}'` : "--"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
