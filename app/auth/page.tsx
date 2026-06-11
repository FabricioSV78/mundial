import { redirect } from "next/navigation";
import Image from "next/image";
import { SiteShell } from "@/components/layout/site-shell";
import { AuthPanel } from "@/components/auth/auth-panel";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/currentUser";
import { worldCupVisuals } from "@/lib/worldCupVisuals";

export default async function AuthPage(props: PageProps<"/auth">) {
  const [user, searchParams] = await Promise.all([getCurrentUser(), props.searchParams]);
  const rawNext = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next;
  const callbackUrl = rawNext?.startsWith("/") ? rawNext : "/dashboard";

  if (user) {
    redirect(callbackUrl);
  }

  return (
    <SiteShell>
      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-8 px-4 py-8 pb-24 md:grid-cols-2">
        <div>
          <Badge tone="gold">Perfil de jugador</Badge>
          <h1 className="mt-4 text-5xl font-black">Entra a la cancha</h1>
          <p className="mt-4 text-lg leading-8 text-white/65">
            Crea tu usuario, elige avatar y pais favorito. En cuanto entres, volveras directo a la
            zona privada que intentabas abrir.
          </p>
          <div className="relative mt-8 hidden aspect-[16/10] overflow-hidden rounded-[14px] border border-white/12 bg-white/[0.06] shadow-2xl shadow-black/30 md:block">
            <Image
              src={worldCupVisuals.poster.src}
              alt={worldCupVisuals.poster.alt}
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,6,23,0.7),transparent_55%)]" />
            <div className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-slate-950/70 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] backdrop-blur">
              Mundial 2026
            </div>
          </div>
        </div>
        <AuthPanel callbackUrl={callbackUrl} />
      </section>
    </SiteShell>
  );
}
