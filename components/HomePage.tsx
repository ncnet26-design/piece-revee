"use client";
import Link from "next/link";
import { useState } from "react";
import { isExterior } from "@core/schemas/study.ts";
import { STYLES, styleById } from "@/content/lookup";
import { homeStore, useHome } from "@/lib/home";
import { openCamille } from "@/lib/camille-bus";
import { useLocalProjects } from "@/lib/projects";
import { Scene } from "./Visual";

const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

export function HomePage() {
  const home = useHome();
  const projects = useLocalProjects();
  const [name, setName] = useState("Mon appartement");
  const [thread, setThread] = useState("japandi");

  if (!home) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="panel flex flex-col gap-4">
          <h2 className="text-2xl">Créer ma maison</h2>
          <p className="text-muted">Regroupez toutes vos pièces et vos extérieurs. Le fil conducteur garde une cohérence d'une pièce à l'autre : chaque nouvelle étude le respecte, sauf si vous demandez autre chose.</p>
          <div className="field"><label className="eyebrow" htmlFor="h-name">Nom du logement</label><input id="h-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></div>
          <div className="field"><label className="eyebrow" htmlFor="h-thread">Fil conducteur</label>
            <select id="h-thread" className="input" value={thread} onChange={(e) => setThread(e.target.value)}>{STYLES.filter((s) => s.scope === "interieur").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <button type="button" className="btn btn-primary self-start" onClick={() => homeStore.save({ id: crypto.randomUUID(), name: name.trim() || "Ma maison", postalCode: null, threadStyleId: thread, projectIds: projects.map((p) => p.id) })}>Créer</button>
        </div>
        <div className="panel"><span className="eyebrow">Ce que vous obtenez</span><ul className="dots mt-3"><li>Toutes vos pièces et extérieurs au même endroit</li><li>Une palette commune d'une pièce à l'autre</li><li>Un budget global et un calendrier des travaux</li><li>L'avancement de chaque espace</li></ul></div>
      </div>
    );
  }
  const style = home.threadStyleId ? styleById.get(home.threadStyleId) : undefined;
  const rooms = projects.filter((p) => home.projectIds.includes(p.id) || p.homeId === home.id);
  const totals = rooms.reduce<[number, number]>((a, p) => { const s = p.versions.at(-1)?.result; if (!s) return a; const n = s.needs.reduce<[number, number]>((x, n) => [x[0] + n.priceRange.min * n.quantity, x[1] + n.priceRange.max * n.quantity], [0, 0]); return [a[0] + n[0], a[1] + n[1]]; }, [0, 0]);
  const done = rooms.filter((p) => p.status === "termine").length;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))]">
        {rooms.map((p) => (
          <article key={p.id} className="card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="vis" style={{ aspectRatio: "16 / 10" }}>{p.photoUrl ? <img src={p.photoUrl} alt="" /> : <Scene spec={{ scope: isExterior(p.brief.space) ? "exterieur" : "interieur", space: p.brief.space, palette: style?.palette ?? [], seed: p.id.length * 7 }} width={480} height={300} label="" />}</div>
            <div className="body"><h3><Link href={`/projet/etude/?id=${p.id}`} className="card-link text-ink no-underline">{p.title}</Link></h3><span className={`tag ${p.status === "termine" ? "tag-good" : "tag-accent"} self-start`}>{p.status === "termine" ? "Étude prête" : "En cours"}</span></div>
          </article>
        ))}
        <Link href={`/projet/nouveau/?maison=${home.id}${style ? `&style=${style.id}` : ""}`} className="grid min-h-48 place-items-center rounded-[var(--r)] border-[1.5px] border-dashed border-line font-semibold text-muted no-underline hover:border-ink">+ Ajouter une pièce ou un extérieur</Link>
      </div>
      <aside className="panel flex flex-col gap-4">
        <div><span className="eyebrow">{home.name}</span><h2 className="mt-1.5 text-[22px]">Fil conducteur : {style?.name ?? "libre"}</h2>{style && <p className="mt-1 text-sm text-muted">{style.summary}</p>}</div>
        {style && <div className="pal lg">{style.palette.map((c) => <span key={c} style={{ background: c }} />)}</div>}
        <div><span className="eyebrow">Budget global estimé</span><div className="big">{rooms.length ? `${eur(totals[0])} à ${eur(totals[1])}` : "—"}</div></div>
        <div><span className="eyebrow">Avancement</span><div className="bar mt-2"><i style={{ width: `${rooms.length ? (done / rooms.length) * 100 : 0}%` }} /></div><p className="mt-1.5 text-[13px] text-muted">{done} espace{done > 1 ? "s" : ""} conçu{done > 1 ? "s" : ""} sur {rooms.length}</p></div>
        <button type="button" className="btn" onClick={() => openCamille("Dans quel ordre faire les travaux de toute ma maison ?")}>Ordre des travaux pour toute la maison</button>
        <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => homeStore.save(null)}>Réinitialiser</button>
      </aside>
    </div>
  );
}
