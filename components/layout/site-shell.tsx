import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { BreadcrumbTrail } from "@/components/layout/breadcrumb-trail";
import { SiteNav, type SiteNavItem } from "@/components/layout/site-nav";
import { ButtonLink } from "@/components/ui/button";
import { buildAuthHref } from "@/lib/currentUser";
import { cn } from "@/lib/utils";

const navItems: Array<SiteNavItem & { private?: boolean }> = [
  { href: "/dashboard", label: "Dashboard", icon: "sparkles", private: true },
  { href: "/predictions", label: "Pronosticos", icon: "shield", private: true },
  { href: "/fantasy", label: "Fantasy", icon: "users", private: true },
  { href: "/groups", label: "Grupos", icon: "listOrdered" },
  { href: "/bracket", label: "Bracket", icon: "gitBranch" },
  { href: "/map", label: "Mapa", icon: "map" },
  { href: "/ranking", label: "Ranking", icon: "trophy", private: true },
];

export function SiteShell({
  children,
  className,
  isAuthenticated = false,
  breadcrumbs,
}: {
  children: React.ReactNode;
  className?: string;
  isAuthenticated?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }> | false;
}) {
  const visibleNavItems = navItems.filter((item) => isAuthenticated || !item.private);

  return (
    <div className={cn("world-app-shell relative min-h-screen overflow-x-hidden bg-slate-950 text-white", className)}>
      <header
        className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl"
        style={{ viewTransitionName: "site-header" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative grid size-11 place-items-center overflow-hidden rounded-full border border-amber-200/50 bg-slate-950 shadow-[0_0_28px_rgba(250,204,21,0.22)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon"
                alt="Mundial Battle"
                className="h-full w-full object-cover"
              />
            </span>
            <span className="font-black tracking-wide">Mundial Battle</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            <SiteNav items={visibleNavItems} />
          </nav>
          {isAuthenticated ? (
            <SignOutButton />
          ) : (
            <ButtonLink href={buildAuthHref("/dashboard")} variant="secondary" className="inline-flex">
              Entrar
            </ButtonLink>
          )}
        </div>
      </header>
      <div className="relative z-10">
        <BreadcrumbTrail items={breadcrumbs} />
      </div>
      <main className="relative z-10 min-w-0 overflow-x-hidden">{children}</main>
      <nav
        className="fixed bottom-0 left-0 z-40 grid w-screen max-w-[100vw] min-w-0 overflow-hidden border-t border-white/10 bg-slate-950/90 px-2 py-2 backdrop-blur-xl lg:hidden"
        style={{ gridTemplateColumns: `repeat(${Math.min(visibleNavItems.length, 5)}, minmax(0, 1fr))` }}
      >
        <SiteNav items={visibleNavItems.slice(0, 5)} mobile />
      </nav>
    </div>
  );
}
