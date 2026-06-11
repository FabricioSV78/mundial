import { notFound } from "next/navigation";
import { AdminMatchEventsEditor } from "@/components/admin/admin-match-events-editor";
import { AdminGate } from "@/components/admin/admin-gate";
import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { getMatchByIdFromDb, getMatchEventsFromDb, getPlayersFromDb } from "@/lib/dbData";

export const dynamic = "force-dynamic";

export default async function AdminMatchEventsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const matchId = params.id;
  const [match, events, players] = await Promise.all([
    getMatchByIdFromDb(matchId),
    getMatchEventsFromDb(matchId),
    getPlayersFromDb(),
  ]);

  if (!match) {
    notFound();
  }

  const matchPlayers = players.filter(
    (player) => player.teamId === match.homeTeam.id || player.teamId === match.awayTeam.id,
  );

  return (
    <SiteShell
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/admin" },
        { label: `${match.homeTeam.code} vs ${match.awayTeam.code}`, href: `/matches/${match.id}` },
        { label: "Eventos" },
      ]}
    >
      <AdminGate>
        <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 pb-24">
          <SportsHero
            eyebrow="Admin eventos"
            title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
            copy="Edita eventos, vincula jugadores y recalcula fantasy si la API no trae todo bien."
            icon="shieldAlert"
            visual="poster"
          />
          <AdminMatchEventsEditor matchId={matchId} initialEvents={events} players={matchPlayers} />
        </section>
      </AdminGate>
    </SiteShell>
  );
}
