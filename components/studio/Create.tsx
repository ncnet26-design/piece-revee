"use client";
import { useEffect, useRef, useState } from "react";
import { preparePhoto } from "@/lib/photo";
import { MATERIALS } from "@/lib/materials/schema";
import { createJob, retryJob, waitForJob, type IaJob, type Quality } from "@/lib/ia-jobs";
import { updateProject, uid, type Brief, type Project, type RoomType, type Version } from "@/lib/studio/project";

const ROOMS: Array<[RoomType, string]> = [["salon", "Salon"], ["chambre", "Chambre"], ["cuisine", "Cuisine"], ["salle-de-bain", "Salle de bain"], ["entree", "Entrée"], ["bureau", "Bureau"]];
const STYLES = ["Parisien contemporain", "Minimal chaleureux", "Organique et minéral", "Mid-century", "Japandi", "Art déco revisité", "Méditerranéen", "Classique haussmannien"];
const PALETTES: Array<[string, string[]]> = [["Sable et pierre", ["#EDE6DA", "#D6C3A3", "#A08A66"]], ["Olive et laiton", ["#6E7344", "#C9A564", "#EDE8DF"]], ["Terre et rouille", ["#B35A3B", "#D8A79A", "#EFE3DC"]], ["Bleu nuit et crème", ["#24345A", "#E9DFC8", "#C9A564"]], ["Noir et blanc chaud", ["#1E1E20", "#EEE8DC", "#9A8C7A"]]];
const KEEPS: Array<[string, string]> = [["fenetres", "Fenêtres"], ["portes", "Portes"], ["murs", "Murs"], ["plafond", "Plafond"], ["sol", "Sol"], ["moulures", "Moulures"], ["cheminee", "Cheminée"], ["radiateurs", "Radiateurs"], ["mobilier", "Mon mobilier"]];
const EXAMPLE = "Un salon parisien contemporain avec une table basse sculpturale en pierre naturelle, un canapé crème aux formes organiques, un fauteuil vert olive, un éclairage indirect chaleureux et des finitions haut de gamme.";

type Run = { job: IaJob; started: number };

