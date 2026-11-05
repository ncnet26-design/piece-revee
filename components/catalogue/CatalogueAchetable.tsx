"use client";
import { useEffect, useMemo, useState } from "react";
import { Elevation } from "@/components/catalogue/Elevation";
import { filtrer, imageValide, GAMMES, NOM_GAMME, NOM_PIECE, NOM_STYLE, PIECES, STYLES, vignette, type Filtres, type Gamme, type Piece, type ProduitAchetable, type Style } from "@/lib/catalogue-achetable";

const prix = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: n % 1 ? 2 : 0 });
const date = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
const VIDE: Filtres = { style: "", piece: "", gamme: "", matiere: "" };

/** Lit les filtres dans l'adresse (une inspiration ou une matière peut ouvrir le catalogue déjà filtré). */
function lireAdresse(): Filtres {
  try {
    const u = new URLSearchParams(location.search);
    const s = u.get("style"), p = u.get("piece"), g = u.get("gamme"), m = u.get("matiere");
    return { style: (STYLES as readonly string[]).includes(s ?? "") ? (s as Style) : "", piece: (PIECES as readonly string[]).includes(p ?? "") ? (p as Piece) : "", gamme: (GAMMES as readonly string[]).includes(g ?? "") ? (g as Gamme) : "", matiere: m?.slice(0, 30) ?? "" };
  } catch { return VIDE; }
}

export function Carte({ p, textures }: { p: ProduitAchetable; textures: ReadonlySet<string> }) {
  const v = vignette(p, textures);
  const [photo, setPhoto] = useState(imageValide(p.image));
  return (
    <li className="flex flex-col text-center">
      {/* Photo publiée par l'enseigne (chargée depuis son site, jamais copiée) ; à défaut, élévation au trait du meuble. Pastille de sa matière ou de sa couleur. */}
      <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" tabIndex={-1} aria-hidden className="group relative block aspect-square overflow-hidden bg-[#EFEBE3] text-ink no-underline transition-colors hover:bg-[#E9E4DA]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image!} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setPhoto(false)}
            className="absolute inset-[9%] m-auto size-[82%] object-contain object-center mix-blend-multiply transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <Elevation famille={p.famille} nom={p.nom} dimensions={p.dimensions} className="absolute inset-x-[10%] top-[14%] h-[62%] w-[80%]" />
        )}
        {!photo && <span className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          <span className="relative block size-7 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10" style={{ background: v.teinte }}>
            {v.texture && (
              // Texture réelle de la matière (CC0), pas la photo de l'enseigne.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/matieres/${v.texture}/640.webp`} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
            )}
          </span>
          {v.legende && <span className="truncate text-[10.5px] font-semibold uppercase tracking-[.14em] text-muted">{v.legende}</span>}
          <span className="ml-auto font-mono text-[10px] text-muted">{p.id.slice(0, 4).toUpperCase()}</span>
        </span>}
      </a>
      <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[.16em] text-muted">{p.enseigne}{p.marque ? ` · ${p.marque}` : ""}</p>
      <p className="mx-auto mt-1 line-clamp-2 max-w-[30ch] text-[14.5px] leading-snug">{p.nom}</p>
      {p.dimensions && <p className="mt-1 text-[12px] text-muted">{p.dimensions}</p>}
      <p className="mt-2 text-[16px] font-semibold tabular-nums">{prix(p.prix)}</p>
      <p className="text-[11px] text-muted">Prix relevé le {date(p.verifie_le)}</p>
      <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="btn mt-3 self-center !min-h-0 !px-3.5 !py-2 text-[12.5px]">Voir chez {p.enseigne}<span className="sr-only"> : {p.nom} (nouvel onglet)</span></a>
    </li>
  );
}

