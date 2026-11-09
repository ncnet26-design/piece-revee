"use client";
import { MentionIA } from "@/components/MentionIA";
import { textureMatiere } from "@/lib/texture-matiere";
import { Chargement } from "./Chargement";
import { OffreTeaser } from "@/components/OffreTeaser";
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
const STYLES = CATALOGUE_STYLES.filter((s) => PHOTOS_STYLES[s]?.[0]).map((s) => ({ id: s, title: NOM_STYLE[s], src: tailleUnsplash(PHOTOS_STYLES[s][0]!.src, 1280, "jpg"), mini: tailleUnsplash(PHOTOS_STYLES[s][0]!.src, 400, "jpg"), auteur: PHOTOS_STYLES[s][0]!.auteur }));
/** Photo d'exemple pour essayer sans avoir sa propre photo sous la main. */
const PHOTO_EXEMPLE = "/editorial/ia/salon-avant-1600.webp";
const CATALOG = MATERIALS.map((m) => ({ id: m.id, name: m.name }));
const MAX_INSPI = 5;
const KEEP: Array<[string, string]> = [["fenetres", "Fenêtres"], ["portes", "Portes"], ["murs", "Murs et volumes"], ["plafond", "Plafond"], ["sol", "Sol actuel"], ["cheminee", "Cheminée"], ["mobilier", "Mes meubles actuels"]];
const SAVE = "pr_parcours";
const TYPES: Array<[string, string]> = [["salon", "Salon"], ["chambre", "Chambre"], ["salle-de-bain", "Salle de bain"], ["cuisine", "Cuisine"], ["salle-a-manger", "Salle à manger"], ["bureau", "Bureau"], ["entree", "Entrée"], ["enfant", "Chambre d'enfant"], ["wc", "WC"]];
const NIVEAUX: Array<[string, string, string]> = [
  ["leger", "Léger", "Couleurs, textiles, luminaires et déco. Vos meubles restent."],
  ["equilibre", "Équilibré", "Nouveaux meubles, couleurs et matières. Murs, fenêtres et équipements restent."],
  ["complet", "Complet", "Rénovation faisable : sol, carrelage, façades en plus. La plomberie reste en place."],
];

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
  // Version pleine définition (2048 px) envoyée à l'IA ; `room` n'est que l'aperçu affiché.
  const [roomHD, setRoomHD] = useState<string | null>(null);
  const [inspi, setInspi] = useState<string[]>([]);
  const [roomMsg, setRoomMsg] = useState<string | null>(null);
  const [mood, setMood] = useState<Moodboard | null>(null);
  const [localPalette, setLocalPalette] = useState<string[]>([]);
  const [keep, setKeep] = useState<string[]>(["fenetres", "portes", "murs", "plafond"]);
  const [wish, setWish] = useState("");
  const [piece, setPiece] = useState<string>("");
  const [niveau, setNiveau] = useState("equilibre");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setJob] = useState<IaJob | null>(null);
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
    const r = await preparePhoto(f, 2048, 800);
    if (!r.ok) { setRoomMsg(r.message); return; }
    setRoom(r.photo.dataUrl);
    setRoomHD(await new Promise<string | null>((ok) => { const fr = new FileReader(); fr.onload = () => ok(typeof fr.result === "string" ? fr.result : null); fr.onerror = () => ok(null); fr.readAsDataURL(r.photo.blob); }));
    if (r.photo.quality.tooDark) setRoomMsg("Photo sombre : allumez la lumière ou ouvrez les volets, l'IA verra mieux la pièce.");
    else if (r.photo.quality.blurry) setRoomMsg("Photo un peu floue : tenez le téléphone immobile, à hauteur d'yeux, et reprenez-la.");
  };
  // Styles prêts à l'emploi : un toucher ajoute la photo du style, un second la retire.
  const [styles, setStyles] = useState<Record<string, string>>({});
  const [chargeStyle, setChargeStyle] = useState<string | null>(null);
  const choisi = (id: string) => Boolean(styles[id] && inspi.includes(styles[id]!));
  const toggleStyle = async (id: string, src: string) => {
    if (chargeStyle) return;
    if (choisi(id)) { const d = styles[id]!; setInspi((cur) => cur.filter((x) => x !== d)); return; }
    if (inspi.length >= MAX_INSPI) return;
    setChargeStyle(id);
    try { const d = await urlToData(src); setInspi((cur) => (cur.length < MAX_INSPI ? [...cur, d] : cur)); setStyles((r) => ({ ...r, [id]: d })); } catch { /* */ } finally { setChargeStyle(null); }
  };
  // La photo d'exemple est une image générée par IA : on la signale tant qu'elle est utilisée.
  const [exemple, setExemple] = useState<"non" | "charge" | "oui">("non");
  const essayerExemple = async () => { setExemple("charge"); try { setRoom(await urlToData(PHOTO_EXEMPLE)); setRoomHD(null); setRoomMsg(null); setExemple("oui"); } catch { setRoomMsg("La photo d'exemple n'a pas pu être chargée."); setExemple("non"); } };

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
    // Les demandes du client passent en premier ; le style des inspirations s'applique à tout le reste.
    const brief = [wish && `PRIORITY — the client asks precisely for (French, apply each request exactly, change nothing else they did not ask beyond the chosen level): ${wish}`, mood?.brief_en || mood?.brief_fr || ""].filter(Boolean).join("\n") || "Redesign this room in the spirit of the inspiration images.";
    const r = await createJob({ mode: "transform", brief, photo: roomHD ?? room, references: inspi, inspirations: true, keep, materials: mats, quality: "premium", piece: piece || undefined, niveau });
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
  // Pendant le calcul, l'étape en cours est celle qu'on prépare (moodboard ou transformation).
  const idx = busy ? (busy.startsWith("Lecture") ? 1 : 2) : steps.findIndex(([id]) => id === etape);

  return (
    <div ref={top} className="scroll-mt-24">
      <ol className="relative grid list-none grid-cols-3 gap-2 p-0 pb-2 text-[13px] sm:text-[14px]" aria-label="Étapes">
        <span aria-hidden className="absolute left-[16.6%] right-[16.6%] top-[17px] h-px bg-line" />
        <span aria-hidden className="etape-ligne absolute left-[16.6%] top-[17px] h-px bg-ink" style={{ width: `${(66.8 * idx) / 2}%` }} />
        {steps.map(([id, l], i) => {
          const fait = i < idx, actif = i === idx;
          return (
            <li key={id} aria-current={actif ? "step" : undefined} className="relative flex flex-col items-center gap-2 text-center">
              <span className={`grid size-[34px] place-items-center rounded-full border font-display text-[16px] transition-all duration-500 ${fait ? "border-ink bg-ink text-white" : actif ? `border-ink bg-surface text-ink ${busy ? "chargement-actif" : ""}` : "border-line bg-bg text-muted"}`}>{fait ? "✓" : i + 1}</span>
              <span className={actif ? "font-semibold text-ink" : fait ? "text-ink" : "text-muted"}>{l}</span>
            </li>
          );
        })}
      </ol>

      {busy && <Chargement kind={busy.startsWith("Lecture") ? "moodboard" : "transformation"} image={room} inspirations={inspi} />}
      {error && <p role="alert" className="mt-6 rounded-[2px] bg-[#FBEDE6] px-4 py-3 text-[14px] text-[#8A3B17]">{error}</p>}

      {etape === "photos" && (
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="h-piece" className="min-w-0">
            <h2 id="h-piece" className="text-[30px]">Ma pièce</h2>
            <p className="mt-2 text-[14px] text-muted">Une photo de la pièce telle qu'elle est aujourd'hui, prise de face, à hauteur d'yeux, bien éclairée.</p>
            <label className="relative mt-4 flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-[2px] border border-dashed has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink border-line bg-surface text-center text-[14px] text-muted transition hover:border-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {room ? <img src={room} alt={exemple === "oui" ? "Salon d'exemple, image générée par IA" : "Ma pièce"} className="size-full object-cover" /> : (
                <span className="flex flex-col items-center gap-3 px-6">
                  <span aria-hidden className="grid size-16 place-items-center rounded-full bg-ink text-surface"><svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg></span>
                  <span className="text-[17px] font-semibold text-ink">Prendre ou choisir une photo</span>
                  <span className="text-[12.5px]">Depuis votre téléphone ou votre ordinateur · JPG, PNG ou HEIC</span>
                </span>
              )}
              {room && exemple === "oui" && <MentionIA />}
              <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Choisir la photo de ma pièce" onChange={(e) => { setExemple("non"); void onRoom(e.target.files?.[0]); }} />
            </label>
            {roomMsg && <p className="mt-2 text-[13px] text-[#8A5A0E]">{roomMsg}</p>}
            {!room && <p className="mt-3 text-[13.5px] text-muted">Pas de photo sous la main ? <button type="button" className="inline-flex min-h-9 items-center font-semibold text-ink underline underline-offset-4" disabled={exemple === "charge"} onClick={() => void essayerExemple()}>{exemple === "charge" ? "Chargement…" : "Essayer avec notre salon d'exemple"}</button></p>}
            {room && <button type="button" className="mt-2 inline-flex min-h-9 items-center text-[13px] text-muted underline underline-offset-4" onClick={() => { setRoom(null); setRoomHD(null); setExemple("non"); }}>Changer de photo</button>}
            <fieldset className="mt-6 border-0 p-0">
              <legend className="text-[13px] font-semibold">Quelle pièce ? <span className="font-normal text-muted">(obligatoire)</span></legend>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TYPES.map(([id, nom]) => <button key={id} type="button" className="chip min-h-9" aria-pressed={piece === id} onClick={() => setPiece(id)}>{nom}</button>)}
              </div>
            </fieldset>
            <fieldset className="mt-5 border-0 p-0">
              <legend className="text-[13px] font-semibold">Jusqu'où changer ?</legend>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
                {NIVEAUX.map(([id, nom, d]) => (
                  <button key={id} type="button" aria-pressed={niveau === id} onClick={() => setNiveau(id)}
                    className={`rounded-[2px] border p-3 text-left transition ${niveau === id ? "border-ink bg-surface" : "border-line hover:border-ink"}`}>
                    <span className="block text-[14px] font-semibold">{nom}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted">{d}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="mt-5 grid gap-1.5 text-[13px] font-semibold">Ce que vous voulez changer <span className="font-normal text-muted">(facultatif, mais c'est ce qui compte le plus)</span>
              <textarea className="input font-normal" rows={3} value={wish} onChange={(e) => setWish(e.target.value)} maxLength={600}
                placeholder={piece === "salle-de-bain" ? "Ex. remplacer le meuble vasque par du bois clair, carrelage vert sauge, garder la baignoire…" : piece === "cuisine" ? "Ex. façades vert olive, plan de travail en bois, garder l'électroménager…" : "Ex. murs vert sauge, un canapé plus grand, garder mon parquet, plus de rangements…"} />
            </label>
          </section>

          <section aria-labelledby="h-inspi" className="min-w-0"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void addInspi([...e.dataTransfer.files]); }}>
            <h2 id="h-inspi" className="text-[30px]">Mes inspirations</h2>
            <p className="mt-2 text-[14px] text-muted">Jusqu'à {MAX_INSPI} images : Pinterest, Instagram, Google, un magazine… Choisissez des fichiers, glissez-les ici ou collez une capture (Ctrl + V).</p>
            <ul className="mt-4 grid list-none grid-cols-3 gap-2 p-0">
              {inspi.map((s, i) => (
                <li key={i} className="relative aspect-square overflow-hidden rounded-[2px] bg-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s} alt={`Inspiration ${i + 1}`} className="size-full object-cover" />
                  <button type="button" onClick={() => setInspi((c) => c.filter((_, j) => j !== i))} aria-label={`Retirer l'inspiration ${i + 1}`} className="absolute right-1 top-1 grid size-9 place-items-center rounded-full bg-white/90 text-[15px]">×</button>
                </li>
              ))}
              {inspi.length < MAX_INSPI && (
                <li>
                  <label className="flex aspect-square cursor-pointer items-center justify-center rounded-[2px] border border-dashed has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink border-line bg-surface text-center text-[13px] text-muted transition hover:border-ink">
                    + Ajouter
                    <input type="file" accept="image/*" multiple className="sr-only" aria-label="Ajouter des inspirations" onChange={(e) => void addInspi([...(e.target.files ?? [])])} />
                  </label>
                </li>
              )}
            </ul>
            <p className="mt-6 text-[13px] font-semibold">Ou touchez les styles qui vous plaisent</p>
            <ul className="-mx-1 mt-2 flex list-none snap-x gap-2 overflow-x-auto p-1 pb-2" aria-label="Styles prêts à l'emploi">
              {STYLES.map((st) => {
                const pris = choisi(st.id);
                return (
                  <li key={st.id} className="w-[104px] flex-none snap-start">
                    <button type="button" aria-pressed={pris} aria-busy={chargeStyle === st.id} onClick={() => void toggleStyle(st.id, st.src)} disabled={(!pris && inspi.length >= MAX_INSPI) || (chargeStyle !== null && chargeStyle !== st.id)}
                      title={`Photo : ${st.auteur} (Unsplash)`} className={`group block w-full text-left transition ${pris ? "" : "opacity-90 hover:opacity-100"}`}>
                      <span className={`relative block aspect-[4/5] overflow-hidden rounded-[2px] ring-offset-2 ring-offset-[var(--bg)] ${pris ? "ring-2 ring-ink" : ""}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={st.mini} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                        {pris && <span aria-hidden className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-ink text-[12px] text-surface">✓</span>}
                      </span>
                      <span className="mt-1.5 block text-[12.5px] font-medium">{chargeStyle === st.id ? "Ajout…" : st.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-muted">Photos de styles : Unsplash, photographes crédités dans les <a href="/galerie/" className="underline">inspirations</a>.</p>
          </section>

          <div className="lg:col-span-2 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <button type="button" className="btn btn-primary btn-lg" disabled={!room || !piece || !inspi.length || Boolean(busy)} onClick={() => void makeMood()}>Créer mon moodboard</button>
            <span className="text-[13px] text-muted">{!room ? "Ajoutez la photo de votre pièce." : !piece ? "Indiquez de quelle pièce il s'agit." : !inspi.length ? "Ajoutez au moins une inspiration." : "Vos images sont envoyées au service d'IA uniquement pour ce projet."}</span>
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
              <label className="mt-4 grid gap-1.5 text-[13px]">Ce que vous voulez changer (vous pouvez compléter)
                <textarea className="input" rows={3} value={wish} onChange={(e) => setWish(e.target.value)} maxLength={600} placeholder="Ex. garder mon canapé gris, ajouter plus de bois, budget serré…" />
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
            <a className="btn" href="/boutique/">Voir la boutique</a>
            <button type="button" className="btn btn-ghost" onClick={restart}>Nouveau projet</button>
          </div>
          <OffreTeaser compact titre="Ça vous plaît ? Faites toutes vos pièces." />
        </div>
      )}
    </div>
  );
}