/** Le brief guidé (chaque étape est facultative), la génération de propositions et leurs versions. */
export function Create({ project, onExplore }: { project: Project; onExplore: (v: Version) => void }) {
  const b = project.brief;
  const set = (p: Partial<Brief>) => updateProject((x) => ({ ...x, brief: { ...x.brief, ...p } }));
  const [text, setText] = useState(b.notes);
  const [quality, setQuality] = useState<Quality>("standard");
  const [variants, setVariants] = useState(2);
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cmp, setCmp] = useState<[string, string] | null>(null);
  const [adjust, setAdjust] = useState<{ v: Version; text: string } | null>(null);
  const [mats, setMats] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const photoIn = useRef<HTMLInputElement>(null), inspIn = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!runs.some((r) => r.job.status === "en_cours" || r.job.status === "en_attente")) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [runs]);

  const readFile = async (f: File, side: number) => { const r = await preparePhoto(f, side); if (!r.ok) { setError(r.message); return null; } return r.photo.dataUrl; };
  const brief = () => [
    text.trim() || "Un intérieur haut de gamme, harmonieux et lumineux.",
    b.room ? `Pièce : ${ROOMS.find((r) => r[0] === b.room)?.[1]}.` : "", b.style ? `Style : ${b.style}.` : "",
    b.palette.length ? `Palette : ${b.palette.join(", ")}.` : "", b.budget ? `Budget indicatif du mobilier : ${b.budget} €.` : "",
    "Mobilier original et sur mesure, sans marque reconnaissable.",
  ].filter(Boolean).join(" ");

  const follow = (job: IaJob, label: string, instruction?: string) => {
    setRuns((r) => [{ job, started: Date.now() }, ...r.filter((x) => x.job.id !== job.id)]);
    void waitForJob(job, (j) => setRuns((r) => r.map((x) => (x.job.id === j.id ? { ...x, job: j } : x)))).then((done) => {
      setRuns((r) => r.map((x) => (x.job.id === done.id ? { ...x, job: done } : x)));
      if (done.status === "terminee" && done.imageUrl) {
        const v: Version = { id: uid(), createdAt: new Date().toISOString(), label, kind: "ia", imageUrl: done.imageUrl, jobId: done.id, instruction, provider: `${done.provider} · ${done.model}`, width: done.width, height: done.height, objects: [] };
        updateProject((p) => ({ ...p, versions: [v, ...p.versions] }));
      }
    });
  };

  const generate = async () => {
    setError(null); set({ notes: text });
    const base = { brief: brief(), quality, keep: b.keep, keepFree: b.keepFree, materials: mats.map((id) => { const m = MATERIALS.find((x) => x.id === id)!; return `${m.name} (${m.finish})`; }), references: b.inspirations };
    for (let i = 0; i < variants; i++) {
      const r = b.photo
        ? await createJob({ ...base, mode: "transform", photo: b.photo, brief: `${base.brief}${i ? ` Variante ${i + 1} : une autre proposition cohérente.` : ""}` })
        : await createJob({ ...base, mode: "generate", width: 1536, height: 1024, brief: `${base.brief}${i ? ` Variante ${i + 1} : une autre composition.` : ""}` });
      if (!r.ok) { setError(r.message); return; }
      follow(r.value, `${b.photo ? "Transformation" : "Création"} ${i + 1}`);
    }
  };
  const runAdjust = async () => {
    if (!adjust?.v.imageUrl) return;
    const r = await createJob({ mode: "transform", photo: adjust.v.imageUrl, brief: `${adjust.text}. Ne change rien d'autre.`, keep: ["fenetres", "portes", "murs", "plafond", "sol", "mobilier"], quality });
    if (!r.ok) { setError(r.message); return; }
    follow(r.value, `Ajustement : ${adjust.text.slice(0, 40)}`, adjust.text); setAdjust(null);
  };

  const versions = project.versions.filter((v) => v.imageUrl);
  const cmpA = cmp && versions.find((v) => v.id === cmp[0]), cmpB = cmp && versions.find((v) => v.id === cmp[1]);
  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-[12.5px] transition ${on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <form className="grid content-start gap-6" onSubmit={(e) => { e.preventDefault(); void generate(); }}>
        <fieldset className="grid gap-2">
          <legend className="studio-step">1 · Votre idée</legend>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={EXAMPLE} className="rounded-2xl border border-line bg-white p-3 text-[14px] leading-relaxed" aria-label="Décrivez la pièce que vous imaginez" />
          {!text && <button type="button" className="justify-self-start text-[12px] text-muted underline" onClick={() => setText(EXAMPLE)}>Utiliser l'exemple</button>}
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="studio-step">2 · Votre pièce <span className="font-normal text-muted">(facultatif)</span></legend>
          <div className="flex flex-wrap gap-1.5">{ROOMS.map(([id, l]) => <button key={id} type="button" aria-pressed={b.room === id} className={chip(b.room === id)} onClick={() => set({ room: b.room === id ? null : id })}>{l}</button>)}</div>
          {/* eslint-disable @next/next/no-img-element */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => photoIn.current?.click()} className="studio-drop">{b.photo ? <img src={b.photo} alt="Votre pièce" className="size-full rounded-xl object-cover" /> : <span>Photo de ma pièce<small>elle servira de base</small></span>}</button>
            <button type="button" onClick={() => inspIn.current?.click()} className="studio-drop">{b.inspirations[0] ? <img src={b.inspirations[0]} alt="Votre inspiration" className="size-full rounded-xl object-cover" /> : <span>Image d'inspiration<small>Pinterest, magazine…</small></span>}</button>
          </div>
          <input ref={photoIn} type="file" accept="image/*" className="sr-only" aria-label="Importer la photo de ma pièce" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const d = await readFile(f, 1600); if (d) set({ photo: d }); } e.target.value = ""; }} />
          <input ref={inspIn} type="file" accept="image/*" className="sr-only" aria-label="Importer une image d'inspiration" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const d = await readFile(f, 1024); if (d) set({ inspirations: [d, ...b.inspirations].slice(0, 3) }); } e.target.value = ""; }} />
          {(b.photo || b.inspirations.length > 0) && <button type="button" className="justify-self-start text-[12px] text-muted underline" onClick={() => set({ photo: null, inspirations: [] })}>Retirer les images</button>}
          {b.photo && (<>
            <p className="mt-1 text-[12.5px] font-medium">À conserver sur ma photo</p>
            <div className="flex flex-wrap gap-1.5">{KEEPS.map(([id, l]) => <button key={id} type="button" aria-pressed={b.keep.includes(id)} className={chip(b.keep.includes(id))} onClick={() => set({ keep: b.keep.includes(id) ? b.keep.filter((k) => k !== id) : [...b.keep, id] })}>{l}</button>)}</div>
            <input value={b.keepFree} onChange={(e) => set({ keepFree: e.target.value })} placeholder="Autre chose à garder (ex. la bibliothèque)" className="rounded-xl border border-line bg-white px-3 py-2 text-[13px]" />
          </>)}
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="studio-step">3 · Style, couleurs, budget <span className="font-normal text-muted">(facultatif)</span></legend>
          <div className="flex flex-wrap gap-1.5">{STYLES.map((s) => <button key={s} type="button" aria-pressed={b.style === s} className={chip(b.style === s)} onClick={() => set({ style: b.style === s ? null : s })}>{s}</button>)}</div>
          <div className="flex flex-wrap gap-2">{PALETTES.map(([n, cs]) => { const on = b.palette.join() === n; return (
            <button key={n} type="button" aria-pressed={on} onClick={() => set({ palette: on ? [] : [n] })} className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[12px] ${on ? "border-ink" : "border-line bg-white"}`}><span className="flex">{cs.map((c) => <span key={c} className="-ml-1 size-5 rounded-full ring-2 ring-white first:ml-0" style={{ background: c }} />)}</span>{n}</button>); })}</div>
          <div className="flex flex-wrap gap-1.5">{MATERIALS.filter((m) => ["travertin", "marbre-calacatta", "noyer-verni", "chene-naturel", "boucle", "velours-foret", "lin-lave", "laiton-brosse", "enduit-chaux", "zellige-emeraude"].includes(m.id)).map((m) => (
            <button key={m.id} type="button" aria-pressed={mats.includes(m.id)} className={`${chip(mats.includes(m.id))} flex items-center gap-1.5`} onClick={() => setMats((x) => (x.includes(m.id) ? x.filter((y) => y !== m.id) : [...x, m.id]))}><span aria-hidden className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: m.baseColor }} />{m.name}</button>))}</div>
          <label className="flex items-center gap-2 text-[13px]">Budget mobilier<input type="number" min={0} step={100} value={b.budget ?? ""} onChange={(e) => set({ budget: e.target.value ? Number(e.target.value) : null })} className="w-28 rounded-xl border border-line bg-white px-3 py-1.5" placeholder="—" /> €</label>
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary">{b.photo ? "Transformer ma pièce" : "Créer la pièce"}</button>
          <label className="text-[12.5px] text-muted">Propositions <select value={variants} onChange={(e) => setVariants(Number(e.target.value))} className="rounded-lg border border-line bg-white px-1.5 py-1">{[1, 2, 3].map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="text-[12.5px] text-muted">Qualité <select value={quality} onChange={(e) => setQuality(e.target.value as Quality)} className="rounded-lg border border-line bg-white px-1.5 py-1"><option value="brouillon">Brouillon</option><option value="standard">Standard</option><option value="premium">Premium (2K)</option></select></label>
        </div>
        {error && <p role="alert" className="rounded-xl bg-[#FBEDE6] px-3 py-2 text-[13px] text-[#8A3B17]">{error}</p>}
      </form>

      <section aria-label="Propositions et versions" className="grid content-start gap-4">
        {runs.filter((r) => r.job.status !== "terminee").map((r) => (
          <div key={r.job.id} className="rounded-2xl border border-line bg-white p-4 text-[13px]" role="status">
            {r.job.status === "erreur" ? (<>
              <p className="font-medium text-[#8A3B17]">La génération a échoué : {r.job.error?.message}</p>
              {r.job.error?.retryable && <button type="button" className="btn mt-2 !min-h-0 !py-1.5 text-[12px]" onClick={async () => { const x = await retryJob(r.job.id); if (x.ok) follow(x.value, "Nouvelle tentative"); else setError(x.message); }}>Réessayer</button>}
            </>) : (<>
              <div className="studio-shimmer aspect-[3/2] rounded-xl" aria-hidden />
              <p className="mt-2">{r.job.status === "en_attente" ? "En file d'attente…" : "Création en cours"} · {Math.round((now - r.started) / 1000)} s <span className="text-muted">({r.job.provider}, souvent 20 à 90 s)</span></p>
            </>)}
          </div>
        ))}
        {versions.length === 0 && runs.length === 0 && (
          <div className="grid aspect-[3/2] place-items-center rounded-[22px] border border-dashed border-line bg-white/60 p-8 text-center text-[13.5px] text-muted">Vos propositions apparaîtront ici, avec chaque version conservée pour les comparer.</div>
        )}
        {cmpA && cmpB && (
          <figure className="studio-compare relative overflow-hidden rounded-[22px]" style={{ aspectRatio: "3 / 2" }}>
            { }
            <img src={cmpA.imageUrl!} alt={cmpA.label} className="absolute inset-0 size-full object-cover" />
            { }
            <img src={cmpB.imageUrl!} alt={cmpB.label} className="studio-compare-top absolute inset-0 size-full object-cover" />
            <input type="range" min={0} max={100} defaultValue={50} aria-label="Comparer les deux versions" className="studio-compare-range" onInput={(e) => (e.currentTarget.parentElement as HTMLElement).style.setProperty("--cut", `${e.currentTarget.value}%`)} />
            <figcaption className="absolute bottom-3 left-3 flex gap-2 text-[11px] text-white"><span className="rounded-full bg-black/45 px-2 py-0.5">{cmpA.label}</span><span className="rounded-full bg-black/45 px-2 py-0.5">{cmpB.label}</span></figcaption>
            <button type="button" className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[12px]" onClick={() => setCmp(null)}>Fermer la comparaison</button>
          </figure>
        )}
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
          {versions.map((v) => (
            <li key={v.id} className="pr-card overflow-hidden rounded-[20px] border border-line bg-white">
              { }
              <img src={v.imageUrl!} alt={v.label} className="aspect-[3/2] w-full object-cover" loading="lazy" />
              <div className="grid gap-2 p-3 text-[12.5px]">
                <p className="font-medium">{v.label}</p>
                <p className="text-[11px] text-muted">{new Date(v.createdAt).toLocaleString("fr-FR")} · {v.kind === "ia" ? `Image IA (${v.provider ?? "—"})` : "Rendu de la scène 3D"}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className="btn btn-primary !min-h-0 !px-3 !py-1.5 text-[12px]" onClick={() => onExplore(v)}>Explorer les meubles</button>
                  <button type="button" className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" onClick={() => setAdjust({ v, text: "" })}>Ajuster</button>
                  {versions.length > 1 && <button type="button" className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" onClick={() => setCmp([versions.find((x) => x.id !== v.id)!.id, v.id])}>Comparer</button>}
                  <button type="button" className="text-[11.5px] text-muted underline" onClick={() => updateProject((p) => ({ ...p, versions: p.versions.filter((x) => x.id !== v.id) }))}>Supprimer</button>
                </div>
                {adjust?.v.id === v.id && (
                  <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); void runAdjust(); }}>
                    <input autoFocus value={adjust.text} onChange={(e) => setAdjust({ v, text: e.target.value })} placeholder="Ex. un tapis plus clair, des rideaux en lin" className="min-w-0 flex-1 rounded-lg border border-line px-2 py-1.5" aria-label="Ajustement demandé" />
                    <button type="submit" className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" disabled={!adjust.text.trim()}>Lancer</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
