"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useHydrated, useLocal } from "@/lib/use-local";
import { useFavorites } from "@/lib/favorites";
import { KEYS, local } from "@/lib/storage";
import { openCamille } from "@/lib/camille-bus";
import { CamilleAvatar } from "./CamilleAvatar";
import { POSTHOG_KEY } from "@/lib/site";
import { IconGrid, IconHeart, IconHouse, IconPhoto, IconSwatches, IconTheme, IconUser } from "./icons";

/** Destinations : transformer sa pièce, s'inspirer, acheter par budget (catalogue) ou partout (boutique), tarifs. */
const NAV = [
  { href: "/transformer/", label: "Transformer ma pièce" },
  { href: "/galerie/", label: "Inspirations" },
  { href: "/boutique/", label: "Boutique" },
  { href: "/tarifs/", label: "Tarifs" },
];
const EXPLORE = ["/explorer/", "/matieres/", "/accords/", "/mobilier/", "/lieux/", "/plantes/", "/guides/", "/styles/"];

function isActive(path: string, href: string) {
  if (href === "/explorer/") return EXPLORE.some((p) => p !== "/matieres/" && path.startsWith(p));
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

/** Logotype : monogramme et nom en serif. */
/** Marque : une arche (l'architecture), une goutte (la couleur) et un carreau (la matière) qui se superposent. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className={`flex-none ${className}`} style={{ isolation: "isolate" }}>
      <path d="M5 37V17.5a10.5 10.5 0 0 1 21 0V37z" fill="#A9774E" />
      <circle cx="27.5" cy="12.5" r="8.5" fill="#9AA392" style={{ mixBlendMode: "multiply" }} />
      <rect x="20" y="24" width="15" height="13" rx="1.5" fill="#D9C7AE" style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}
export function Logo({ className = "", onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className={`font-display text-[26px] leading-none tracking-[-.01em] ${onDark ? "text-[#F2EEE6]" : ""}`}>Pièce Rêvée</span>
    </span>
  );
}

export function Header() {
  const path = usePathname() ?? "/";
  const favs = useFavorites();
  return (
    <header className="sticky z-20 border-b border-line/70 backdrop-blur-xl" style={{ top: "env(safe-area-inset-top, 0px)", background: "color-mix(in srgb, var(--bg) 82%, transparent)" }}>
      <div className="wrap flex h-[70px] items-center gap-2 sm:gap-3">
        <Link href="/" className="whitespace-nowrap text-ink no-underline"><Logo /><span className="sr-only"> (accueil)</span></Link>
        <nav aria-label="Navigation principale" className="mx-auto hidden gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(path, n.href) ? "page" : undefined}
              className="relative whitespace-nowrap px-3 py-2 font-ui text-[14px] font-medium text-muted no-underline transition-colors hover:text-ink aria-[current=page]:text-ink after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform aria-[current=page]:after:scale-x-100 hover:after:scale-x-100">
              {n.label}
            </Link>
          ))}
        </nav>
        <span className="flex-1 lg:hidden" />
        <Link href="/moodboard/" className="btn btn-sm btn-ghost border-transparent px-2.5" aria-label={`Moodboard, ${favs.length} élément${favs.length > 1 ? "s" : ""}`}>
          <IconHeart width={16} height={16} />{favs.length > 0 && <span className="mono rounded-full bg-ink px-1.5 text-[10.5px] text-bg">{favs.length}</span>}
        </Link>
        <ThemeToggle />
        <Link href="/compte/" className="btn btn-sm btn-ghost border-transparent px-2.5" aria-label="Mon compte"><IconUser width={17} height={17} /></Link>
        <Link href="/transformer/" className="btn btn-primary hidden md:inline-flex">Commencer</Link>
      </div>
    </header>
  );
}

export function TabBar() {
  const path = usePathname() ?? "/";
  const items = [
    { href: "/transformer/", label: "Transformer", Icon: IconHouse, active: path.startsWith("/transformer") || path.startsWith("/ma-piece") },
    { href: "/galerie/", label: "Inspirations", Icon: IconPhoto, active: path.startsWith("/galerie") },
    { href: "/boutique/", label: "Boutique", Icon: IconGrid, active: path.startsWith("/boutique") || path.startsWith("/catalogue") },
    { href: "/tarifs/", label: "Tarifs", Icon: IconSwatches, active: path.startsWith("/tarifs") },
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
          <CamilleAvatar size={24} />Camille
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
    { title: "Créer", links: [["Transformer ma pièce", "/transformer/"], ["Inspirations", "/galerie/"], ["Boutique", "/boutique/"], ["Trouver mon style", "/quiz/"], ["Tarifs", "/tarifs/"]] },
    { title: "Autres outils", links: [["Planches de matières", "/planche/"], ["Concept éditorial", "/concept/"], ["Mon projet d'étude", "/projet/"], ["Ma maison", "/maison/"]] },
    { title: "Explorer", links: [["Tout explorer", "/explorer/"], ["Accords de matières", "/accords/"], ["Mobilier culte", "/mobilier/"], ["Lieux d'exception", "/lieux/"], ["Plantes", "/plantes/"], ["Guides pratiques", "/guides/"]] },
    { title: "Informations", links: [["Mentions légales", "/legal/mentions-legales/"], ["CGU", "/legal/cgu/"], ["CGV", "/legal/cgv/"], ["Confidentialité", "/legal/confidentialite/"], ["Cookies", "/legal/cookies/"], ["Liens affiliés", "/legal/affiliation/"]] },
  ];
  return (
    <footer className="mt-32 bg-[#161512] pb-12 pt-20 text-[14px] text-[#B9B2A6]" style={{ colorScheme: "dark" }}>
      <div className="wrap">
        <p className="max-w-[20ch] font-display text-[clamp(40px,6vw,76px)] leading-[1.02] text-[#F2EEE6]">Dessiner, choisir, <em className="text-[#D2AE7E]">habiter.</em></p>
        <div className="mt-14 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-5">
          <div className="flex flex-col gap-3">
            <span className="text-[#F2EEE6]"><Logo onDark /></span>
            <p className="max-w-[34ch]">Architecture d'intérieur et paysage pour tous. Liens d'achat et images générées par IA toujours signalés.</p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title} className="flex flex-col gap-2">
              <span className="font-ui text-[11.5px] font-semibold uppercase tracking-[.18em] text-[#D2AE7E]">{c.title}</span>
              {c.links.map(([l, h]) => <Link key={h} href={h!} className="text-[#B9B2A6] no-underline transition-colors hover:text-white">{l}</Link>)}
            </nav>
          ))}
        </div>
        <p className="mt-12 text-[12.5px] text-[#8C857A]">© {new Date().getFullYear()} Pièce Rêvée · Textures et modèles 3D : Poly Haven et Khronos (CC0 / CC BY) · Photos : auteurs crédités sur chaque image.</p>
      </div>
    </footer>
  );
}
