"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { BUDGET_LABELS, SPACES_EXTERIOR, SPACES_INTERIOR, isExterior, type Brief } from "@core/schemas/study.ts";
import { STYLES, styleById } from "@/content/lookup";
import { createProject } from "@/lib/projects";
import { preparePhoto, type PreparedPhoto } from "@/lib/photo";
import { useFavorites } from "@/lib/favorites";
import { KEYS, local } from "@/lib/storage";
import { DEMO_MODE } from "@/lib/site";
import { IconCamera } from "./icons";

const BUDGETS = Object.keys(BUDGET_LABELS) as Brief["budget"][];

export function NewProject() {
  const params = useSearchParams();
  const router = useRouter();
  const favs = useFavorites();
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [insp, setInsp] = useState<PreparedPhoto[]>([]);
  const [space, setSpace] = useState<Brief["space"]>(() => { const sp = params.get("space"); return sp && ([...SPACES_INTERIOR, ...SPACES_EXTERIOR] as readonly string[]).includes(sp) ? (sp as Brief["space"]) : "Salon"; });
  const [styles, setStyles] = useState<string[]>(() => {
    const st = params.get("style");
    if (st && styleById.has(st)) return [styleById.get(st)!.name];
    const top = local.get<{ profile?: { styles: { id: string }[] } }>(KEYS.quiz, {}).profile?.styles[0]?.id;
    return top && styleById.has(top) ? [styleById.get(top)!.name] : [];
  });
  const [wish, setWish] = useState("");
  const [surface, setSurface] = useState("");
  const [budget, setBudget] = useState<Brief["budget"]>("confort");
  const [tenure, setTenure] = useState<Brief["tenure"]>("proprietaire");
  const [keep, setKeep] = useState("");
  const [postal, setPostal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = { photo: useId(), insp: useId() };


  const ext = isExterior(space);
  const styleChoices = STYLES.filter((s) => s.scope === (ext ? "exterieur" : "interieur"));

  const onPhoto = async (f: File | undefined) => {
    if (!f) return; setPhotoMsg(null);
    const r = await preparePhoto(f);
    if (!r.ok) { setPhoto(null); setPhotoMsg(r.message); return; }
    setPhoto(r.photo);
    const q = r.photo.quality;
    if (q.tooDark) setPhotoMsg("La photo semble sombre : ouvrez les volets ou reprenez-la en journée pour un meilleur résultat.");
    else if (q.blurry) setPhotoMsg("La photo semble un peu floue : tenez le téléphone bien stable, sans zoom.");
  };
  const onInsp = async (files: FileList | null) => {
    if (!files) return;
    const next = [...insp];
    for (const f of Array.from(files)) { if (next.length >= 3) break; const r = await preparePhoto(f, 1280); if (r.ok) next.push(r.photo); }
    setInsp(next);
  };
  const toggleStyle = (name: string) => setStyles((s) => (s.includes(name) ? s.filter((x) => x !== name) : s.length >= 3 ? s : [...s, name]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!photo && !DEMO_MODE) { setError("Ajoutez d'abord une photo de votre espace."); return; }
    setBusy(true);
    const { libraryById } = await import("@/content/index");
    const moodboard = favs.map((id) => libraryById.get(id)?.name).filter(Boolean).slice(0, 12).join(", ");
    const brief: Brief = { space, surfaceM2: surface ? Number(surface.replace(",", ".")) || null : null, wish: [wish, moodboard ? `Moodboard : ${moodboard}` : ""].filter(Boolean).join("\n").slice(0, 2000), styles, budget, tenure, keep, postalCode: /^\d{5}$/.test(postal) ? postal : null };
    const r = await createProject({ brief, photo: photo ? { blob: photo.blob, dataUrl: photo.dataUrl } : null, inspirations: insp.map((i) => i.blob), homeId: params.get("maison") });
    setBusy(false);
    if (!r.ok) { setError(r.message); return; }
    router.push(`/projet/etude/?id=${r.id}`);
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" noValidate>
      <div className="panel flex flex-col gap-4">
        <div className="field">
          <span className="eyebrow">1 · Photo de votre espace</span>
          <label htmlFor={ids.photo} className="relative grid min-h-56 cursor-pointer place-items-center overflow-hidden rounded-[var(--r-s)] border-[1.5px] border-dashed border-muted bg-soft p-5 text-center"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void onPhoto(e.dataTransfer.files[0]); }}>
            {photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photo.dataUrl} alt="Votre espace" className="max-h-80 w-full rounded-[2px] object-cover" />
              : <span className="flex flex-col items-center gap-1.5"><IconCamera width={28} height={28} /><b>Prendre ou choisir une photo</b><span className="text-[13px] text-muted">Depuis un angle, en lumière du jour. JPG, PNG, WebP ou HEIC, 20 Mo au plus.</span></span>}
          </label>
          <input id={ids.photo} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" className="sr-only" onChange={(e) => void onPhoto(e.target.files?.[0])} />
          {photoMsg && <p className="notice notice-warn" role="status">{photoMsg}</p>}
          <p className="text-[12px] text-muted">La localisation de la photo (GPS) est retirée avant l'envoi. Vos photos ne servent jamais à entraîner une IA.</p>
        </div>
        <div className="field">
          <span className="eyebrow">2 · Inspirations (facultatif, 3 au plus)</span>
          <div className="flex flex-wrap gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {insp.map((p, i) => <figure key={i} className="relative m-0 h-16 w-16"><img src={p.dataUrl} alt={`Inspiration ${i + 1}`} className="h-16 w-16 rounded-[2px] object-cover" /><button type="button" className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full border-0 bg-ink p-0 text-xs text-bg" aria-label={`Retirer l'inspiration ${i + 1}`} onClick={() => setInsp(insp.filter((_, j) => j !== i))}>×</button></figure>)}
            {insp.length < 3 && <label htmlFor={ids.insp} className="grid h-16 w-16 cursor-pointer place-items-center rounded-[2px] border-[1.5px] border-dashed border-muted text-2xl text-muted" aria-label="Ajouter des inspirations">+</label>}
            <input id={ids.insp} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => void onInsp(e.target.files)} />
          </div>
          {favs.length > 0 && <p className="notice">Votre moodboard ({favs.length} élément{favs.length > 1 ? "s" : ""}) sera pris en compte.</p>}
        </div>
        <div className="field"><label className="eyebrow" htmlFor="wish">3 · Votre envie</label>
          <textarea id="wish" className="input" maxLength={1500} value={wish} onChange={(e) => setWish(e.target.value)} placeholder={ext ? "Ex. : une terrasse ombragée pour dîner dehors, avec des plantes qui demandent peu d'eau." : "Ex. : un salon chaleureux, tons terre et sauge, je garde mon canapé gris, il me faut plus de rangements."} />
        </div>
      </div>

      <div className="panel flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="field"><label className="eyebrow" htmlFor="space">Espace</label>
            <select id="space" className="input" value={space} onChange={(e) => { setSpace(e.target.value as Brief["space"]); setStyles([]); }}>
              <optgroup label="Intérieur">{SPACES_INTERIOR.map((s) => <option key={s}>{s}</option>)}</optgroup>
              <optgroup label="Extérieur">{SPACES_EXTERIOR.map((s) => <option key={s}>{s}</option>)}</optgroup>
            </select></div>
          <div className="field"><label className="eyebrow" htmlFor="surface">Surface (m², facultatif)</label><input id="surface" className="input" inputMode="decimal" value={surface} onChange={(e) => setSurface(e.target.value)} placeholder="ex. 24" /></div>
        </div>
        <fieldset className="field m-0 border-0 p-0"><legend className="eyebrow mb-1.5">Styles (3 au plus)</legend>
          <div className="opt">{styleChoices.map((s) => <span key={s.id}><input type="checkbox" id={`st-${s.id}`} checked={styles.includes(s.name)} onChange={() => toggleStyle(s.name)} /><label htmlFor={`st-${s.id}`}>{s.name}</label></span>)}</div>
        </fieldset>
        <fieldset className="field m-0 border-0 p-0"><legend className="eyebrow mb-1.5">Budget</legend>
          <div className="opt">{BUDGETS.map((b) => <span key={b}><input type="radio" name="budget" id={`b-${b}`} checked={budget === b} onChange={() => setBudget(b)} /><label htmlFor={`b-${b}`}>{BUDGET_LABELS[b]}</label></span>)}</div>
        </fieldset>
        <fieldset className="field m-0 border-0 p-0"><legend className="eyebrow mb-1.5">Situation</legend>
          <div className="opt">{([["proprietaire", "Propriétaire : travaux possibles"], ["locataire", "Locataire : solutions réversibles"]] as const).map(([v, l]) => <span key={v}><input type="radio" name="tenure" id={`t-${v}`} checked={tenure === v} onChange={() => setTenure(v)} /><label htmlFor={`t-${v}`}>{l}</label></span>)}</div>
        </fieldset>
        <div className="field"><label className="eyebrow" htmlFor="keep">À conserver</label><input id="keep" className="input" value={keep} maxLength={400} onChange={(e) => setKeep(e.target.value)} placeholder={ext ? "ex. dallage, olivier existant" : "ex. canapé, parquet"} /></div>
        {ext && <div className="field"><label className="eyebrow" htmlFor="postal">Code postal (pour le climat et les plantes)</label><input id="postal" className="input" inputMode="numeric" pattern="\d{5}" maxLength={5} value={postal} onChange={(e) => setPostal(e.target.value.replace(/\D/g, ""))} placeholder="ex. 13100" /></div>}
        <button type="submit" className="btn btn-primary btn-lg mt-1" disabled={busy}>{busy ? <><span className="spinner" /> Envoi…</> : "Lancer l'étude"}</button>
        {error && <p role="alert" className="notice notice-warn">{error}</p>}
        <p className="text-[12.5px] text-muted">{DEMO_MODE ? "Mode démonstration : l'étude affichée est un exemple adapté à vos choix. " : ""}Les propositions sont indicatives : vérifiez dimensions, prix et disponibilité avant d'acheter.</p>
      </div>
    </form>
  );
}
