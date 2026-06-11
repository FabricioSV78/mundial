import { AdminGate } from "@/components/admin/admin-gate";
import { TournamentRulesAudit } from "@/components/admin/tournament-rules-audit";
import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { buildTournamentRulesAudit } from "@/lib/tournament/officialGroupsService";

export const dynamic = "force-dynamic";

export default async function TournamentRulesPage() {
  const report = await buildTournamentRulesAudit();

  return (
    <SiteShell
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/admin" },
        { label: "Reglas del torneo" },
      ]}
    >
      <AdminGate>
        <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 pb-24">
          <SportsHero
            eyebrow="Admin torneo"
            title="Reglas Mundial 2026"
            copy="Audita equipos, grupos, fixture, clasificados y bracket desde una sola vista."
            icon="shieldAlert"
            visual="trophy"
          />
          <TournamentRulesAudit initialReport={report} />
        </section>
      </AdminGate>
    </SiteShell>
  );
}