/** Nomenclature d'architecte : une ligne par produit (code, dessin, désignation, finition, cote, enseigne, prix daté, lien). */
function Nomenclature({ l, textures }: { l: ProduitAchetable[]; textures: ReadonlySet<string> }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-[13px]">
        <colgroup><col className="w-[6%]" /><col className="w-[9%]" /><col className="w-[29%]" /><col className="w-[13%]" /><col className="w-[12%]" /><col className="w-[11%]" /><col className="w-[9%]" /><col className="w-[11%]" /></colgroup>
        <thead>
          <tr className="border-b border-ink text-[10.5px] uppercase tracking-[.14em] text-muted">
            <th scope="col" className="py-2 pr-3 font-semibold">Code</th><th scope="col" className="py-2 pr-3 font-semibold"><span className="sr-only">Dessin</span></th>
            <th scope="col" className="py-2 pr-3 font-semibold">Désignation</th><th scope="col" className="py-2 pr-3 font-semibold">Finition</th>
            <th scope="col" className="py-2 pr-3 font-semibold">Cotes</th><th scope="col" className="py-2 pr-3 font-semibold">Enseigne</th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">Prix</th><th scope="col" className="py-2 font-semibold"><span className="sr-only">Lien</span></th>
          </tr>
        </thead>
        <tbody>
          {l.map((p) => { const v = vignette(p, textures); return (
            <tr key={p.id} className="border-b border-line align-middle">
              <td className="py-2 pr-3 font-mono text-[11px] text-muted">{p.id.slice(0, 4).toUpperCase()}</td>
              <td className="py-2 pr-3"><span className="flex items-center gap-2"><Elevation famille={p.famille} nom={p.nom} dimensions={null} className="h-9 w-14 text-ink" />
                <span className="relative block size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10" style={{ background: v.teinte }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {v.texture && <img src={`/matieres/${v.texture}/640.webp`} alt="" loading="lazy" className="size-full object-cover" />}
                </span></span></td>
              <td className="max-w-[320px] py-2 pr-3"><span className="line-clamp-2">{p.nom}</span></td>
              <td className="py-2 pr-3 text-muted">{[...p.matiere, ...p.couleur].slice(0, 3).join(", ") || "—"}</td>
              <td className="whitespace-nowrap py-2 pr-3 font-mono text-[11px] text-muted">{p.dimensions ?? "—"}</td>
              <td className="py-2 pr-3">{p.enseigne}</td>
              <td className="whitespace-nowrap py-2 pr-3 text-right"><span className="font-semibold tabular-nums">{prix(p.prix)}</span><br /><span className="text-[10.5px] text-muted">le {date(p.verifie_le)}</span></td>
              <td className="py-2"><a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="underline decoration-[var(--bronze)] underline-offset-4">Voir chez {p.enseigne}<span className="sr-only"> : {p.nom} (nouvel onglet)</span></a></td>
            </tr>
          ); })}
        </tbody>
      </table>
    </div>
  );
}

