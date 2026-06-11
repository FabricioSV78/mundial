import Link from "next/link";
import { Activity, Database } from "lucide-react";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminMatchTimelinePanel } from "@/components/admin/admin-match-timeline-panel";
import { AdminSyncPanel } from "@/components/admin/admin-sync-panel";
import { OfficialGroupsAdmin } from "@/components/admin/official-groups-admin";
import { SiteShell } from "@/components/layout/site-shell";
import { SportsHero } from "@/components/layout/sports-hero";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { getMatchesFromDb, getPlayersFromDb, getStadiumsFromMatches } from "@/lib/dbData";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [matches, players, stadiums] = await Promise.all([
    getMatchesFromDb(),
    getPlayersFromDb(),
    getStadiumsFromMatches(),
  ]);

  return (
    <SiteShell>
      <AdminGate>
        <section className="mx-auto max-w-7xl px-4 py-8 pb-24">
          <SportsHero
            eyebrow="Admin protegido"
            title="Panel de control"
            copy="Sincroniza TheSportsDB, revisa estado de datos y administra partidos, jugadores y estadios sin perder claridad."
            icon="shieldAlert"
            visual="stadium"
          />

          <div className="mt-8">
            <AdminSyncPanel />
          </div>

          <div className="mt-8">
            <AdminMatchTimelinePanel
              matches={matches.map((match) => ({
                id: match.id,
                label: `${match.homeTeam.code} vs ${match.awayTeam.code}`,
                status: match.status,
                lastSyncedAt: match.lastSyncedAt,
              }))}
            />
          </div>

          <div className="mt-8">
            <OfficialGroupsAdmin />
          </div>

          <GlassCard className="mt-8 border-sky-300/20 bg-sky-400/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Auditoria del torneo</h2>
                <p className="mt-2 text-sm text-white/68">
                  Revisa reglas 2026, grupos incompletos, mejores terceros y estado del bracket.
                </p>
              </div>
              <Link
                href="/admin/tournament-rules"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-amber-100"
              >
                Abrir auditoria
              </Link>
            </div>
          </GlassCard>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <GlassCard>
              <h2 className="flex items-center gap-2 text-2xl font-black">
                <Activity className="size-5 text-amber-200" />
                Partido
              </h2>
              <div className="mt-4 space-y-3">
                <Select defaultValue={matches[0]?.id}>
                  {matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.homeTeam.code} vs {match.awayTeam.code}
                    </option>
                  ))}
                </Select>
                <Select defaultValue="SCHEDULED">
                  <option value="SCHEDULED">Programado</option>
                  <option value="LIVE">En vivo</option>
                  <option value="FINISHED">Finalizado</option>
                  <option value="POSTPONED">Postergado</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="UNKNOWN">Desconocido</option>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="GL" />
                  <Input type="number" placeholder="GV" />
                </div>
                <Button className="w-full">Actualizar resultado</Button>
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="flex items-center gap-2 text-2xl font-black">
                <Database className="size-5 text-emerald-200" />
                Jugador
              </h2>
              <div className="mt-4 space-y-3">
                <Select defaultValue={players[0]?.id}>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </Select>
                <Input type="number" placeholder="Puntos fantasy" />
                <Input type="number" placeholder="Precio" />
                <Button className="w-full">Guardar jugador</Button>
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-black">Estadio</h2>
              <div className="mt-4 space-y-3">
                <Select defaultValue={stadiums[0]?.id}>
                  {stadiums.map((stadium) => (
                    <option key={stadium.id} value={stadium.id}>
                      {stadium.name}
                    </option>
                  ))}
                </Select>
                <Input placeholder="Capacidad" />
                <Input placeholder="Dato curioso" />
                <Button className="w-full">Guardar estadio</Button>
              </div>
            </GlassCard>
          </div>
        </section>
      </AdminGate>
    </SiteShell>
  );
}
