import { MatchCard } from "@/components/cards/match-card";
import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { PredictionRefreshListener } from "@/components/predictions/prediction-refresh-listener";
import { PredictionStageSwitcher } from "@/components/predictions/prediction-stage-switcher";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePageUser } from "@/lib/currentUser";
import { getMatchesFromDb, getPlayersFromDb, getPredictionsForUser } from "@/lib/dbData";
import {
  buildMatchScorerOptions,
  filterMatchesByPredictionStage,
  getPredictionStageLabel,
  getPredictionStageOptions,
  resolvePredictionStage,
} from "@/lib/predictions";

export const dynamic = "force-dynamic";

export default async function PredictionsPage(props: { searchParams: Promise<{ stage?: string | string[] }> }) {
  const user = await requirePageUser("/predictions");
  const searchParams = await props.searchParams;
  const [matches, predictions, players] = await Promise.all([
    getMatchesFromDb(),
    getPredictionsForUser(user.id),
    getPlayersFromDb(),
  ]);
  const requestedStage = Array.isArray(searchParams.stage) ? searchParams.stage[0] : searchParams.stage;
  const activeStage = resolvePredictionStage(matches, requestedStage);
  const stageOptions = getPredictionStageOptions(matches);
  const visibleMatches = filterMatchesByPredictionStage(matches, activeStage);
  const predictionMap = new Map(predictions.map((prediction) => [prediction.matchId, prediction]));

  return (
    <SiteShell isAuthenticated>
      <PredictionRefreshListener />
      <section className="mx-auto max-w-7xl px-4 py-8 pb-24">
        <SportsHero
          eyebrow="Pronosticos"
          title={activeStage ? `Pronosticos · ${getPredictionStageLabel(activeStage)}` : "Partidos del Mundial"}
          copy="Predice marcadores antes del cierre. Cuando una fase termina, tus pronosticos se conservan y la vista avanza con el torneo."
          icon="shieldCheck"
          visual="poster"
        />
        <div className="mt-8">
          <PredictionStageSwitcher options={stageOptions} activeStage={activeStage} />
        </div>
        {matches.length ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {visibleMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictionMap.get(match.id)}
                scorerOptions={buildMatchScorerOptions(match, players)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="Sin partidos sincronizados"
              copy="Ve a Admin y ejecuta la sincronizacion con TheSportsDB para cargar el calendario real."
            />
          </div>
        )}
        {matches.length && !visibleMatches.length ? (
          <div className="mt-8">
            <EmptyState
              title="Sin partidos en esta fase"
              copy="Esa fase todavia no tiene partidos sincronizados o aun no fue definida por la API."
            />
          </div>
        ) : null}
      </section>
    </SiteShell>
  );
}
