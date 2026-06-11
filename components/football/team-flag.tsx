import type { Team } from "@/lib/types";
import Image from "next/image";

export function TeamFlag({ team, compact = false }: { team: Team; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative grid size-10 place-items-center overflow-hidden rounded-full bg-white text-xl shadow-inner">
        {team.flagUrl ? (
          <Image src={team.flagUrl} alt={team.name} fill className="object-contain p-1" sizes="40px" />
        ) : (
          team.flag
        )}
      </span>
      {!compact && (
        <span>
          <span className="block text-sm font-black text-white">{team.name}</span>
          <span className="text-xs font-bold text-white/45">{team.code}</span>
        </span>
      )}
    </div>
  );
}
