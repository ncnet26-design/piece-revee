"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { StudyResult } from "@core/schemas/study.ts";
import { isExterior } from "@core/schemas/study.ts";
import { PROJECT_STEPS, plantById, styleById } from "@/content/lookup";
import { openCamille } from "@/lib/camille-bus";
import { MERCHANTS } from "@/lib/catalog";
import { refineStudy, updateLocalProject, type Project } from "@/lib/projects";
import { SITE } from "@/lib/site";
import { BeforeAfter } from "./BeforeAfter";
import { YearRow } from "./Calendar";
import { Scene } from "./Visual";

type Tab = "rendus" | "plan" | "concept" | "achats" | "plantes" | "tutos" | "mesure" | "guide" | "budget";
const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

function Before({ p, w = 960, h = 720 }: { p: Project; w?: number; h?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (p.photoUrl) return <img src={p.photoUrl} alt="Votre espace avant transformation" className="h-full w-full object-cover" />;
  const style = styleById.get(p.brief.styles[0] ?? "") ?? [...styleById.values()].find((s) => s.name === p.brief.styles[0]);
  return <Scene spec={{ scope: isExterior(p.brief.space) ? "exterieur" : "interieur", space: p.brief.space, palette: style?.palette ?? ["#ECE6DA", "#C9A97E", "#8A8A80", "#3C3A35", "#A8B19A"], seed: 99, bare: true }} width={w} height={h} label="Espace avant (illustration)" />;
}

export function StudyBoard({ project }: { project: Project }) {
  const version = project.versions.at(-1)!;
  const s: StudyResult = version.result;
  const ext = isExterior(project.brief.space);
  const [tab, setTab] = useState<Tab>("rendus");
  const [variant, setVariant] = useState(0);
  const [zone, setZone] = useState<number | null>(null);
  const [refine, setRefine] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<"pdf" | "refine" | null>(null);
  const [picks, setPicks] = useState<Set<string>>(new Set());

  const tabs: [Tab, string][] = [["rendus", "Rendus"], ["plan", "Plan sur photo"], ["concept", "Concept et palette"], ["achats", "Achats"], ...(ext || s.plants.length ? [["plantes", "Plantes"] as [Tab, string]] : []), ["tutos", "Tutos"], ["mesure", "Sur-mesure"], ["guide", "Guide d'étapes"], ["budget", "Budget"]];
  const budget = useMemo(() => {
    const needs = s.needs.reduce<[number, number]>((a, n) => [a[0] + n.priceRange.min * n.quantity, a[1] + n.priceRange.max * n.quantity], [0, 0]);
    const custom = s.custom.reduce<[number, number]>((a, c) => [a[0] + c.budgetMin, a[1] + c.budgetMax], [0, 0]);
    return { min: needs[0] + custom[0], max: needs[1] + custom[1] };
  }, [s]);
  const afterPalette = s.palette.map((c) => c.hex);
  const afterSpec = { scope: (ext ? "exterieur" : "interieur") as "exterieur" | "interieur", space: project.brief.space, palette: variant === 2 ? [...afterPalette].reverse() : afterPalette, seed: 1000 + variant * 977 };
  const render = project.renders.find((r) => r.variant === variant);

  const doRefine = async () => {
    const v = refine.trim(); if (!v) return; setBusy("refine"); setMsg(null);
    const r = await refineStudy(project, v); setBusy(null);
    if (r.ok) { setRefine(""); setMsg(project.demo ? "Nouvelle version enregistrée. En démonstration, seules la palette et les budgets s'ajustent ; l'IA réécrit toute l'étude en production." : "Affinage lancé : la nouvelle version arrive dans un instant."); }
    else setMsg(r.message);
  };
  const exportPdf = async () => {
    setBusy("pdf"); setMsg(null);
    try {
      const { buildStudyPdf } = await import("@/supabase/functions/_shared/pdf");
      let photoJpeg: Uint8Array | null = null;
      if (project.photoUrl?.startsWith("data:image/jpeg")) photoJpeg = Uint8Array.from(atob(project.photoUrl.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
      const bytes = await buildStudyPdf({ study: s, space: project.brief.space, photoJpeg, renderJpegs: [], products: {}, plantNames: Object.fromEntries(s.plants.map((p) => [p.plantId, plantById.get(p.plantId)?.name ?? p.plantId])), siteUrl: SITE.url, watermark: project.demo });
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a"); a.href = url; a.download = `piece-revee-${s.concept.title.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { setMsg("Le PDF n'a pas pu être créé. Réessayez."); }
    setBusy(null);
  };
  const toggleCheck = (key: string) => { const set = new Set(project.checklist); if (set.has(key)) set.delete(key); else set.add(key); if (project.demo) updateLocalProject(project.id, { checklist: [...set] }); };

  return (
    <section className="panel" aria-labelledby="study-title">
      <span className="eyebrow">{project.brief.space} · version {version.version} · {eur(budget.min)} à {eur(budget.max)}</span>
      <h1 id="study-title" className="mt-1.5 text-[clamp(26px,3.4vw,40px)]">{s.concept.title}</h1>
      <p className="mt-1.5 text-muted">{s.concept.mood}</p>

      <div role="tablist" aria-label="Sections de l'étude" className="-mx-5 mt-4 flex gap-0.5 overflow-x-auto border-b border-line px-3.5">
        {tabs.map(([k, l]) => (
          <button key={k} id={`tab-${k}`} role="tab" type="button" aria-selected={tab === k} aria-controls={`panel-${k}`} tabIndex={tab === k ? 0 : -1}
            onClick={() => setTab(k)}
            onKeyDown={(e) => { const i = tabs.findIndex(([t]) => t === k); if (e.key === "ArrowRight") { const n = tabs[(i + 1) % tabs.length]![0]; setTab(n); document.getElementById(`tab-${n}`)?.focus(); } if (e.key === "ArrowLeft") { const n = tabs[(i - 1 + tabs.length) % tabs.length]![0]; setTab(n); document.getElementById(`tab-${n}`)?.focus(); } }}
            className="cursor-pointer whitespace-nowrap border-0 border-b-2 border-transparent bg-transparent px-2.5 pb-2.5 pt-3 text-sm font-semibold text-muted aria-selected:border-accent aria-selected:text-ink">{l}</button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-5">
        {tab === "rendus" && (
          <div className="flex flex-col gap-3">
            <BeforeAfter before={<Before p={project} />} labelAfter={`Après · variante ${variant + 1}`}
              after={render?.url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={render.url} alt={`Rendu IA, variante ${variant + 1}`} className="h-full w-full object-cover" />
                : <Scene spec={afterSpec} width={960} height={720} label={`Illustration de la variante ${variant + 1}`} />} />
            <div className="flex flex-wrap items-center gap-2">
              {[0, 1, 2].map((v) => <button key={v} type="button" className="chip" aria-pressed={variant === v} onClick={() => setVariant(v)}>Variante {v + 1}</button>)}
              <span className="text-[12.5px] text-muted">Glissez pour comparer. Mention « Image générée par IA » sur chaque rendu.</span>
            </div>
            {!render?.url && <p className="notice">{project.demo ? "Démonstration : illustration dessinée. En production, un rendu photoréaliste de votre photo (même géométrie, même point de vue) s'affiche ici." : "Les rendus sont en cours de génération."}</p>}
            <p className="text-[13px] text-muted">Retouche par zone : touchez un élément du rendu et décrivez le changement (« remplace le canapé par un modèle en velours vert »). Le reste de l'image reste identique.</p>
          </div>
        )}

        {tab === "plan" && (
          <div>
            <div className="relative overflow-hidden rounded-[var(--r-s)] bg-soft" style={{ aspectRatio: "4 / 3", maxWidth: "100%" }}>
              <div className="absolute inset-0"><Before p={project} /></div>
              {s.zones.map((z) => (
                <button key={z.id} type="button" aria-pressed={zone === z.id} aria-label={`Zone ${z.id} : ${z.title}`} onClick={() => setZone(zone === z.id ? null : z.id)}
                  className="absolute z-[2] h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-white bg-accent p-0 font-mono text-xs text-accent-ink shadow-lg aria-pressed:bg-white aria-pressed:text-[#121412]"
                  style={{ left: `${Math.min(97, Math.max(3, z.x))}%`, top: `${Math.min(95, Math.max(5, z.y))}%` }}>{z.id}</button>
              ))}
            </div>
            <div className="mt-3.5 grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,210px),1fr))]">
              {s.zones.map((z) => <button key={z.id} type="button" onClick={() => setZone(zone === z.id ? null : z.id)} className={`cursor-pointer rounded-[var(--r-s)] border bg-surface p-3 text-left ${zone === z.id ? "border-accent" : "border-line"}`}><b className="mr-1.5 font-mono text-accent">{z.id}</b><strong>{z.title}</strong><p className="mt-1 text-[13.5px] text-muted">{z.action}</p></button>)}
            </div>
            {zone !== null && <div className="mt-5"><h2 className="mb-3 text-xl">Zone {zone}</h2>{s.needs.filter((n) => n.zoneId === zone).map((n) => <NeedCard key={n.id} need={n} />)}{s.plants.filter((p) => p.zoneId === zone).map((p) => <p key={p.plantId} className="mt-1">🌿 <Link href={`/plantes/${plantById.get(p.plantId)?.slug ?? ""}/`}>{plantById.get(p.plantId)?.name}</Link> × {p.quantity} : {p.why}</p>)}</div>}
          </div>
        )}

        {tab === "concept" && (
          <div className="flex flex-col gap-5">
            <p className="max-w-[66ch]">{s.concept.summary}</p>
            <div className="grid gap-5 md:grid-cols-2">
              <div><h2 className="eyebrow mb-2">Ce que dit votre photo</h2><ul className="dots">{s.concept.analysis.map((a) => <li key={a}>{a}</li>)}</ul></div>
              <div><h2 className="eyebrow mb-2">Principes appliqués</h2><ul className="dots">{s.concept.principles.map((a) => <li key={a}>{a}</li>)}</ul></div>
            </div>
            <div><h2 className="eyebrow mb-2">Palette</h2>
              <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,140px),1fr))]">
                {s.palette.map((c) => <div key={c.hex + c.name} className="overflow-hidden rounded-[var(--r-s)] border border-line"><div className="h-[70px]" style={{ background: c.hex }} /><div className="p-2 text-[13px]"><b>{c.name}</b><br /><span className="mono">{c.hex}</span><br /><span className="text-muted">{c.usage}</span>{!c.paintColorId && <><br /><span className="text-[11.5px] text-warn">Teinte de nuancier à choisir</span></>}</div></div>)}
              </div>
              <p className="notice mt-3">Les teintes de murs sont associées à de vraies références de nuancier dès que la base de couleurs sous licence est chargée. Testez toujours un échantillon au mur.</p>
            </div>
          </div>
        )}

        {tab === "achats" && (
          <div>
            <p className="notice mb-4">Le catalogue des enseignes partenaires n'est pas encore branché : chaque besoin est décrit avec des critères précis à chercher, sans produit ni prix inventé. Dès les flux connectés : un choix principal, deux alternatives et des centaines de références comparables.</p>
            {s.needs.map((n) => <NeedCard key={n.id} need={n} picked={picks.has(n.id)} onPick={() => setPicks((p) => { const x = new Set(p); if (x.has(n.id)) x.delete(n.id); else x.add(n.id); return x; })} />)}
          </div>
        )}

        {tab === "plantes" && (
          <div className="flex flex-col gap-5">
            {s.plants.length === 0 ? <p className="muted">Pas de plantation prévue dans cette étude.</p> : (
              <div className="tw"><table className="tbl"><thead><tr><th>Plante</th><th>Qté</th><th>Exposition</th><th>Arrosage</th><th>Pourquoi</th></tr></thead>
                <tbody>{s.plants.map((pp) => { const p = plantById.get(pp.plantId); return p ? <tr key={pp.plantId}><td><Link href={`/plantes/${p.slug}/`}><b>{p.name}</b></Link><br /><i className="text-muted">{p.latin}</i></td><td className="num">{pp.quantity}</td><td>{p.exposure.join(", ")}</td><td>{p.water}</td><td>{pp.why}</td></tr> : null; })}</tbody></table></div>
            )}
            {s.plants.length > 0 && <div><h2 className="mb-2.5 text-xl">Calendrier</h2><div className="tw"><div className="flex min-w-[520px] flex-col gap-1.5">{s.plants.map((pp) => { const p = plantById.get(pp.plantId); return p && p.bloom.length ? <YearRow key={p.id} label={p.name} months={p.bloom} tone="bloom" /> : null; })}<YearRow label="Plantation" months={[...new Set(s.plants.flatMap((pp) => plantById.get(pp.plantId)?.plant ?? []))].sort((a, b) => a - b)} tone="plant" /></div></div></div>}
            {s.regulations.length > 0 && <div><h2 className="mb-2 text-xl">À vérifier avant de commencer</h2><ul className="dots">{s.regulations.map((r) => <li key={r}>{r}</li>)}</ul></div>}
          </div>
        )}

        {tab === "tutos" && s.tutorials.map((t, i) => (
          <details key={t.title} className="mb-2.5 rounded-[var(--r-s)] border border-line" open={i === 0}>
            <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-2.5 px-4 py-3"><h2 className="text-lg">{t.title}</h2><span className="text-[12.5px] text-muted">{t.difficulty} · {t.duration}</span></summary>
            <div className="grid gap-5 px-4 pb-4 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
              <div><span className="eyebrow">Outils</span><ul className="dots mt-2">{t.tools.map((o) => <li key={o}>{o}</li>)}</ul></div>
              <div><span className="eyebrow">Étapes</span><ol className="mt-2 flex flex-col gap-1.5 pl-5">{t.steps.map((st) => <li key={st}>{st}</li>)}</ol>
                <div className="mt-3 rounded-r-md border-l-[3px] border-accent bg-soft px-3 py-2.5 text-[13.5px]"><b>Astuce d'atelier.</b> {t.tip}</div>
                {t.safety && <p className="notice notice-warn mt-2"><b>Sécurité.</b> {t.safety}</p>}</div>
            </div>
          </details>
        ))}

        {tab === "mesure" && (s.custom.length === 0 ? <p className="muted">Aucun sur-mesure nécessaire pour ce projet.</p> : (
          <div className="flex flex-col gap-3">
            {s.custom.map((c) => <article key={c.element} className="rounded-[var(--r-s)] border border-line p-4"><span className="eyebrow">{c.trade}</span><h2 className="mt-1 text-lg">{c.element}</h2><p className="mono mt-1">{eur(c.budgetMin)} à {eur(c.budgetMax)}</p><p className="mt-1 text-muted">{c.description}</p></article>)}
            <p className="notice">Demandez deux à trois devis détaillés. L'annuaire d'artisans vérifiés (SIRET, assurance décennale) ouvrira avec les premiers partenaires ; en attendant, le CAUE de votre département conseille gratuitement.</p>
          </div>
        ))}

        {tab === "guide" && (
          <div className="flex flex-col gap-2.5">
            {PROJECT_STEPS.map((st, i) => {
              const items = [...st.todo, ...(ext ? st.todoExterior : [])];
              const done = items.filter((_, j) => project.checklist.includes(`${st.id}-${j}`)).length;
              return (
                <details key={st.id} className="rounded-[var(--r-s)] border border-line" open={i === 0 || (done > 0 && done < items.length)}>
                  <summary className="flex cursor-pointer items-center gap-3 px-3.5 py-3">
                    <span className={`grid h-7 w-7 flex-none place-items-center rounded-full border-[1.5px] font-mono text-xs ${done === items.length ? "border-good bg-good text-white" : "border-line"}`} style={done === items.length ? { background: "var(--good)", borderColor: "var(--good)" } : undefined}>{done === items.length ? "✓" : i + 1}</span>
                    <span className="min-w-0 flex-1"><b className="block font-display text-[17px] font-semibold">{st.title}</b><small className="text-muted">{st.subtitle} · {done}/{items.length}</small></span>
                  </summary>
                  <div className="grid gap-5 px-3.5 pb-4 md:grid-cols-2 md:pl-[54px]">
                    <div><span className="eyebrow">À faire</span>{items.map((t, j) => <label key={t} className="flex items-start gap-2 py-1 text-sm"><input type="checkbox" className="mt-1 accent-[var(--accent)]" checked={project.checklist.includes(`${st.id}-${j}`)} onChange={() => toggleCheck(`${st.id}-${j}`)} /><span>{t}</span></label>)}</div>
                    <div><span className="eyebrow">Erreurs à éviter</span><ul className="dots warn mt-2">{st.mistakes.map((m) => <li key={m}>{m}</li>)}</ul>
                      <button type="button" className="btn btn-sm mt-3.5" onClick={() => openCamille(st.camillePrompt, { projectId: project.id, step: st.id })}>Conseils de Camille pour cette étape</button></div>
                  </div>
                </details>
              );
            })}
          </div>
        )}

        {tab === "budget" && (
          <div>
            <div className="mb-4 flex flex-wrap gap-8"><div><span className="eyebrow">Fourchette du projet</span><div className="big">{eur(budget.min)} à {eur(budget.max)}</div></div></div>
            <h2 className="eyebrow">Ordre des travaux</h2>
            <div className="tw"><table className="tbl mb-5 mt-2"><tbody>{s.works.map((w, i) => <tr key={w.step}><td className="mono">{i + 1}</td><td>{w.step}{w.pro && <span className="tag ml-2">professionnel</span>}</td><td>{w.duration}</td></tr>)}</tbody></table></div>
            <div className="tw"><table className="tbl"><thead><tr><th>Poste</th><th>Quantité</th><th className="num">Fourchette</th></tr></thead>
              <tbody>{s.needs.map((n) => <tr key={n.id}><td>{n.description}</td><td>{n.quantity}</td><td className="num">{eur(n.priceRange.min * n.quantity)} à {eur(n.priceRange.max * n.quantity)}</td></tr>)}
                {s.custom.map((c) => <tr key={c.element}><td>{c.element} <span className="tag">sur-mesure</span></td><td>1</td><td className="num">{eur(c.budgetMin)} à {eur(c.budgetMax)}</td></tr>)}</tbody></table></div>
            <p className="mt-2 text-[12.5px] text-muted">Fourchettes indicatives, hors pose sauf mention. Gardez 10 à 15 % pour les imprévus.</p>
          </div>
        )}
      </div>

      {project.versions.length > 1 && <details className="mt-5 text-sm"><summary className="cursor-pointer text-muted">Historique : {project.versions.length} versions</summary><ol className="mt-2 pl-5">{project.versions.map((v) => <li key={v.version}>Version {v.version} · {new Date(v.createdAt).toLocaleString("fr-FR")} {v.instruction ? `· « ${v.instruction} »` : "· étude initiale"}</li>)}</ol></details>}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        <label htmlFor="refine" className="sr-only">Demander une modification</label>
        <input id="refine" className="input min-w-0 flex-[1_1_240px]" value={refine} maxLength={500} onChange={(e) => setRefine(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void doRefine(); } }} placeholder="Affiner : « plus lumineux », « budget divisé par deux »…" />
        <button type="button" className="btn" onClick={() => void doRefine()} disabled={busy !== null}>{busy === "refine" ? <span className="spinner" /> : null} Affiner</button>
        <button type="button" className="btn" onClick={() => openCamille(`J'ai mon étude « ${s.concept.title} ». Qu'est-ce que tu changerais, et par quoi je commence ?`, { projectId: project.id })}>Avis de Camille</button>
        <button type="button" className="btn" onClick={() => void exportPdf()} disabled={busy !== null}>{busy === "pdf" ? <span className="spinner" /> : null} Exporter en PDF</button>
      </div>
      {msg && <p role="status" className="notice mt-3">{msg}</p>}
    </section>
  );
}

function NeedCard({ need, picked, onPick }: { need: StudyResult["needs"][number]; picked?: boolean; onPick?: () => void }) {
  return (
    <article className="mb-3 rounded-[var(--r)] border border-line p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2.5">
        <div><span className="eyebrow">{need.category} · zone {need.zoneId}</span><h3 className="mt-0.5 text-[17px]">{need.description}</h3></div>
        <span className="tag tag-warn">À chercher</span>
      </div>
      <dl className="kv text-[13.5px]">
        <dt>Budget</dt><dd>{need.priceRange.min} à {need.priceRange.max} € {need.quantity > 1 ? `(× ${need.quantity})` : ""}</dd>
        {need.materials.length > 0 && <><dt>Matières</dt><dd>{need.materials.join(", ")}</dd></>}
        {need.colors.length > 0 && <><dt>Couleurs</dt><dd>{need.colors.join(", ")}</dd></>}
        {(need.maxDimensionsCm.w || need.maxDimensionsCm.d || need.maxDimensionsCm.h) && <><dt>Dimensions max</dt><dd>{[need.maxDimensionsCm.w && `L ${need.maxDimensionsCm.w}`, need.maxDimensionsCm.d && `P ${need.maxDimensionsCm.d}`, need.maxDimensionsCm.h && `H ${need.maxDimensionsCm.h}`].filter(Boolean).join(" × ")} cm</dd></>}
      </dl>
      <div className="mt-3 flex flex-wrap gap-1.5">{MERCHANTS.slice(0, 4).map((m) => <a key={m.merchant} className="btn btn-sm" href={m.url} target="_blank" rel="noopener noreferrer">{m.merchant} ↗</a>)}</div>
      {onPick && <label className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-muted"><input type="checkbox" checked={picked} onChange={onPick} /> Dans ma liste d'achats</label>}
    </article>
  );
}
