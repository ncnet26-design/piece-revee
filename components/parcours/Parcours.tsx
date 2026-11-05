"use client";
import { textureMatiere } from "@/lib/texture-matiere";
import { useCallback, useEffect, useRef, useState } from "react";
import { PHOTOS_STYLES, tailleUnsplash } from "@/lib/inspirations-photos";
import { NOM_STYLE, STYLES as CATALOGUE_STYLES } from "@/lib/catalogue-achetable";
import { MATERIALS, materialById } from "@/lib/materials/schema";
import { preparePhoto, extractPalette } from "@/lib/photo";
import { analyseImage, createJob, moodboardFrom, waitForJob, type IaJob, type Moodboard, type Surface } from "@/lib/ia-jobs";
import { AiObjectSchema, type AiObject } from "@/lib/studio/showcase";
import { updateProject, uid } from "@/lib/studio/project";
import { Resultat } from "./Resultat";

/** Styles proposés comme inspiration : vraies photos (Unsplash), une par style. */
const STYLES = CATALOGUE_STYLES.filter((s) => PHOTOS_STYLES[s]?.[0]).map((s) => ({ id: s, title: NOM_STYLE[s], src: tailleUnsplash(PHOTOS_STYLES[s][0]!.src, 1280, "jpg") }));
const CATALOG = MATERIALS.map((m) => ({ id: m.id, name: m.name }));
const MAX_INSPI = 5;
const KEEP: Array<[string, string]> = [["fenetres", "Fenêtres"], ["portes", "Portes"], ["murs", "Murs et volumes"], ["plafond", "Plafond"], ["sol", "Sol actuel"], ["cheminee", "Cheminée"], ["mobilier", "Mes meubles actuels"]];
const SAVE = "pr_parcours";

type Etape = "photos" | "moodboard" | "resultat";
interface Saved { mood: Moodboard | null; result: { imageUrl: string; objects: AiObject[]; surfaces: Surface[] } | null }

const readFile = (f: File) => new Promise<string>((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = ko; r.readAsDataURL(f); });
async function urlToData(src: string) { const b = await (await fetch(src)).blob(); return readFile(new File([b], "inspiration", { type: b.type })); }

/**
 * Le parcours principal : ma pièce + mes inspirations → moodboard → ma pièce transformée, où tout est cliquable.
 * Les photos restent dans le navigateur ; elles ne partent au service d'images qu'au moment de créer le moodboard ou la transformation.
 */
