"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useHydrated, useLocal } from "@/lib/use-local";
import { useFavorites } from "@/lib/favorites";
import { KEYS, local } from "@/lib/storage";
import { openCamille } from "@/lib/camille-bus";
import { POSTHOG_KEY } from "@/lib/site";
import { IconChat, IconGrid, IconHeart, IconHome, IconHouse, IconPhoto, IconTheme, IconUser } from "./icons";

const NAV = [
  { href: "/visite-3d/", label: "Visite 3D" },
  { href: "/galerie/", label: "Galerie" },
  { href: "/quiz/", label: "Mon style" },
  { href: "/projet/", label: "Mon projet" },
  { href: "/maison/", label: "Ma maison" },
  { href: "/explorer/", label: "Explorer" },
  { href: "/tarifs/", label: "Tarifs" },
];
const EXPLORE = ["/explorer/", "/matieres/", "/accords/", "/mobilier/", "/lieux/", "/plantes/", "/guides/", "/styles/"];

function isActive(path: string, href: string) {
  if (href === "/explorer/") return EXPLORE.some((p) => path.startsWith(p));
  return path.startsWith(href);
}

export function ThemeToggle() {
  const toggle = () => {
    const r = document.documentElement;
    const dark = r.dataset.theme ? r.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    r.dataset.theme = dark ? "light" : "dark";
    local.set(KEYS.theme, r.dataset.theme);
  };
  return <button type="button" className="btn btn-sm btn-ghost" onClick={toggle} aria-label="Changer de thème (clair ou sombre)"><IconTheme width={16} height={16} /></button>;
}

export function Header() {
  const path = usePathname() ?? "/";
  const favs = useFavorites();
  return (
    <header className="sticky z-20 border-b border-line backdrop-blur-md" style={{ top: "env(safe-area-inset-top, 0px)", background: "color-mix(in srgb, var(--bg) 88%, transparent)" }}>
      <div className="wrap flex h-[62px] items-center gap-1.5 sm:gap-3">
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-display text-[19px] font-extrabold sm:text-[21px] tracking-tight text-ink no-underline">
          <i aria-hidden="true" className="inline-block h-[22px] w-[22px] rounded-md" style={{ background: "conic-gradient(from 210deg,#C9B08A,#3E5B4C,#2747D0,#D8C9B6,#C9B08A)" }} />
          Pièce Rêvée
        </Link>
        <nav aria-label="Navigation principale" className="ml-2 hidden gap-0.5 overflow-x-auto lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(path, n.href) ? "page" : undefined}
              className="whitespace-nowrap rounded-full px-3 py-2 text-[14.5px] font-medium text-muted no-underline aria-[current=page]:bg-soft aria-[current=page]:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <span className="flex-1" />
        <Link href="/moodboard/" className="btn btn-sm btn-ghost" aria-label={`Moodboard, ${favs.length} élément${favs.length > 1 ? "s" : ""}`}>
          <IconHeart width={15} height={15} /><span className="hidden sm:inline">Moodboard</span> <span className="mono rounded-full bg-accent px-1.5 text-accent-ink">{favs.length}</span>
        </Link>
        <ThemeToggle />
        <Link href="/compte/" className="btn btn-sm px-2.5 sm:px-3" aria-label="Mon compte"><IconUser width={16} height={16} /><span className="hidden sm:inline">Compte</span></Link>
      </div>
    </header>
  );
}

