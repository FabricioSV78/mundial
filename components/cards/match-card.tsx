import { MapPin } from "lucide-react";
import Link from "next/link";
import { CountdownBadge } from "@/components/football/countdown-badge";
import { PointsBadge } from "@/components/football/points-badge";
import { TeamFlag } from "@/components/football/team-flag";
import { PredictionForm } from "@/components/forms/prediction-form";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/card";
import { calculatePredictionPoints, getWinner } from "@/lib/scoring";
import type { Match, Prediction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatMatchDate } from "@/lib/utils";

const statusTone = {
  SCHEDULED: "blue",
  LIVE: "red",
  FINISHED: "green",
  POSTPONED: "slate",
  CANCELLED: "red",
  UNKNOWN: "slate",
} as const;

export function MatchCard({
  match,
  prediction,
  scorerOptions = [],
}: {
  match: Match;
  prediction?: Prediction;
  scorerOptions?: string[];
}) {
  const locked = match.status !== "SCHEDULED";
  const startsAt = match.matchDate ?? match.date;
  const points = prediction ? calculatePredictionPoints(match, prediction) : 0;
  const actualWinner = match.result ? getWinner(match.result.homeGoals, match.result.awayGoals) : null;
  const predictedWinner = prediction ? getWinner(prediction.homeGoals, prediction.awayGoals) : null;
  const predictionStatus = !match.result || !prediction
    ? null
    : prediction.homeGoals === match.result.homeGoals && prediction.awayGoals === match.result.awayGoals
      ? "exact"
      : actualWinner === predictedWinner
        ? "winner"
        : "miss";
  const winnerName =
    actualWinner === "HOME" ? match.homeTeam.name : actualWinner === "AWAY" ? match.awayTeam.name : "Empate";
  const winnerMargin = match.result ? Math.abs(match.result.homeGoals - match.result.awayGoals) : 0;

  return (
    <GlassCard
      className={cn(
        "match-pulse sport-card flex h-full flex-col gap-5",
        predictionStatus === "exact" && "border-emerald-300/35 bg-emerald-400/12",
        predictionStatus === "winner" && "border-amber-300/35 bg-amber-300/10",
        predictionStatus === "miss" && "border-red-300/25 bg-red-400/10",
      )}
      data-live={match.status === "LIVE"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={statusTone[match.status]}>{match.status}</Badge>
        {match.externalProvider === "THESPORTSDB" ? (
          <Badge tone="green">datos sincronizados</Badge>
        ) : null}
        <CountdownBadge date={startsAt} locked={locked} />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamFlag team={match.homeTeam} />
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black text-white/60">
          VS
        </span>
        <div className="justify-self-end text-right">
          <TeamFlag team={match.awayTeam} />
        </div>
      </div>
      <div className="space-y-2 rounded-[8px] bg-slate-950/35 p-3 text-sm text-white/70">
        <p className="font-bold text-white">{formatMatchDate(startsAt)}</p>
        <p className="flex items-center gap-2">
          <MapPin className="size-4 text-amber-200" />
          {match.stadium.name}, {match.stadium.city}
        </p>
        <p>{match.stage}</p>
        <Link href={`/matches/${match.id}`} className="inline-flex text-sm font-black text-emerald-200 hover:text-emerald-100">
          Ver detalle del partido
        </Link>
      </div>
      {match.result && (
        <div className="space-y-3 rounded-[8px] bg-emerald-400/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold">
              Final: {match.result.homeGoals} - {match.result.awayGoals}
            </span>
            {prediction ? <PointsBadge points={points} /> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={actualWinner === "DRAW" ? "blue" : "green"}>
              {actualWinner === "DRAW" ? "Empate" : `${winnerName} gano`}
            </Badge>
            {actualWinner !== "DRAW" ? (
              <span className="text-sm font-semibold text-white/75">
                por {winnerMargin} {winnerMargin === 1 ? "gol" : "goles"}
              </span>
            ) : null}
            {predictionStatus === "exact" ? <Badge tone="green">Marcador exacto</Badge> : null}
            {predictionStatus === "winner" ? <Badge tone="gold">Acertaste el ganador</Badge> : null}
            {predictionStatus === "miss" ? <Badge tone="red">No acertaste esta vez</Badge> : null}
          </div>
          {match.result.scorer ? (
            <p className="text-sm font-semibold text-white/75">
              Goleador confirmado: <span className="font-black text-white">{match.result.scorer}</span>
            </p>
          ) : null}
        </div>
      )}
      <PredictionForm
        locked={locked}
        startsAt={startsAt}
        scorerOptions={scorerOptions}
        matchId={match.id}
        defaultValues={prediction}
      />
    </GlassCard>
  );
}
