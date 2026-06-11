import { FantasyTeamBuilder } from "@/components/fantasy/fantasy-team-builder";
import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePageUser } from "@/lib/currentUser";
import { getFantasyPointBreakdownForUser, getPlayersFromDb } from "@/lib/dbData";
import { prisma } from "@/lib/prisma";
import type { Formation } from "@/lib/types";

export const dynamic = "force-dynamic";

const fantasyFormations = new Set<Formation>(["4-3-3", "4-4-2", "3-5-2", "4-2-3-1"]);

export default async function FantasyPage() {
  const user = await requirePageUser("/fantasy");
  const [players, savedFantasyTeam, breakdownMap] = await Promise.all([
    getPlayersFromDb(),
    prisma.fantasyTeam.findFirst({
      where: { userId: user.id },
      include: { slots: true },
    }),
    getFantasyPointBreakdownForUser(user.id),
  ]);
  const initialFormation = fantasyFormations.has(savedFantasyTeam?.formation as Formation)
    ? (savedFantasyTeam?.formation as Formation)
    : "4-3-3";
  const initialPlayerIds = savedFantasyTeam?.slots.map((slot) => slot.playerId) ?? [];
  const fantasyBreakdowns = Object.fromEntries(
    [...breakdownMap.entries()].map(([playerId, value]) => [playerId, value]),
  );

  return (
    <SiteShell isAuthenticated>
      <section className="mx-auto max-w-[1600px] px-4 py-8 pb-24">
        <SportsHero
          eyebrow="Fantasy Mundial"
          title="Arma tus 11 chocolateros"
          copy="Cancha visual, reglas claras de seleccion y puntuacion lista para competir con tu grupo."
          icon="users"
          visual="players"
        />

        {players.length ? (
          <FantasyTeamBuilder
            players={players}
            initialFormation={initialFormation}
            initialPlayerIds={initialPlayerIds}
            initiallyLocked={initialPlayerIds.length === 11}
            fantasyBreakdowns={fantasyBreakdowns}
          />
        ) : (
          <div className="mt-8">
            <EmptyState
              title="Sin jugadores sincronizados"
              copy="TheSportsDB entrega jugadores por seleccion. Ejecuta el sync desde Admin para poblar el fantasy."
            />
          </div>
        )}
      </section>
    </SiteShell>
  );
}