function Puces<T extends string>({ label, valeurs, noms, actif, choisir }: { label: string; valeurs: readonly T[]; noms: Record<T, string> | ((v: T) => string); actif: T | ""; choisir: (v: T | "") => void }) {
  const nom = (v: T) => (typeof noms === "function" ? noms(v) : noms[v]);
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="p-0 text-[11px] font-semibold uppercase tracking-[.2em] text-muted">{label}</legend>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap">
        <button type="button" className="chip shrink-0" aria-pressed={actif === ""} onClick={() => choisir("")} style={actif === "" ? { background: "var(--ink)", color: "var(--surface)", borderColor: "var(--ink)" } : undefined}>Tous</button>
        {valeurs.map((v) => (
          <button key={v} type="button" className="chip shrink-0" aria-pressed={actif === v} onClick={() => choisir(actif === v ? "" : v)}
            style={actif === v ? { background: "var(--ink)", color: "var(--surface)", borderColor: "var(--ink)" } : undefined}>{nom(v)}</button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Catalogue achetable : filtres budget, pièce, style et matière ; produits rangés par gamme (petit, moyen, haut de gamme).
 * Photo publiée par l'enseigne (chargée depuis son site), dessin au trait en secours ; 8 pièces par budget, puis « voir plus ».
 */
export function CatalogueAchetable({ produits, textures, matieres }: { produits: ProduitAchetable[]; textures: string[]; matieres: string[] }) {
  const [f, setF] = useState<Filtres>(VIDE);
  const [vue, setVue] = useState<"planche" | "nomenclature">("planche");
  // 8 pièces par budget, puis « voir plus » : une page courte et lisible.
  const [ouverts, setOuverts] = useState<Partial<Record<Gamme, boolean>>>({});
  const dispo = useMemo(() => new Set(textures), [textures]);
  useEffect(() => { const a = lireAdresse(); if (a.style || a.piece || a.gamme || a.matiere) setTimeout(() => setF(a), 0); }, []);
  useEffect(() => {
    const u = new URLSearchParams(); for (const [k, v] of Object.entries(f)) if (v) u.set(k, v);
    const s = u.toString(); history.replaceState(null, "", `${s ? `?${s}` : location.pathname}${location.hash}`);
  }, [f]);
  const liste = useMemo(() => filtrer(produits, f), [produits, f]);
  const set = <K extends keyof Filtres>(k: K) => (v: Filtres[K]) => setF((x) => ({ ...x, [k]: v }));
  const gammes = f.gamme ? [f.gamme] : [...GAMMES];

  return (
    <div className="mt-10">
      <div className="grid gap-6 border-y border-line py-6 lg:grid-cols-2">
        <Puces label="Budget" valeurs={GAMMES} noms={NOM_GAMME} actif={f.gamme} choisir={set("gamme")} />
        <Puces label="Pièce" valeurs={PIECES} noms={NOM_PIECE} actif={f.piece} choisir={set("piece")} />
        <Puces label="Style" valeurs={STYLES} noms={NOM_STYLE} actif={f.style} choisir={set("style")} />
        <Puces label="Matière" valeurs={matieres} noms={(m: string) => m.charAt(0).toUpperCase() + m.slice(1)} actif={f.matiere} choisir={set("matiere")} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="m-0 text-[13px] text-muted" aria-live="polite">{liste.length} produit{liste.length > 1 ? "s" : ""}{f.style ? ` · ${NOM_STYLE[f.style]}` : ""}{f.piece ? ` · ${NOM_PIECE[f.piece]}` : ""}{f.matiere ? ` · ${f.matiere}` : ""}</p>
        <div className="seg" role="group" aria-label="Présentation">
          {(["planche", "nomenclature"] as const).map((v) => <button key={v} type="button" aria-pressed={vue === v} className={vue === v ? "on" : ""} onClick={() => setVue(v)}>{v === "planche" ? "Planche" : "Nomenclature"}</button>)}
        </div>
      </div>
      {liste.length === 0 && <p className="mt-16 text-center text-muted">Aucun produit pour cette combinaison. Retirez un filtre.</p>}
      {gammes.map((g) => {
        const l = liste.filter((p) => p.gamme === g);
        if (!l.length) return null;
        return (
          <section key={g} aria-labelledby={`g-${g}`} className="mt-14">
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <h2 id={`g-${g}`} className="text-[clamp(28px,3.2vw,44px)]">{NOM_GAMME[g]}</h2>
              <p className="text-[13px] text-muted">{l.length} produit{l.length > 1 ? "s" : ""} · {prix(Math.min(...l.map((p) => p.prix)))} à {prix(Math.max(...l.map((p) => p.prix)))}</p>
            </div>
            {vue === "planche" ? (
              <ul className="mt-8 grid list-none grid-cols-2 gap-x-4 gap-y-12 p-0 sm:grid-cols-3 lg:grid-cols-4">
                {(ouverts[g] ? l : l.slice(0, 8)).map((p) => <Carte key={p.id} p={p} textures={dispo} />)}
              </ul>
            ) : <Nomenclature l={ouverts[g] ? l : l.slice(0, 8)} textures={dispo} />}
            {l.length > 8 && !ouverts[g] && <div className="mt-10 text-center"><button type="button" className="btn" onClick={() => setOuverts((o) => ({ ...o, [g]: true }))}>Voir les {l.length - 8} autres pièces {NOM_GAMME[g].toLowerCase()}</button></div>}
          </section>
        );
      })}
      <p className="mx-auto mt-16 max-w-[70ch] text-center text-[12px] leading-relaxed text-muted">
        Produits réels relevés sur les pages des enseignes, puis vérifiés page par page (prix et lien) ; la date de relevé accompagne chaque prix.
        Gammes calculées par famille de produits sur les prix observés. Styles déduits des matières et des formes nommées par l'enseigne.
        Photos publiées par les enseignes, affichées depuis leurs sites. Aucun partenariat, aucun classement payé.
      </p>
    </div>
  );
}
