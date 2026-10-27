"use client";
import { useMemo, useState } from "react";
import type { FurnitureIcon, Material, Pairing, Place, Plant, StyleTheme } from "@/content/types";
import { FurnitureCard, MaterialCard, PairingCard, PlaceCard, PlantCard, StyleCard } from "./cards";

type Kind = "matieres" | "accords" | "mobilier" | "lieux" | "plantes" | "styles";
const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

type Item = Material | Pairing | FurnitureIcon | Place | Plant | StyleTheme;
interface Cfg { filters: string[]; match: (x: Item, f: string) => boolean; text: (x: Item) => string; wide: boolean }
const FAMILIES = ["Pierre", "Terre", "Bois", "Fibre", "Textile", "Métal", "Verre", "Composite", "Extérieur"];
const THEMES = ["Riviera", "Modernisme", "Maisons d'architectes", "Couleur", "Méditerranée", "Art déco", "Japon", "Riad", "Brutalisme", "Jardins", "Maximalisme"];
const CONFIG: Record<Kind, Cfg> = {
  matieres: { filters: ["Tout", ...FAMILIES, "Locataire"], match: (x, f) => { const m = x as Material; return f === "Locataire" ? m.rentalFriendly : m.family === f; }, text: (x) => { const m = x as Material; return `${m.name} ${m.summary} ${m.uses.join(" ")}`; }, wide: false },
  accords: { filters: ["Tout", "Salon", "Chambre", "Cuisine", "Salle de bain", "Bureau", "Jardin", "Terrasse", "Balcon"], match: (x, f) => (x as Pairing).rooms.includes(f), text: (x) => { const p = x as Pairing; return `${p.name} ${p.mood} ${p.why}`; }, wide: true },
  mobilier: { filters: ["Tout", "Assise", "Table", "Rangement", "Luminaire", "Extérieur", "Moins de 500 €"], match: (x, f) => { const m = x as FurnitureIcon; return f === "Moins de 500 €" ? m.budgetTier === "Moins de 500 €" : m.category === f; }, text: (x) => { const m = x as FurnitureIcon; return `${m.name} ${m.designer} ${m.editor} ${m.story}`; }, wide: false },
  lieux: { filters: ["Tout", ...THEMES], match: (x, f) => (x as Place).theme === f, text: (x) => { const p = x as Place; return `${p.name} ${p.author} ${p.location} ${p.country} ${p.lessons.join(" ")}`; }, wide: true },
  plantes: { filters: ["Tout", "Soleil", "Mi-ombre", "Ombre", "Balcon", "Haie", "Potager", "Intérieur", "Sans danger pour les animaux"], match: (x, f) => { const p = x as Plant; return f === "Sans danger pour les animaux" ? p.toxicity === null : (p.exposure as string[]).includes(f) || (p.uses as string[]).includes(f); }, text: (x) => { const p = x as Plant; return `${p.name} ${p.latin} ${p.type} ${p.notes}`; }, wide: false },
  styles: { filters: ["Tout", "Intérieur", "Extérieur"], match: (x, f) => ((x as StyleTheme).scope === (f === "Intérieur" ? "interieur" : "exterieur")), text: (x) => { const s = x as StyleTheme; return `${s.name} ${s.summary}`; }, wide: false },
};

export function ExploreList({ kind, items }: { kind: Kind; items: Item[] }) {
  const [filter, setFilter] = useState("Tout");
  const [q, setQ] = useState("");
  const cfg = CONFIG[kind];
  const list = useMemo(() => {
    const nq = norm(q.trim());
    return items.filter((it) => (filter === "Tout" || cfg.match(it, filter)) && (!nq || norm(cfg.text(it)).includes(nq)));
  }, [cfg, items, filter, q]);
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
      <h2 className="sr-only">Résultats</h2>
      <div className={`grid-cards ${cfg.wide ? "wide" : ""}`}>
        {list.map((it) => {
          switch (kind) {
            case "matieres": { const m = it as Material; return <MaterialCard key={m.id} m={m} />; }
            case "accords": { const p = it as Pairing; return <PairingCard key={p.id} p={p} />; }
            case "mobilier": { const f = it as FurnitureIcon; return <FurnitureCard key={f.id} f={f} />; }
            case "lieux": { const p = it as Place; return <PlaceCard key={p.id} p={p} />; }
            case "plantes": { const p = it as Plant; return <PlantCard key={p.id} p={p} />; }
            default: { const s = it as StyleTheme; return <StyleCard key={s.id} s={s} />; }
          }
        })}
      </div>
      {list.length === 0 && <p className="muted">Aucun résultat. Essayez un autre mot ou retirez le filtre.</p>}
    </>
  );
}
