import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { StadiumMapLoader } from "@/components/map/stadium-map-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/currentUser";
import { getMatchesFromDb, getStadiumsFromMatches } from "@/lib/dbData";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [user, matches, stadiums] = await Promise.all([getCurrentUser(), getMatchesFromDb(), getStadiumsFromMatches()]);

  return (
    <SiteShell isAuthenticated={Boolean(user)}>
      <section className="mx-auto max-w-7xl px-4 py-8 pb-24">
        <SportsHero
          eyebrow="Mapa del Mundial"
          title="Sedes y estadios 2026"
          copy="Explora ciudades, estadios, partidos y datos curiosos con pins personalizados de Mundial."
          icon="mapPinned"
          visual="stadium"
        />
        <div className="mt-8">
          {stadiums.length ? (
            <StadiumMapLoader stadiums={stadiums} matches={matches} />
          ) : (
            <EmptyState
              title="Sin estadios sincronizados"
              copy="TheSportsDB envia el venue en los eventos. Ejecuta el sync para construir el mapa limpio."
            />
          )}
        </div>
      </section>
    </SiteShell>
  );
}