export function TabBar() {
  const path = usePathname() ?? "/";
  const items = [
    { href: "/", label: "Accueil", Icon: IconHome, active: path === "/" },
    { href: "/galerie/", label: "Galerie", Icon: IconGrid, active: path.startsWith("/galerie") || EXPLORE.some((p) => path.startsWith(p)) },
    { href: "/projet/", label: "Projet", Icon: IconPhoto, active: path.startsWith("/projet") },
    { href: "/visite-3d/", label: "3D", Icon: IconHouse, active: path.startsWith("/visite-3d") || path.startsWith("/maison") },
  ];
  return (
    <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-25 border-t border-line bg-surface lg:hidden"
      style={{ padding: "6px max(8px, env(safe-area-inset-right, 0px)) calc(6px + env(safe-area-inset-bottom, 0px)) max(8px, env(safe-area-inset-left, 0px))" }}>
      <div className="grid grid-cols-5">
        {items.map(({ href, label, Icon, active }) => (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium text-muted no-underline aria-[current=page]:text-accent">
            <Icon width={22} height={22} />{label}
          </Link>
        ))}
        <button type="button" onClick={() => openCamille()} className="flex cursor-pointer flex-col items-center gap-0.5 border-0 bg-transparent py-1 text-[11px] font-medium text-muted">
          <IconChat width={22} height={22} />Camille
        </button>
      </div>
    </nav>
  );
}

/** Applique le thème mémorisé au chargement. */
export function ThemeInit() {
  useEffect(() => { const t = local.get<string | null>(KEYS.theme, null); if (t === "dark" || t === "light") document.documentElement.dataset.theme = t; }, []);
  return null;
}

/** Bandeau cookies CNIL : refuser est aussi simple qu'accepter ; aucun traceur avant consentement. */
export function CookieBanner() {
  const hydrated = useHydrated();
  const [consent, setConsent] = useLocal<{ analytics: boolean; at: string; version: number } | null>(KEYS.consent, null);
  useEffect(() => { if (consent?.analytics) void import("@/lib/analytics").then((m) => m.startAnalytics()); }, [consent]);
  const decide = (analytics: boolean) => setConsent({ analytics, at: new Date().toISOString(), version: 1 });
  // Aucun traceur configuré : rien à consentir, pas de bandeau (CNIL).
  if (!POSTHOG_KEY || !hydrated || consent) return null;
  return (
    <div role="region" aria-label="Cookies" className="fixed inset-x-0 z-30 lg:bottom-4" style={{ bottom: "calc(70px + env(safe-area-inset-bottom, 0px))" }}>
      <div className="wrap">
        <div className="panel flex flex-col gap-3 shadow-xl md:flex-row md:items-center">
          <p className="flex-1 text-sm">
            Nous utilisons une mesure d'audience anonyme (PostHog, hébergé en Europe) seulement si vous l'acceptez. Aucun cookie publicitaire.{" "}
            <Link href="/legal/cookies/">En savoir plus</Link>
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={() => decide(false)}>Refuser</button>
            <button type="button" className="btn btn-primary" onClick={() => decide(true)}>Accepter</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const cols = [
    { title: "Créer", links: [["Visite 3D", "/visite-3d/"], ["Mon projet", "/projet/"], ["Galerie d'inspiration", "/galerie/"], ["Trouver mon style", "/quiz/"], ["Ma maison", "/maison/"], ["Tarifs", "/tarifs/"]] },
    { title: "Explorer", links: [["Matériauthèque", "/matieres/"], ["Accords de matières", "/accords/"], ["Mobilier culte", "/mobilier/"], ["Lieux d'exception", "/lieux/"], ["Plantes", "/plantes/"], ["Guides pratiques", "/guides/"]] },
    { title: "Informations", links: [["Mentions légales", "/legal/mentions-legales/"], ["CGU", "/legal/cgu/"], ["CGV", "/legal/cgv/"], ["Confidentialité", "/legal/confidentialite/"], ["Cookies", "/legal/cookies/"], ["Liens affiliés", "/legal/affiliation/"]] },
  ];
  return (
    <footer className="mt-20 border-t border-line py-10 text-sm text-muted">
      <div className="wrap grid gap-8 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <span className="font-display text-lg font-extrabold text-ink">Pièce Rêvée</span>
          <p>Architecture d'intérieur et paysage pour tous. Liens affiliés et images générées par IA toujours signalés.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title} className="flex flex-col gap-1.5">
            <span className="eyebrow">{c.title}</span>
            {c.links.map(([l, h]) => <Link key={h} href={h!} className="text-muted no-underline hover:text-ink">{l}</Link>)}
          </nav>
        ))}
      </div>
    </footer>
  );
}
