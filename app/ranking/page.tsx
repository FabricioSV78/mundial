import { LeagueSwitcher } from "@/components/leagues/league-switcher";
import { TopThreePodium } from "@/components/ranking/top-three-podium";
import { LeagueRankingTable } from "@/components/ranking/league-ranking-table";
import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePageUser } from "@/lib/currentUser";
import { getLeagueMembersFromDb, getUserLeaguesFromDb } from "@/lib/dbData";
import { resolveActiveLeagueId } from "@/lib/leagues";

export const dynamic = "force-dynamic";

export default async function RankingPage(props: PageProps<"/ranking">) {
  const user = await requirePageUser("/ranking");
  const searchParams = await props.searchParams;
  const requestedLeague = Array.isArray(searchParams.league) ? searchParams.league[0] : searchParams.league;
  const userLeagues = await getUserLeaguesFromDb(user.id);
  const activeLeagueId = resolveActiveLeagueId(userLeagues, requestedLeague);
  const activeLeague = userLeagues.find((league) => league.id === activeLeagueId);
  const members = activeLeagueId ? await getLeagueMembersFromDb(activeLeagueId) : [];

  return (
    <SiteShell isAuthenticated>
      <section className="mx-auto max-w-7xl px-4 py-8 pb-24">
        <SportsHero
          eyebrow="Ranking"
          title="Medallas y posiciones"
          copy="Pronosticos, fantasy, rachas y movimientos para que cada fecha se sienta competitiva."
          icon="trophy"
          visual="players"
        />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Badge tone={userLeagues.length ? "blue" : "gold"}>
            {userLeagues.length ? `${userLeagues.length} ligas conectadas` : "Sin liga activa"}
          </Badge>
          {activeLeague ? (
            <p className="text-sm font-semibold text-white/65">
              Ranking visible: <span className="font-black text-white">{activeLeague.name}</span>
            </p>
          ) : null}
        </div>
        <div className="mt-4">
          <LeagueSwitcher pathname="/ranking" leagues={userLeagues} activeLeagueId={activeLeagueId} />
        </div>
        <div className="mt-8">
          {members.length ? <TopThreePodium members={members} /> : (
            <EmptyState title="Sin podio todavia" copy="Cuando existan ligas y puntos reales, el top 3 aparecera aqui." />
          )}
        </div>
        <div className="mt-8">
          {members.length ? <LeagueRankingTable members={members} /> : (
            <EmptyState title="Ranking vacio" copy="Crea una liga y empieza a guardar pronosticos." />
          )}
        </div>
      </section>
    </SiteShell>
  );
}
