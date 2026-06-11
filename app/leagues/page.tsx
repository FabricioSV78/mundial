import { Users } from "lucide-react";
import { LeagueActions } from "@/components/leagues/league-actions";
import { LeagueSwitcher } from "@/components/leagues/league-switcher";
import { LeagueRankingTable } from "@/components/ranking/league-ranking-table";
import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePageUser } from "@/lib/currentUser";
import { getLeagueMembersFromDb, getUserLeaguesFromDb } from "@/lib/dbData";
import { resolveActiveLeagueId } from "@/lib/leagues";

export const dynamic = "force-dynamic";

export default async function LeaguesPage(props: PageProps<"/leagues">) {
  const user = await requirePageUser("/leagues");
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
          eyebrow="Ligas privadas"
          title="Compite con tu grupo"
          copy="Crea o entra a tus ligas y juega el Mundial con los mismos pronosticos y fantasy en cada tabla."
          icon="users"
          visual="stadium"
        />
        <div className="mt-6">
          <LeagueSwitcher pathname="/leagues" leagues={userLeagues} activeLeagueId={activeLeagueId} />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
          <LeagueActions defaultInviteCode={activeLeague?.inviteCode ?? ""} initialLeagueCount={userLeagues.length} />
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black">
                {activeLeague ? `Ranking de ${activeLeague.name}` : "Ranking de tus ligas"}
              </h2>
              <Badge tone="blue">
                <Users className="size-3" />
                {members.length} miembros
              </Badge>
            </div>
            {userLeagues.length ? (
              <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {userLeagues.map((league) => (
                  <GlassCard
                    key={league.id}
                    className={league.id === activeLeagueId ? "border-emerald-300/35 bg-emerald-400/10" : undefined}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-white/45">Liga</p>
                    <p className="mt-2 text-xl font-black">{league.name}</p>
                    <p className="mt-2 text-sm text-white/60">Codigo: {league.inviteCode}</p>
                    <p className="text-sm text-white/60">{league.memberCount} miembros</p>
                  </GlassCard>
                ))}
              </div>
            ) : null}
            {members.length ? (
              <LeagueRankingTable members={members} />
            ) : (
              <EmptyState
                title="Aun no hay miembros"
                copy="Crea una liga o unete con codigo despues de iniciar sesion."
              />
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
