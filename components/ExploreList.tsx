"use client";
import { useMemo, useState } from "react";
import { FURNITURE, MATERIALS, PAIRINGS, PLACES, PLANTS, STYLES } from "@/content/index";
import { FurnitureCard, MaterialCard, PairingCard, PlaceCard, PlantCard, StyleCard } from "./cards";

type Kind = "matieres" | "accords" | "mobilier" | "lieux" | "plantes" | "styles";
const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const CONFIG = {
  matieres: { items: MATERIALS, filters: ["Tout", ...new Set(MATERIALS.map((m) => m.family)), "Locataire"], match: (m: (typeof MATERIALS)[number], f: string) => (f === "Locataire" ? m.rentalFriendly : m.family === f), text: (m: (typeof MATERIALS)[number]) => `${m.name} ${m.summary} ${m.uses.join(" ")}`, wide: false },
  accords: { items: PAIRINGS, filters: ["Tout", "Salon", "Chambre", "Cuisine", "Salle de bain", "Bureau", "Jardin", "Terrasse", "Balcon"], match: (p: (typeof PAIRINGS)[number], f: string) => p.rooms.includes(f), text: (p: (typeof PAIRINGS)[number]) => `${p.name} ${p.mood} ${p.why}`, wide: true },
  mobilier: { items: FURNITURE, filters: ["Tout", "Assise", "Table", "Rangement", "Luminaire", "Extérieur", "Moins de 500 €"], match: (f: (typeof FURNITURE)[number], x: string) => (x === "Moins de 500 €" ? f.budgetTier === "Moins de 500 €" : f.category === x), text: (f: (typeof FURNITURE)[number]) => `${f.name} ${f.designer} ${f.editor} ${f.story}`, wide: false },
  lieux: { items: PLACES, filters: ["Tout", ...new Set(PLACES.map((p) => p.theme))], match: (p: (typeof PLACES)[number], f: string) => p.theme === f, text: (p: (typeof PLACES)[number]) => `${p.name} ${p.author} ${p.location} ${p.country} ${p.lessons.join(" ")}`, wide: true },
  plantes: { items: PLANTS, filters: ["Tout", "Soleil", "Mi-ombre", "Ombre", "Balcon", "Haie", "Potager", "Intérieur", "Sans danger pour les animaux"], match: (p: (typeof PLANTS)[number], f: string) => (f === "Sans danger pour les animaux" ? p.toxicity === null : (p.exposure as string[]).includes(f) || (p.uses as string[]).includes(f)), text: (p: (typeof PLANTS)[number]) => `${p.name} ${p.latin} ${p.type} ${p.notes}`, wide: false },
  styles: { items: STYLES, filters: ["Tout", "Intérieur", "Extérieur"], match: (s: (typeof STYLES)[number], f: string) => (f === "Intérieur" ? s.scope === "interieur" : s.scope === "exterieur"), text: (s: (typeof STYLES)[number]) => `${s.name} ${s.summary}`, wide: false },
} as const;

export function ExploreList({ kind }: { kind: Kind }) {
  const [filter, setFilter] = useState("Tout");
  const [q, setQ] = useState("");
  const cfg = CONFIG[kind];
  const list = useMemo(() => {
    const nq = norm(q.trim());
    // Les types diffèrent selon le genre ; les fonctions de CONFIG sont cohérentes avec leurs propres éléments.
    const items = cfg.items as readonly unknown[];
    const match = cfg.match as (x: unknown, f: string) => boolean;
    const text = cfg.text as (x: unknown) => string;
    return items.filter((it) => (filter === "Tout" || match(it, filter)) && (!nq || norm(text(it)).includes(nq)));
  }, [cfg, filter, q]);
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap gap-1.5" role="group" aria-label="Filtres">
          {cfg.filters.map((f) => <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}
        </div>
        <label htmlFor={`q-${kind}`} className="sr-only">Rechercher</label>
        <input id={`q-${kind}`} type="search" className="input max-w-[300px] rounded-full" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="sr-only" aria-live="polite">{list.length} résultat{list.length > 1 ? "s" : ""}</p>
      <div className={`grid-cards ${cfg.wide ? "wide" : ""}`}>
        {list.map((it) => {
          switch (kind) {
            case "matieres": { const m = it as (typeof MATERIALS)[number]; return <MaterialCard key={m.id} m={m} />; }
            case "accords": { const p = it as (typeof PAIRINGS)[number]; return <PairingCard key={p.id} p={p} />; }
            case "mobilier": { const f = it as (typeof FURNITURE)[number]; return <FurnitureCard key={f.id} f={f} />; }
            case "lieux": { const p = it as (typeof PLACES)[number]; return <PlaceCard key={p.id} p={p} />; }
            case "plantes": { const p = it as (typeof PLANTS)[number]; return <PlantCard key={p.id} p={p} />; }
            default: { const s = it as (typeof STYLES)[number]; return <StyleCard key={s.id} s={s} />; }
          }
        })}
      </div>
      {list.length === 0 && <p className="muted">Aucun résultat. Essayez un autre mot ou retirez le filtre.</p>}
    </>
  );
}
