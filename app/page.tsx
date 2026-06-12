import { BarChart3 } from "lucide-react";
import Image from "next/image";
import { AnimatedFootballBackground } from "@/components/football/animated-football-background";
import { FeatureGrid } from "@/components/cards/feature-grid";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMatchesFromDb } from "@/lib/dbData";
import { formatMatchDate } from "@/lib/utils";
import { worldCupVisuals } from "@/lib/worldCupVisuals";

export const dynamic = "force-dynamic";

const features = [
  {
    title: "Pronosticos",
    copy: "Predice marcador, ganador y goleador antes del cierre de cada partido.",
    icon: "predictions" as const,
  },
  {
    title: "Fantasy",
    copy: "Arma tus 11 chocolateros y compite por los puntos reales de tus jugadores.",
    icon: "fantasy" as const,
  },
  {
    title: "Mapa Mundial",
    copy: "Explora sedes, estadios, capacidades y partidos por ciudad.",
    icon: "map" as const,
  },
  {
    title: "Ranking",
    copy: "Medallas, podio y movimientos para convertir el chat en estadio.",
    icon: "ranking" as const,
  },
];

const fanStadiumImage = "https://pixy.org/src/38/384654.jpg";

export default async function Home() {
  const matches = await getMatchesFromDb();
  const featuredMatch =
    matches.find((match) => match.status === "SCHEDULED") ??
    matches.find((match) => match.status === "LIVE") ??
    matches[0];
  const hostChips = ["Mexico", "Canada", "Estados Unidos"];
  const battleStats = [
    { value: "+5", label: "marcador exacto" },
    { value: "11", label: "chocolateros" },
    { value: "Top 3", label: "podio por liga" },
  ];
  const visualTiles = [
    { label: "Estadios", copy: "Sedes, pins y calendario real.", visual: worldCupVisuals.stadium },
    { label: "Fantasy", copy: "Tus 11 chocolateros sobre la cancha.", visual: worldCupVisuals.players },
    { label: "Pronosticos", copy: "Marcador, ganador y goleador.", visual: worldCupVisuals.poster },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <Image
        src={worldCupVisuals.trophy.src}
        alt=""
        fill
        sizes="100vw"
        className="absolute inset-0 z-0 h-full w-full object-cover opacity-[0.58] saturate-125"
        priority
        aria-hidden="true"
      />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.78)_0%,rgba(2,6,23,0.46)_48%,rgba(2,6,23,0.28)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 z-0 h-1/2 bg-[linear-gradient(0deg,#020617,rgba(2,6,23,0.18),transparent)]" />
      <AnimatedFootballBackground />
      <section className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(460px,0.98fr)]">
        <div className="mx-auto w-full max-w-3xl lg:mx-0">
          <Badge tone="gold">Mundial 2026 · Battle mode</Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.98] sm:text-7xl">
            Entra a la batalla del Mundial
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-white/72">
            Tu liga privada, tus pronosticos, tus 11 chocolateros y todo el Mundial convertido en
            una batalla con sabor a estadio.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {hostChips.map((host) => (
              <span
                key={host}
                className="rounded-full border border-white/14 bg-white/[0.08] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/72 backdrop-blur"
              >
                {host}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/leagues" className="h-12">
              Crear liga
            </ButtonLink>
            <ButtonLink href="/leagues" variant="secondary" className="h-12">
              Unirme a una liga
            </ButtonLink>
          </div>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {battleStats.map((stat) => (
              <div key={stat.label} className="rounded-[14px] border border-white/12 bg-slate-950/50 p-4 backdrop-blur">
                <p className="text-3xl font-black text-amber-100">{stat.value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[620px] overflow-hidden rounded-[26px] border border-white/14 bg-slate-950/70 shadow-2xl shadow-black/45">
          <Image
            src={worldCupVisuals.stadium.src}
            alt={worldCupVisuals.stadium.alt}
            fill
            sizes="(min-width: 768px) 46vw, 100vw"
            className="object-cover opacity-75 saturate-125"
            priority
            loading="eager"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_18%,rgba(250,204,21,0.2),transparent_18rem),linear-gradient(0deg,rgba(2,6,23,0.94)_0%,rgba(2,6,23,0.42)_58%,rgba(2,6,23,0.16)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#22c55e,#facc15,#ef4444)]" />

          <div className="relative z-10 flex min-h-[620px] flex-col justify-between gap-5 p-5">
            <div className="w-fit rounded-full border border-white/18 bg-slate-950/65 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white/75 backdrop-blur">
              Mundial Battle Arena
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-[18px] border border-white/14 bg-slate-950/70 shadow-2xl shadow-black/35 backdrop-blur">
                <div className="relative aspect-[16/9]">
                  <Image
                    src={worldCupVisuals.poster.src}
                    alt={worldCupVisuals.poster.alt}
                    fill
                    sizes="(min-width: 1024px) 240px, 45vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/80">Pronosticos</p>
                  <p className="mt-1 text-sm font-black">Marcador, ganador y goleador</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[18px] border border-white/14 bg-white/[0.08] shadow-2xl shadow-black/35 backdrop-blur">
                <div className="relative aspect-[16/9]">
                  <Image
                    src={worldCupVisuals.players.src}
                    alt={worldCupVisuals.players.alt}
                    fill
                    sizes="(min-width: 1024px) 240px, 45vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/80">Fantasy</p>
                  <p className="mt-1 text-sm font-black">Arma tus 11 chocolateros</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] border border-white/14 bg-slate-950/78 p-5 shadow-2xl shadow-black/35 backdrop-blur-xl">
              <div className="relative">
                {featuredMatch ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge tone="red">Proximo cierre</Badge>
                      <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
                        {formatMatchDate(featuredMatch.matchDate ?? featuredMatch.date)}
                      </span>
                    </div>
                    <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                      <div>
                        <span className="relative mx-auto grid size-16 place-items-center overflow-hidden rounded-full border border-white/18 bg-white text-5xl shadow-2xl shadow-black/30">
                          {featuredMatch.homeTeam.flagUrl ? (
                            <Image
                              src={featuredMatch.homeTeam.flagUrl}
                              alt={featuredMatch.homeTeam.name}
                              fill
                              sizes="64px"
                              className="object-contain p-1"
                            />
                          ) : (
                            featuredMatch.homeTeam.flag
                          )}
                        </span>
                        <p className="mt-2 truncate font-black">{featuredMatch.homeTeam.name}</p>
                      </div>
                      <span className="rounded-full bg-amber-300 px-3 py-1 text-sm font-black text-slate-950 shadow-[0_0_34px_rgba(250,204,21,0.35)]">
                        VS
                      </span>
                      <div>
                        <span className="relative mx-auto grid size-16 place-items-center overflow-hidden rounded-full border border-white/18 bg-white text-5xl shadow-2xl shadow-black/30">
                          {featuredMatch.awayTeam.flagUrl ? (
                            <Image
                              src={featuredMatch.awayTeam.flagUrl}
                              alt={featuredMatch.awayTeam.name}
                              fill
                              sizes="64px"
                              className="object-contain p-1"
                            />
                          ) : (
                            featuredMatch.awayTeam.flag
                          )}
                        </span>
                        <p className="mt-2 truncate font-black">{featuredMatch.awayTeam.name}</p>
                      </div>
                    </div>
                    <p className="mt-6 rounded-[12px] border border-white/10 bg-white/[0.06] p-4 text-sm font-semibold text-white/75">
                      {featuredMatch.stadium.name} · {featuredMatch.stadium.city}
                    </p>
                  </>
                ) : (
                  <>
                    <Badge tone="red">Sin calendario</Badge>
                    <h2 className="mt-8 text-3xl font-black">Sincroniza TheSportsDB</h2>
                    <p className="mt-3 text-white/75">
                      Admin cargara partidos, equipos y jugadores reales desde la API.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-24">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[420px] overflow-hidden rounded-[24px] border border-white/12 bg-slate-950/60 shadow-2xl shadow-black/35">
            <Image
              src={fanStadiumImage}
              alt="Estadio de futbol lleno de hinchas durante un partido nocturno."
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92),rgba(2,6,23,0.18))]" />
            <div className="absolute bottom-6 left-6 right-6 max-w-xl">
              <Badge tone="gold">Experiencia 2026</Badge>
              <h2 className="mt-4 text-4xl font-black leading-tight">Todo tu grupo jugando el mismo Mundial</h2>
              <p className="mt-3 text-white/70">
                Ligas privadas, rankings por puntos reales y tarjetas que cambian cuando llegan los resultados.
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            {visualTiles.map((tile) => (
              <div
                key={tile.label}
                className="group relative min-h-32 overflow-hidden rounded-[20px] border border-white/12 bg-white/[0.06] shadow-2xl shadow-black/20"
              >
                <Image
                  src={tile.visual.src}
                  alt={tile.visual.alt}
                  fill
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.9)_0%,rgba(2,6,23,0.36)_100%)]" />
                <div className="absolute inset-y-0 left-0 flex max-w-sm flex-col justify-center p-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-100/80">{tile.label}</p>
                  <p className="mt-2 text-lg font-black">{tile.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 mb-8 flex items-end justify-between gap-4">
          <div>
            <Badge tone="green">Datos reales via TheSportsDB</Badge>
            <h2 className="mt-4 text-3xl font-black">Una app para vivir el Mundial como juego</h2>
          </div>
          <BarChart3 className="hidden size-10 text-emerald-200 md:block" />
        </div>
        <FeatureGrid features={features} />
      </section>
    </main>
  );
}
