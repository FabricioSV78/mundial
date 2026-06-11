import { MatchCard } from "@/components/cards/match-card";
import { LeagueSwitcher } from "@/components/leagues/league-switcher";
import { PointsChartLoader } from "@/components/cards/points-chart-loader";
import { PredictionRefreshListener } from "@/components/predictions/prediction-refresh-listener";
import { TrophyCard } from "@/components/cards/trophy-card";
import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { Badge } from "@/components/ui/badge";
import { LeagueRankingTable } from "@/components/ranking/league-ranking-table";
import { GlassCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePageUser } from "@/lib/currentUser";
import { getLeagueMembersFromDb, getMatchesFromDb, getPlayersFromDb, getPredictionsForUser, getUserLeaguesFromDb, getUserPointsHistory } from "@/lib/dbData";
import { resolveActiveLeagueId } from "@/lib/leagues";
import { buildMatchScorerOptions } from "@/lib/predictions";

export const dynamic = "force-dynamic";

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const user = await requirePageUser("/dashboard");
  const searchParams = await props.searchParams;
  const requestedLeague = Array.isArray(searchParams.league) ? searchParams.league[0] : searchParams.league;
  const [matches, predictions, userLeagues, players, pointsHistory] = await Promise.all([
    getMatchesFromDb(),
    getPredictionsForUser(user.id),
    getUserLeaguesFromDb(user.id),
    getPlayersFromDb(),
    getUserPointsHistory(user.id),
  ]);
  const activeLeagueId = resolveActiveLeagueId(userLeagues, requestedLeague);
  const activeLeague = userLeagues.find((league) => league.id === activeLeagueId);
  const members = activeLeagueId ? await getLeagueMembersFromDb(activeLeagueId) : [];
  const liveMatch = matches.find((match) => match.status === "LIVE");
  const nextScheduledMatch = matches.find((match) => match.status === "SCHEDULED");
  const openMatches = matches.filter((match) => match.status === "SCHEDULED" || match.status === "LIVE");
  const nextMatch = liveMatch ?? nextScheduledMatch ?? openMatches[0] ?? matches[0];
  const predictionMap = new Map(predictions.map((prediction) => [prediction.matchId, prediction]));
  const rankedMembers = [...members].sort(
    (a, b) => b.predictionPoints + b.fantasyPoints - (a.predictionPoints + a.fantasyPoints),
  );
  const myRank = rankedMembers.findIndex((member) => member.username === user.username);
  const myMember = rankedMembers[myRank];
  const totalPoints = myMember ? myMember.predictionPoints + myMember.fantasyPoints : 0;
  const predictionEligibleMatches = openMatches.filter((match) => match.status === "SCHEDULED");
  const pendingPredictions = predictionEligibleMatches.filter((match) => !predictionMap.has(match.id)).length;
  const quickStats = [
    { label: "Puntos totales", value: `${totalPoints}` },
    { label: "Pronosticos guardados", value: `${predictions.length}` },
    { label: "Pendientes por jugar", value: `${pendingPredictions}` },
    { label: "Posicion en liga", value: myRank >= 0 ? `#${myRank + 1}` : "Sin liga" },
  ];

  return (
    <SiteShell isAuthenticated>
      <PredictionRefreshListener />
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 pb-24">
        <SportsHero
          eyebrow="Centro de control"
          title="Tu batalla mundialista"
          copy="Proximo partido, pronosticos pendientes, fantasy y ranking de la liga que tengas activa."
          icon="trophy"
          visual="stadium"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge tone={userLeagues.length ? "blue" : "gold"}>
            {userLeagues.length ? `${userLeagues.length} ligas conectadas` : "Sin liga activa"}
          </Badge>
          {activeLeague ? (
            <p className="text-sm font-semibold text-white/65">
              Viendo: <span className="font-black text-white">{activeLeague.name}</span>
            </p>
          ) : null}
        </div>
        <LeagueSwitcher pathname="/dashboard" leagues={userLeagues} activeLeagueId={activeLeagueId} />

        <div className="grid gap-4 md:grid-cols-4">
          {quickStats.map((stat) => (
            <GlassCard key={stat.label} className="sport-card">
              <p className="text-sm font-bold text-white/50">{stat.label}</p>
              <p className="mt-2 text-3xl font-black">{stat.value}</p>
            </GlassCard>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {nextMatch ? <MatchCard match={nextMatch} prediction={predictionMap.get(nextMatch.id)} scorerOptions={buildMatchScorerOptions(nextMatch, players)} /> : (
            <EmptyState
              title="Sin proximo partido"
              copy="Ejecuta el sync TheSportsDB desde Admin para cargar el calendario real."
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TrophyCard
              icon="trophy"
              title="Liga"
              value={myRank >= 0 ? `#${myRank + 1}` : "--"}
              copy={myMember ? `${myMember.name}, sigues en carrera.` : "Crea o unete a una liga para aparecer aqui."}
            />
            <TrophyCard
              icon="goal"
              title="Pronosticos"
              value={`${predictions.length}`}
              copy={pendingPredictions > 0 ? `${pendingPredictions} partidos aun esperan tu marcador.` : "Todo al dia por ahora."}
            />
            <TrophyCard
              icon="calendarClock"
              title="Calendario"
              value={`${predictionEligibleMatches.length}`}
              copy="Partidos que siguen abiertos para pronosticar."
            />
            <TrophyCard
              icon="gauge"
              title="Fantasy"
              value={`${myMember?.fantasyPoints ?? 0}`}
              copy="Puntos acumulados por tus 11 chocolateros."
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <GlassCard>
            <h2 className="mb-4 text-2xl font-black">Historial de puntos</h2>
            <PointsChartLoader data={pointsHistory} />
          </GlassCard>
          <div>
            <h2 className="mb-4 text-2xl font-black">
              {activeLeague ? `Top de ${activeLeague.name}` : "Top de la liga"}
            </h2>
            {members.length ? <LeagueRankingTable members={members.slice(0, 3)} /> : (
              <EmptyState title="Sin ranking aun" copy="Crea una liga y guarda pronosticos/fantasy para poblar el ranking." />
            )}
          </div>
        </div>

      </section>
    </SiteShell>
  );
}