export function Parcours() {
  const [etape, setEtape] = useState<Etape>("photos");
  const [room, setRoom] = useState<string | null>(null);
  const [inspi, setInspi] = useState<string[]>([]);
  const [roomMsg, setRoomMsg] = useState<string | null>(null);
  const [mood, setMood] = useState<Moodboard | null>(null);
  const [localPalette, setLocalPalette] = useState<string[]>([]);
  const [keep, setKeep] = useState<string[]>(["fenetres", "portes", "murs", "plafond"]);
  const [wish, setWish] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<IaJob | null>(null);
  const [result, setResult] = useState<Saved["result"]>(null);
  const [analysing, setAnalysing] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  // Reprise : moodboard et dernier résultat (les photos ne sont pas conservées).
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(SAVE) ?? "null") as Saved | null; if (s?.result) setTimeout(() => { setMood(s.mood); setResult(s.result); setEtape("resultat"); }, 0); } catch { /* */ }
  }, []);
  const persist = (s: Saved) => { try { localStorage.setItem(SAVE, JSON.stringify(s)); } catch { /* */ } };
  const go = (e: Etape) => { setEtape(e); setError(null); top.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  const addInspi = useCallback(async (files: File[]) => {
    const imgs = await Promise.all(files.filter((f) => f.type.startsWith("image/")).map(readFile));
    setInspi((cur) => [...cur, ...imgs].slice(0, MAX_INSPI));
  }, []);
  // Coller une image (capture Pinterest, Instagram…) l'ajoute aux inspirations.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (etape !== "photos") return;
      const files = [...(e.clipboardData?.files ?? [])];
      if (files.length) { e.preventDefault(); void addInspi(files); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [etape, addInspi]);

  const onRoom = async (f?: File) => {
    if (!f) return;
    setRoomMsg(null);
    const r = await preparePhoto(f);
    if (!r.ok) { setRoomMsg(r.message); return; }
    setRoom(r.photo.dataUrl);
    if (r.photo.quality.tooDark) setRoomMsg("Photo un peu sombre : le résultat sera meilleur avec plus de lumière.");
    else if (r.photo.quality.blurry) setRoomMsg("Photo un peu floue : le résultat sera meilleur avec une photo nette.");
  };
  const addStyle = async (src: string) => { try { const d = await urlToData(src); setInspi((cur) => (cur.length < MAX_INSPI ? [...cur, d] : cur)); } catch { /* */ } };

  /** Étape 2 : moodboard des inspirations (service d'analyse), avec palette calculée localement en secours. */
  const makeMood = async () => {
    setBusy("Lecture de vos inspirations…"); setError(null);
    const pal = (await Promise.all(inspi.map((s) => extractPalette(s, 3).catch(() => [])))).flat();
    setLocalPalette([...new Set(pal)].slice(0, 6));
    const r = await moodboardFrom(inspi, CATALOG);
    setBusy(null);
    if (r.ok) setMood(r.value);
    else { setMood(null); setError(`${r.message} Vous pouvez quand même transformer votre pièce : décrivez ce que vous aimez ci-dessous.`); }
    go("moodboard");
  };

  /** Étape 3 : transformation de la pièce avec les inspirations, puis repérage de tout ce qui est cliquable. */
  const transform = async () => {
    if (!room) return;
    setBusy("Transformation de votre pièce… (30 secondes à 1 minute)"); setError(null); setResult(null);
    const mats = (mood?.materials ?? []).map((id) => materialById(id)).filter(Boolean).map((m) => `${m!.name} (${m!.finish})`);
    const brief = [mood?.brief_en || mood?.brief_fr || "", wish && `Client wishes (French): ${wish}`].filter(Boolean).join("\n") || "Redesign this room in the spirit of the inspiration images.";
    const r = await createJob({ mode: "transform", brief, photo: room, references: inspi, inspirations: true, keep, materials: mats, quality: "premium" });
    if (!r.ok) { setBusy(null); setError(r.message); return; }
    setJob(r.value);
    const done = r.value.status === "terminee" ? r.value : await waitForJob(r.value, setJob);
    if (done.status !== "terminee" || !done.imageUrl) { setBusy(null); setError(done.error?.message ?? "La transformation n'a pas abouti."); return; }
    const first = { imageUrl: done.imageUrl, objects: [] as AiObject[], surfaces: [] as Surface[] };
    setResult(first); setBusy(null); go("resultat");
    setAnalysing(true);
    const a = await analyseImage(done.imageUrl);
    setAnalysing(false);
    const objects = a.ok ? a.value.objects.flatMap((o) => { const p = AiObjectSchema.safeParse(o); return p.success ? [p.data] : []; }) : [];
    const surfaces = a.ok ? a.value.surfaces ?? [] : [];
    if (!a.ok) setError(`${a.message} Vous pouvez toucher l'image pour relever une couleur.`);
    const res = { imageUrl: done.imageUrl, objects, surfaces };
    setResult(res); persist({ mood, result: res });
    // La transformation devient une version du projet : on la retrouve dans le Studio.
    updateProject((p) => ({ ...p, versions: [{ id: uid(), createdAt: new Date().toISOString(), label: mood?.style ? `Ma pièce · ${mood.style}` : "Ma pièce transformée", kind: "ia", imageUrl: done.imageUrl!, jobId: done.id, provider: `${done.provider} · ${done.model}`, width: done.width, height: done.height, objects }, ...p.versions] }));
  };

  const restart = () => { setEtape("photos"); setResult(null); setMood(null); setJob(null); setError(null); try { localStorage.removeItem(SAVE); } catch { /* */ } };
  const steps: Array<[Etape, string]> = [["photos", "Ma pièce et mes inspirations"], ["moodboard", "Mon moodboard"], ["resultat", "Ma pièce transformée"]];

  return (
    <div ref={top} className="scroll-mt-24">
      <ol className="flex list-none flex-wrap gap-x-6 gap-y-2 border-b border-line p-0 pb-4 text-[14px]" aria-label="Étapes">
        {steps.map(([id, l], i) => (
          <li key={id} aria-current={etape === id ? "step" : undefined} className={etape === id ? "font-semibold text-ink" : "text-muted"}>
            <span className="font-display mr-1.5 text-[18px]">{String(i + 1).padStart(2, "0")}</span>{l}
          </li>
        ))}
      </ol>

      {busy && <p role="status" className="studio-progress mt-6 rounded-[2px] bg-soft px-4 py-3 text-[14px]">{busy}{job && job.status === "en_cours" ? ` · ${job.provider}` : ""}</p>}
      {error && <p role="alert" className="mt-6 rounded-[2px] bg-[#FBEDE6] px-4 py-3 text-[14px] text-[#8A3B17]">{error}</p>}

      {etape === "photos" && (
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="h-piece">
            <h2 id="h-piece" className="text-[30px]">Ma pièce</h2>
            <p className="mt-2 text-[14px] text-muted">Une photo de la pièce telle qu'elle est aujourd'hui, prise de face, à hauteur d'yeux, bien éclairée.</p>
            <label className="mt-4 flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-[2px] border border-dashed border-line bg-surface text-center text-[14px] text-muted transition hover:border-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {room ? <img src={room} alt="Ma pièce" className="size-full object-cover" /> : <span>Prendre ou choisir une photo<br /><span className="text-[12px]">JPG, PNG ou HEIC</span></span>}
              <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Choisir la photo de ma pièce" onChange={(e) => void onRoom(e.target.files?.[0])} />
            </label>
            {roomMsg && <p className="mt-2 text-[13px] text-[#8A5A0E]">{roomMsg}</p>}
          </section>

          <section aria-labelledby="h-inspi"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void addInspi([...e.dataTransfer.files]); }}>
            <h2 id="h-inspi" className="text-[30px]">Mes inspirations</h2>
            <p className="mt-2 text-[14px] text-muted">Jusqu'à {MAX_INSPI} images : Pinterest, Instagram, Google, un magazine… Choisissez des fichiers, glissez-les ici ou collez une capture (Ctrl + V).</p>
            <ul className="mt-4 grid list-none grid-cols-3 gap-2 p-0">
              {inspi.map((s, i) => (
                <li key={i} className="relative aspect-square overflow-hidden rounded-[2px] bg-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s} alt={`Inspiration ${i + 1}`} className="size-full object-cover" />
                  <button type="button" onClick={() => setInspi((c) => c.filter((_, j) => j !== i))} aria-label={`Retirer l'inspiration ${i + 1}`} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/90 text-[15px]">×</button>
                </li>
              ))}
              {inspi.length < MAX_INSPI && (
                <li>
                  <label className="flex aspect-square cursor-pointer items-center justify-center rounded-[2px] border border-dashed border-line bg-surface text-center text-[13px] text-muted transition hover:border-ink">
                    + Ajouter
                    <input type="file" accept="image/*" multiple className="sr-only" aria-label="Ajouter des inspirations" onChange={(e) => void addInspi([...(e.target.files ?? [])])} />
                  </label>
                </li>
              )}
            </ul>
            <details className="mt-4 text-[13px]">
              <summary className="cursor-pointer text-muted hover:text-ink">Pas d'image sous la main ? Partir d'un de nos styles</summary>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {STYLES.map((s) => <button key={s.id} type="button" className="btn btn-sm" onClick={() => void addStyle(s.src)}>{s.title}</button>)}
              </div>
            </details>
          </section>

          <div className="lg:col-span-2 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <button type="button" className="btn btn-primary btn-lg" disabled={!room || !inspi.length || Boolean(busy)} onClick={() => void makeMood()}>Créer mon moodboard</button>
            <span className="text-[13px] text-muted">{!room ? "Ajoutez la photo de votre pièce." : !inspi.length ? "Ajoutez au moins une inspiration." : "Vos images sont envoyées au service d'IA uniquement pour ce projet."}</span>
          </div>
        </div>
      )}

      {etape === "moodboard" && (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <section aria-labelledby="h-mood">
            <p className="eyebrow">Mon moodboard</p>
            <h2 id="h-mood" className="mt-2 text-[clamp(34px,4vw,52px)]">{mood?.style || "Mes inspirations"}</h2>
            {mood?.summary && <p className="mt-3 max-w-[52ch] text-[15px] text-muted">{mood.summary}</p>}
            <div className="mt-6 columns-2 gap-2 sm:columns-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {inspi.map((s, i) => <img key={i} src={s} alt={`Inspiration ${i + 1}`} className="mb-2 w-full break-inside-avoid rounded-[2px]" />)}
            </div>
          </section>
          <aside className="flex flex-col gap-7">
            <div>
              <p className="eyebrow">Palette</p>
              <ul className="mt-3 flex list-none flex-wrap gap-3 p-0">
                {(mood?.palette.length ? mood.palette : localPalette.map((hex) => ({ name: "", hex }))).map((c) => (
                  <li key={c.hex} className="flex flex-col items-center gap-1 text-[11px] text-muted"><span className="size-12 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />{c.name || c.hex}</li>
                ))}
              </ul>
            </div>
            {mood && mood.materials.length > 0 && (
              <div>
                <p className="eyebrow">Matières</p>
                <ul className="mt-3 grid list-none grid-cols-2 gap-2 p-0">
                  {mood.materials.map((id) => { const m = materialById(id); if (!m) return null; return (
                    <li key={id} className="flex items-center gap-2.5 text-[13px]">
                      <span aria-hidden className="size-10 shrink-0 rounded-[2px] bg-cover bg-center ring-1 ring-black/5" style={{ backgroundColor: m.baseColor, backgroundImage: textureMatiere(id) ? `url(${textureMatiere(id)})` : undefined }} />
                      <span><span className="font-medium">{m.name}</span><br /><span className="text-muted">{m.finish}</span></span>
                    </li>); })}
                </ul>
              </div>
            )}
            {mood && mood.objects.length > 0 && (
              <div>
                <p className="eyebrow">Pièces clés</p>
                <ul className="mt-3 flex list-none flex-wrap gap-1.5 p-0">{mood.objects.map((o, i) => <li key={i} className="rounded-full border border-line px-3 py-1 text-[13px]">{o.label}</li>)}</ul>
              </div>
            )}
            <div>
              <p className="eyebrow">À garder chez moi</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {KEEP.map(([id, l]) => <button key={id} type="button" className="btn btn-sm" aria-pressed={keep.includes(id)} onClick={() => setKeep((k) => (k.includes(id) ? k.filter((x) => x !== id) : [...k, id]))}>{keep.includes(id) ? "✓ " : ""}{l}</button>)}
              </div>
              <label className="mt-4 grid gap-1.5 text-[13px]">Une précision ? (facultatif)
                <textarea className="input" rows={3} value={wish} onChange={(e) => setWish(e.target.value)} placeholder="Ex. garder mon canapé gris, ajouter plus de bois, budget serré…" />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary btn-lg" disabled={Boolean(busy) || !room} onClick={() => void transform()}>Transformer ma pièce</button>
              <button type="button" className="btn" onClick={() => go("photos")}>Changer mes images</button>
            </div>
            {!room && <p className="text-[13px] text-muted">La photo de votre pièce n'est plus en mémoire : revenez à l'étape 1 pour la rajouter.</p>}
          </aside>
        </div>
      )}

      {etape === "resultat" && result && (
        <div className="mt-8">
          <Resultat image={result.imageUrl} before={room ?? undefined} objects={result.objects} surfaces={result.surfaces} analysing={analysing} />
          <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6">
            {room && <button type="button" className="btn" disabled={Boolean(busy)} onClick={() => void transform()}>Proposer une autre version</button>}
            <button type="button" className="btn" onClick={() => go("moodboard")} disabled={!mood && !inspi.length}>Revoir mon moodboard</button>
            <a className="btn" href="/catalogue/">Voir le catalogue par budget</a>
            <button type="button" className="btn btn-ghost" onClick={restart}>Nouveau projet</button>
          </div>
        </div>
      )}
    </div>
  );
}
