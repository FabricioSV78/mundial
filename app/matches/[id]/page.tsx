import { notFound } from "next/navigation";
import { MatchCard } from "@/components/cards/match-card";
import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { MatchScorersList } from "@/components/matches/match-scorers-list";
import { MatchTimelineList } from "@/components/matches/match-timeline-list";
import { GlassCard } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/currentUser";
import { getMatchByIdFromDb, getMatchEventsFromDb, getPlayersFromDb, getPredictionsForUser } from "@/lib/dbData";
import { getMatchScorers } from "@/lib/matches/matchTimeline";
import { buildMatchScorerOptions } from "@/lib/predictions";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const matchId = params.id;
  const user = await getCurrentUser();
  const [match, events, scorers, predictions, players] = await Promise.all([
    getMatchByIdFromDb(matchId),
    getMatchEventsFromDb(matchId),
    getMatchScorers(matchId),
    user ? getPredictionsForUser(user.id) : Promise.resolve([]),
    getPlayersFromDb(),
  ]);

  if (!match) {
    notFound();
  }

  const prediction = predictions.find((item) => item.matchId === matchId);

  return (
    <SiteShell
      isAuthenticated={Boolean(user)}
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Pronosticos", href: "/predictions" },
        { label: `${match.homeTeam.code} vs ${match.awayTeam.code}` },
      ]}
    >
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 pb-24">
        <SportsHero
          eyebrow="Detalle del partido"
          title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
          copy="Marcador, timeline, goleadores y tu pronostico en un solo lugar."
          icon="shieldCheck"
          visual="poster"
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <MatchCard match={match} prediction={prediction} scorerOptions={buildMatchScorerOptions(match, players)} />
          <GlassCard>
            <h2 className="text-2xl font-black">Goleadores del partido</h2>
            <div className="mt-4">
              <MatchScorersList scorers={scorers} />
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <h2 className="text-2xl font-black">Timeline del partido</h2>
          <div className="mt-4">
            <MatchTimelineList events={events} />
          </div>
        </GlassCard>
      </section>
    </SiteShell>
  );
}
