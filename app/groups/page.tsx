import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/currentUser";
import { canonicalTeamName, officialGroups2026 } from "@/lib/tournament/officialGroups2026";
import { deriveOfficialWorldCupState, getOfficialGroupsWithStandings } from "@/lib/tournament/officialGroupsService";

export const dynamic = "force-dynamic";

const teamDisplayNameMap = new Map<string, string>([
  ["Bosnia and Herzegovina", "Bosnia y Herzegovina"],
  ["Cape Verde", "Cabo Verde"],
  ["Côte d’Ivoire", "Costa de Marfil"],
  ["Curaçao", "Curazao"],
  ["Czechia", "Chequia"],
  ["Democratic Republic of the Congo", "Republica Democratica del Congo"],
  ["Saudi Arabia", "Arabia Saudita"],
  ["South Africa", "Sudafrica"],
  ["South Korea", "Corea del Sur"],
  ["Switzerland", "Suiza"],
  ["Turkey", "Turquia"],
  ["United States", "Estados Unidos"],
  ["Netherlands", "Paises Bajos"],
]);

function displayTeamName(name: string) {
  const canonical = canonicalTeamName(name);
  return teamDisplayNameMap.get(canonical) ?? canonical;
}

export default async function GroupsPage() {
  const [user, groups] = await Promise.all([getCurrentUser(), getOfficialGroupsWithStandings()]);
  const teamMeta = new Map(groups.flatMap((group) => group.teams.map((team) => [team.id, team])));
  const officialOrderByGroup = new Map(
    officialGroups2026.map((group) => [
      group.name,
      new Map(group.teams.map((team, index) => [canonicalTeamName(team.name), index])),
    ]),
  );
  const { standings, qualifiedRows, bestThirdIds, fixtureValidation, liveProjection } =
    deriveOfficialWorldCupState(groups);
  const qualifiedStatusMap = new Map(qualifiedRows.map((row) => [row.teamId, row.qualifiedStatus]));

  return (
    <SiteShell isAuthenticated={Boolean(user)}>
      <section className="mx-auto max-w-7xl px-4 py-8 pb-24">
        <SportsHero
          eyebrow="Sorteo oficial 2026"
          title="Grupos Mundial 2026"
          copy="12 grupos de 4 selecciones, placeholders de play-off marcados como pendientes y motor propio para clasificados directos y mejores terceros."
          icon="listOrdered"
          visual="stadium"
        />
        {!fixtureValidation.isComplete ? (
          <GlassCard className="mt-6 border-amber-300/25 bg-amber-300/10">
            <Badge tone="gold">{liveProjection ? "Proyeccion activa" : "Clasificacion pendiente"}</Badge>
            <p className="mt-3 text-sm text-white/72">
              La fase de grupos aun no esta completa. Los estados pueden mostrarse como pendientes hasta cerrar los 72 partidos.
            </p>
          </GlassCard>
        ) : null}
        {standings.length ? (
          <>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {standings.map((group) => (
                (() => {
                  const hasResults = group.rows.some((row) => row.played > 0);
                  const officialOrder = officialOrderByGroup.get(group.groupName);
                  const displayRows = [...group.rows].sort((a, b) => {
                    if (hasResults) {
                      return a.rank - b.rank;
                    }

                    const aOrder = officialOrder?.get(canonicalTeamName(a.teamName)) ?? Number.MAX_SAFE_INTEGER;
                    const bOrder = officialOrder?.get(canonicalTeamName(b.teamName)) ?? Number.MAX_SAFE_INTEGER;
                    return aOrder - bOrder;
                  });

                  return (
                    <GlassCard key={group.groupName} className="overflow-hidden p-0">
                      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] p-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200/70">
                            Grupo {group.groupName}
                          </p>
                          <h2 className="text-2xl font-black">
                            {hasResults ? "Tabla de posiciones" : "Grupo oficial"}
                          </h2>
                        </div>
                        <Badge tone="blue">{hasResults ? "En juego" : "Oficial"}</Badge>
                      </div>
                      {!hasResults ? (
                        <div className="border-b border-white/8 px-4 py-3 text-sm text-white/60">
                          Orden oficial del grupo hasta que se disputen partidos.
                        </div>
                      ) : null}
                      <div className="grid grid-cols-[34px_1fr_40px_40px_40px_40px_92px] gap-2 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-white/45 sm:grid-cols-[44px_1fr_44px_44px_44px_44px_112px]">
                        <span>#</span>
                        <span>Equipo</span>
                        <span>Pts</span>
                        <span>DG</span>
                        <span>GF</span>
                        <span>GC</span>
                        <span>Estado</span>
                      </div>
                      {displayRows.map((row, index) => {
                    const team = teamMeta.get(row.teamId);
                    const qualifiedStatus = qualifiedStatusMap.get(row.teamId);
                    const showQualification = hasResults && (fixtureValidation.isComplete || liveProjection);
                    const isBestThird = showQualification && bestThirdIds.has(row.teamId) && row.rank === 3;
                    const displayRank = hasResults ? row.rank : index + 1;

                    return (
                      <div
                        key={row.teamId}
                        className="grid grid-cols-[34px_1fr_40px_40px_40px_40px_92px] items-center gap-2 border-t border-white/8 px-4 py-3 text-sm transition hover:bg-white/[0.04] sm:grid-cols-[44px_1fr_44px_44px_44px_44px_112px]"
                      >
                        <span className="font-black text-white/70">{displayRank}</span>
                        <span className="flex min-w-0 items-center gap-3 font-bold">
                          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/10">
                            {team?.flagUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={team.flagUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span aria-hidden="true">{team?.flag ?? "🏳️"}</span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate">{displayTeamName(row.teamName)}</span>
                            <span className="mt-1 flex flex-wrap gap-1">
                              {team?.isPlaceholder ? <Badge tone="gold">Pendiente</Badge> : null}
                              {isBestThird ? <Badge tone="gold">Mejor 3°</Badge> : null}
                            </span>
                          </span>
                        </span>
                        <span>{row.points}</span>
                        <span>{row.goalDifference}</span>
                        <span>{row.goalsFor}</span>
                        <span>{row.goalsAgainst}</span>
                        <span className="text-xs font-black uppercase tracking-[0.08em] text-white/72">
                          {!hasResults && "Sin jugar"}
                          {hasResults && qualifiedStatus === "DIRECT" && "Directo"}
                          {hasResults && qualifiedStatus === "BEST_THIRD" && "Mejor 3°"}
                          {hasResults && qualifiedStatus === "PROJECTED_DIRECT" && "Proy. directo"}
                          {hasResults && qualifiedStatus === "PROJECTED_BEST_THIRD" && "Proy. 3°"}
                          {hasResults && qualifiedStatus === "ELIMINATED" && "Eliminado"}
                          {hasResults && qualifiedStatus === "PENDING" && "Pendiente"}
                        </span>
                      </div>
                    );
                      })}
                    </GlassCard>
                  );
                })()
              ))}
            </div>

          </>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="Grupos oficiales aun no creados"
              copy="Entra al panel Admin y usa Crear grupos oficiales 2026 para sembrar el torneo, grupos A-L y placeholders de play-off."
            />
          </div>
        )}
      </section>
    </SiteShell>
  );
}
