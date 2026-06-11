import Link from "next/link";
import { WorldCupBracket } from "@/components/bracket/world-cup-bracket";
import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { GlassCard } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/currentUser";
import { deriveOfficialWorldCupState, getOfficialGroupsWithStandings } from "@/lib/tournament/officialGroupsService";
import { generateKnockoutPlaceholder } from "@/lib/tournament/tournamentEngine";

export const dynamic = "force-dynamic";

export default async function BracketPage(props: {
  searchParams: Promise<{ projection?: string | string[] }>;
}) {
  const [{ projection }, user, groups] = await Promise.all([
    props.searchParams,
    getCurrentUser(),
    getOfficialGroupsWithStandings(),
  ]);
  const isAdmin = user?.role === "ADMIN";
  const liveProjection = isAdmin && projection === "1";
  const { confirmedQualifiedRows, projectedQualifiedRows, groupStageComplete, hasSyncedMatches } =
    deriveOfficialWorldCupState(groups, { liveProjection });
  const qualified = groupStageComplete ? confirmedQualifiedRows : liveProjection ? projectedQualifiedRows : [];
  const slots = generateKnockoutPlaceholder(qualified);

  return (
    <SiteShell isAuthenticated={Boolean(user)}>
      <section className="mx-auto box-border w-[calc(100vw-2rem)] max-w-[1500px] overflow-hidden py-8 pb-24">
        <SportsHero
          eyebrow="Cuadro eliminatorio"
          title="Fase eliminatoria"
          copy={
            groupStageComplete
              ? "Cruces listos para 32 clasificados."
              : liveProjection
                ? "Vista admin con proyeccion de clasificados mientras cierran los grupos."
                : "Bracket conservador con placeholders hasta confirmar clasificados."
          }
          icon="gitBranch"
          visual="trophy"
        />
        {isAdmin ? (
          <GlassCard className="mt-6 border-amber-300/20 bg-amber-300/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-100/80">Modo admin</p>
                <p className="mt-2 text-sm text-white/70">
                  Usa placeholders para publico general o activa proyeccion para revisar cruces antes del cierre.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/bracket"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 px-5 text-sm font-black text-white transition hover:bg-white/8"
                >
                  Solo confirmados
                </Link>
                <Link
                  href="/bracket?projection=1"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-amber-200/30 bg-amber-200/14 px-5 text-sm font-black text-amber-50 transition hover:bg-amber-200/22"
                >
                  Proyeccion admin
                </Link>
                <Link
                  href="/admin/tournament-rules"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-amber-100"
                >
                  Ajustar y auditar
                </Link>
              </div>
            </div>
          </GlassCard>
        ) : null}
        <WorldCupBracket
          slots={slots}
          qualified={qualified}
          hasApiGroups={hasSyncedMatches}
        />
      </section>
    </SiteShell>
  );
}
