"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STYLES } from "@/content/styles";
import { preparePhoto, extractPalette } from "@/lib/photo";
import { PAINT_SHADES } from "@/lib/showroom/catalog";
import { ROOMS, TIERS, chooseReferences, composeBoard, dist, estimateBudget, guessStyle, mergePalettes, type BudgetLine, type Pick, type Room, type Tier } from "@/lib/transform/match";
import type { ProjectData } from "@/lib/transform/render";
import { libModel } from "@/lib/home3d/library";
import { ShopLinks } from "../ShopLinks";
import { IconCamera, IconClose } from "../icons";

type Phase = "form" | "analyse" | "resultat";
interface Img { url: string; name: string }
const STEPS = ["Lecture de votre pièce", "Couleurs de vos inspirations", "Choix du style et des teintes", "Sélection des matières et des objets", "Composition de la planche en 3D", "Mise en page de votre projet"];
const interiorStyles = STYLES.filter((s) => s.scope === "interieur");

/** Image venue d'un fichier, d'un collage ou d'un lien : renvoie une image locale (data URL) ou un message clair. */
async function fromFile(f: File): Promise<Img | string> {
  const r = await preparePhoto(f, 2048);
  return r.ok ? { url: r.photo.dataUrl, name: f.name } : r.message;
}
async function fromUrl(url: string): Promise<Img | string> {
  if (!/^https?:\/\//i.test(url.trim())) return "Collez l'adresse d'une image (elle commence par https://).";
  try {
    const img = new Image(); img.crossOrigin = "anonymous"; img.referrerPolicy = "no-referrer";
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error()); img.src = url.trim(); });
    const s = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement("canvas"); cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
    cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
    return { url: cv.toDataURL("image/jpeg", 0.9), name: "image en ligne" };
  } catch {
    return "Ce site ne laisse pas récupérer l'image directement. Enregistrez-la sur votre appareil puis déposez-la ici, ou faites-la glisser depuis l'autre onglet.";
  }
}

export default function Transformer() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [photo, setPhoto] = useState<Img | null>(null);
  const [insp, setInsp] = useState<Array<Img | null>>([null, null, null]);
  const [room, setRoom] = useState<Room>("Salon");
  const [styleId, setStyleId] = useState("auto");
  const [surface, setSurface] = useState("20");
  const [tier, setTier] = useState<Tier>("confort");
  const [msg, setMsg] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [link, setLink] = useState("");
  const [result, setResult] = useState<{ data: ProjectData; poster: string; lines: BudgetLine[]; items: ReturnType<typeof composeBoard> } | null>(null);
  const [mine, setMine] = useState<Record<string, number>>({});
  const [film, setFilm] = useState<{ url: string; ext: string; format: string } | null>(null);
  const [filmProgress, setFilmProgress] = useState<number | null>(null);
  const [filmFormat, setFilmFormat] = useState<"vertical" | "paysage">("vertical");
  const target = useRef<"photo" | number>("photo");

  const setSlot = useCallback((i: number, v: Img | null) => setInsp((cur) => cur.map((x, j) => (j === i ? v : x))), []);
  const nextSlot = useCallback(() => insp.findIndex((x) => !x), [insp]);
  const accept = useCallback(async (got: Img | string, where: "photo" | number | "next") => {
    if (typeof got === "string") { setMsg(got); return; }
    setMsg(null);
    if (where === "photo") setPhoto(got);
    else { const i = where === "next" ? nextSlot() : where; if (i < 0) { setMsg("Vous avez déjà trois inspirations : retirez-en une pour la remplacer."); return; } setSlot(i, got); }
  }, [nextSlot, setSlot]);

  // Coller une image (Ctrl+V) : dans la case active, sinon la pièce puis les inspirations.
  useEffect(() => {
    if (phase !== "form") return;
    const onPaste = async (e: ClipboardEvent) => {
      const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith("image/"));
      const where = !photo && target.current === "photo" ? "photo" : typeof target.current === "number" && !insp[target.current] ? target.current : "next";
      if (f) { e.preventDefault(); await accept(await fromFile(f), where); return; }
      const t = e.clipboardData?.getData("text/plain")?.trim();
      if (t && /^https?:\/\//.test(t) && !(e.target as HTMLElement)?.closest("input,textarea")) { e.preventDefault(); await accept(await fromUrl(t), where); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [phase, photo, insp, accept]);

  const onDrop = async (e: React.DragEvent, where: "photo" | number) => {
    e.preventDefault();
    const f = [...e.dataTransfer.files].find((x) => x.type.startsWith("image/"));
    if (f) return accept(await fromFile(f), where);
    const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    const html = e.dataTransfer.getData("text/html"), src = /<img[^>]+src="([^"]+)"/i.exec(html)?.[1];
    const url = src ?? uri.split("\n").find((l) => /^https?:/.test(l));
    if (url) return accept(await fromUrl(url), where);
    setMsg("Ce dépôt ne contient pas d'image lisible.");
  };

  const ready = !!photo && insp.every(Boolean);
  const run = async () => {
    if (!photo) { setMsg("Ajoutez d'abord une photo de votre pièce."); return; }
    if (!insp.every(Boolean)) { setMsg("Ajoutez trois inspirations : ce sont elles qui donnent les couleurs et l'esprit du projet."); return; }
    setMsg(null); setPhase("analyse"); setStep(0); setFilm(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const R = await import("@/lib/transform/render");
      const tick = async (i: number) => { setStep(i); await new Promise((r) => setTimeout(r, 450)); };
      await tick(0);
      const photoImg = await R.loadImage(photo.url);
      await tick(1);
      const pals = await Promise.all(insp.map((x) => extractPalette(x!.url, 6)));
      const palette = mergePalettes(pals);
      await tick(2);
      const style = styleId === "auto" ? guessStyle(palette) : STYLES.find((s) => s.id === styleId)!;
      await tick(3);
      const picks = chooseReferences(palette, room, style);
      await tick(4);
      const items = composeBoard(picks);
      const board = await R.renderBoard(items, "#EFEBE3", 2400);
      const samples = new Map<string, CanvasImageSource>();
      const { shootSample } = await import("@/lib/showroom/thumbs");
      for (const p of picks) {
        if (libModel(p.ref)) { try { samples.set(p.ref, await R.loadImage(`/models/thumbs/${p.ref}.webp`)); } catch { /* sans vignette */ } continue; }
        const cv = document.createElement("canvas"); cv.width = cv.height = 360;
        try { if (await shootSample(p.ref, cv)) samples.set(p.ref, cv); } catch { /* sans vignette */ }
      }
      await tick(5);
      await R.fontsReady();
      const lines = estimateBudget(picks, room, Math.max(4, Math.min(200, Number(surface.replace(",", ".")) || 20)), tier);
      const low = lines.reduce((s, l) => s + l.low, 0), high = lines.reduce((s, l) => s + l.high, 0);
      const named = palette.map((hex) => ({ hex, name: PAINT_SHADES.reduce((b, o) => (dist(hex, o.hex!) < dist(hex, b.hex!) ? o : b)).label }));
      const data: ProjectData = { title: room, room, style, tier, photo: photoImg, inspirations: await Promise.all(insp.map((x) => R.loadImage(x!.url))), palette: named, picks, samples, board, budget: { low, high } };
      const poster = R.drawPoster(data).toDataURL("image/jpeg", 0.92);
      setMine(Object.fromEntries(lines.map((l) => [l.label, Math.round((l.low + l.high) / 20) * 10])));
      setResult({ data, poster, lines, items });
      setPhase("resultat");
      window.scrollTo({ top: 0 });
    } catch {
      setPhase("form");
      setMsg("Le projet n'a pas pu être calculé sur cet appareil. Réessayez avec des images plus légères ou un autre navigateur.");
    }
  };

  const makeFilm = async () => {
    if (!result) return;
    setFilmProgress(0); setFilm(null);
    try {
      const R = await import("@/lib/transform/render");
      const [W, H] = filmFormat === "vertical" ? [1080, 1920] : [1920, 1080];
      const { blob, ext } = await R.encodeFilm(result.data, W, H, (p) => setFilmProgress(p));
      setFilm({ url: URL.createObjectURL(blob), ext, format: filmFormat });
    } catch (e) { setMsg((e as Error).message || "La vidéo n'a pas pu être créée sur cet appareil."); }
    setFilmProgress(null);
  };
  useEffect(() => () => { if (film) URL.revokeObjectURL(film.url); }, [film]);

  const openBoard = () => {
    if (!result) return;
    try { localStorage.setItem("pr_planche", JSON.stringify({ v: 1, title: result.data.title, bg: "#EFEBE3", items: result.items })); } catch { /* stockage plein */ }
    router.push("/planche/");
  };

  const grouped = useMemo(() => {
    const g = new Map<string, Pick[]>();
    for (const p of result?.data.picks ?? []) g.set(p.category, [...(g.get(p.category) ?? []), p]);
    return [...g];
  }, [result]);
  const myTotal = Object.values(mine).reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0);

  /* ——— Formulaire ——— */
  if (phase === "form") return (
    <div>
      <header className="pb-8 pt-6 sm:pt-10">
        <span className="eyebrow">Transformer mon espace</span>
        <h1 className="mt-3 max-w-[16ch] text-[clamp(44px,6.2vw,88px)] leading-[.95]">Une photo, trois inspirations, <em>votre projet</em></h1>
        <p className="mt-5 max-w-[60ch] text-[17px] text-muted">Nous lisons les couleurs et l'esprit de vos images, choisissons teintes, matières et objets réels, puis composons votre planche projet en haute définition et son film, avec la liste d'achats et un budget par poste.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <section className="panel" aria-labelledby="t-piece">
          <h2 id="t-piece" className="font-display text-[28px]">1. Votre pièce</h2>
          <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => void onDrop(e, "photo")} onFocus={() => { target.current = "photo"; }} onMouseEnter={() => { target.current = "photo"; }}
            className="relative mt-3 grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-[var(--r)] border-[1.5px] border-dashed border-line bg-soft text-center">
            {photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photo.url} alt="Votre pièce" className="absolute inset-0 h-full w-full object-cover" />
              : <span className="flex flex-col items-center gap-2 p-6"><IconCamera width={30} height={30} /><b>Photo de votre pièce</b><span className="text-[13px] text-muted">Choisissez, déposez ou collez (Ctrl + V) une photo prise en lumière du jour.</span></span>}
            <input type="file" accept="image/*" className="sr-only" aria-label="Choisir la photo de votre pièce" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await accept(await fromFile(f), "photo"); }} />
          </label>
          {photo && <button type="button" className="btn btn-sm btn-ghost mt-2" onClick={() => setPhoto(null)}>Changer de photo</button>}
        </section>

        <section className="panel" aria-labelledby="t-insp">
          <h2 id="t-insp" className="font-display text-[28px]">2. Trois inspirations</h2>
          <p className="mt-1 text-[13.5px] text-muted">Depuis vos photos, Pinterest, Instagram ou un magazine : déposez, collez ou glissez l'image depuis un autre onglet.</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {insp.map((x, i) => (
              <div key={i} className="relative">
                <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => void onDrop(e, i)} onMouseEnter={() => { target.current = i; }} onFocus={() => { target.current = i; }}
                  className="relative grid aspect-[3/4] cursor-pointer place-items-center overflow-hidden rounded-[var(--r-s)] border-[1.5px] border-dashed border-line bg-soft text-center">
                  {x
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={x.url} alt={`Inspiration ${i + 1}`} className="absolute inset-0 h-full w-full object-cover" />
                    : <span className="p-2 text-[13px] text-muted"><span className="block font-display text-[30px] text-ink">{i + 1}</span>Ajouter</span>}
                  <input type="file" accept="image/*" className="sr-only" aria-label={`Choisir l'inspiration ${i + 1}`} onChange={async (e) => { const f = e.target.files?.[0]; if (f) await accept(await fromFile(f), i); }} />
                </label>
                {x && <button type="button" className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-bg shadow" aria-label={`Retirer l'inspiration ${i + 1}`} onClick={() => setSlot(i, null)}><IconClose width={14} height={14} /></button>}
              </div>
            ))}
          </div>
          <form className="mt-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (link) { await accept(await fromUrl(link), "next"); setLink(""); } }}>
            <input className="input flex-1" type="url" inputMode="url" placeholder="Ou collez le lien d'une image…" aria-label="Lien d'une image d'inspiration" value={link} onChange={(e) => setLink(e.target.value)} />
            <button type="submit" className="btn">Ajouter</button>
          </form>
        </section>
      </div>

      <section className="panel mt-6 grid gap-5 lg:grid-cols-4" aria-label="Votre projet">
        <fieldset className="m-0 border-0 p-0 lg:col-span-2">
          <legend className="eyebrow mb-2">Pièce</legend>
          <div className="flex flex-wrap gap-1.5">{ROOMS.map((r) => <button key={r} type="button" aria-pressed={room === r} className={`chip ${room === r ? "chip-on" : ""}`} onClick={() => setRoom(r)}>{r}</button>)}</div>
        </fieldset>
        <label className="field"><span className="eyebrow">Style</span>
          <select className="input" value={styleId} onChange={(e) => setStyleId(e.target.value)}>
            <option value="auto">Deviner d'après mes inspirations</option>
            {interiorStyles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="field"><span className="eyebrow">Surface (m²)</span><input className="input" inputMode="decimal" value={surface} onChange={(e) => setSurface(e.target.value.replace(/[^\d,.]/g, ""))} /></label>
          <label className="field"><span className="eyebrow">Gamme</span>
            <select className="input" value={tier} onChange={(e) => setTier(e.target.value as Tier)}>{Object.entries(TIERS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </label>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" className="btn btn-lg btn-primary" onClick={() => void run()} aria-disabled={!ready}>Créer mon projet</button>
        <span className="text-[13px] text-muted">Tout est calculé sur votre appareil : vos photos ne sont envoyées nulle part.</span>
      </div>
      {msg && <p role="alert" className="notice notice-warn mt-4">{msg}</p>}
    </div>
  );

  /* ——— Analyse ——— */
  if (phase === "analyse") return (
    <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center text-center" role="status" aria-live="polite">
      <div>
        <span className="eyebrow">Votre projet se dessine</span>
        <h1 className="mt-3 text-[clamp(36px,5vw,64px)] leading-none">Un instant…</h1>
        <ol className="mx-auto mt-8 grid max-w-sm gap-3 text-left">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 text-[15px] transition-opacity duration-500 ${i <= step ? "opacity-100" : "opacity-35"}`}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] ${i < step ? "bg-ink text-bg" : i === step ? "border border-ink" : "border border-line"}`}>{i < step ? "✓" : i + 1}</span>{s}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );

  /* ——— Résultat ——— */
  const d = result!.data;
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-6">
        <div>
          <span className="eyebrow">Votre projet</span>
          <h1 className="mt-2 text-[clamp(40px,5.6vw,80px)] leading-[.95]">{d.room}, <em>esprit {d.style.name.toLowerCase()}</em></h1>
          <p className="mt-3 max-w-[60ch] text-muted">{d.style.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={() => { setPhase("form"); setResult(null); }}>Nouveau projet</button>
          <button type="button" className="btn btn-primary" onClick={openBoard}>Personnaliser dans ma planche</button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]" aria-label="Planche projet et film">
        <figure className="m-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result!.poster} alt={`Planche projet : ${d.title}`} className="w-full rounded-[var(--r-l)] shadow-[var(--shadow)]" />
          <figcaption className="mt-3 flex flex-wrap items-center gap-3">
            <a className="btn btn-primary" href={result!.poster} download={`piece-revee-${d.room.toLowerCase().replace(/\s+/g, "-")}.jpg`}>Télécharger l'image HD</a>
            <span className="text-[12.5px] text-muted">2 400 × 3 000 px, prête à imprimer ou à partager.</span>
          </figcaption>
        </figure>
        <div className="panel flex flex-col gap-4">
          <h2 className="font-display text-[30px]">Le film de votre projet</h2>
          <p className="text-[14px] text-muted">24 secondes en motion design : votre pièce, vos inspirations, la palette, la planche en 3D et chaque référence, avec le budget.</p>
          <div className="seg" role="group" aria-label="Format de la vidéo">
            {(["vertical", "paysage"] as const).map((f) => <button key={f} type="button" aria-pressed={filmFormat === f} className={`btn btn-sm ${filmFormat === f ? "btn-primary" : ""}`} onClick={() => setFilmFormat(f)}>{f === "vertical" ? "Vertical 9:16" : "Paysage 16:9"}</button>)}
          </div>
          {filmProgress === null
            ? <button type="button" className="btn btn-lg" onClick={() => void makeFilm()}>{film ? "Recréer la vidéo" : "Créer la vidéo"}</button>
            : <div role="progressbar" aria-label="Création de la vidéo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(filmProgress * 100)} className="h-2 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full bg-[var(--accent)] transition-[width]" style={{ width: `${Math.round(filmProgress * 100)}%` }} /></div>}
          {film && <>
            <video src={film.url} controls playsInline className={`w-full rounded-[var(--r)] bg-black ${film.format === "vertical" ? "mx-auto max-h-[62vh] w-auto" : ""}`} />
            <a className="btn btn-primary" href={film.url} download={`piece-revee-${d.room.toLowerCase().replace(/\s+/g, "-")}.${film.ext}`}>Télécharger la vidéo ({film.ext.toUpperCase()})</a>
          </>}
        </div>
      </section>

      <section className="section" aria-labelledby="t-palette">
        <h2 id="t-palette" className="h2">La <em>palette</em></h2>
        <ul className="m-0 mt-6 grid list-none grid-cols-3 gap-4 p-0 sm:grid-cols-6">
          {d.palette.map((p, i) => <li key={`${p.hex}-${i}`}><span className="block aspect-[4/5] rounded-[var(--r)] shadow-sm" style={{ background: p.hex }} /><span className="mt-2 block font-display text-[20px]">{p.name}</span><span className="text-[12px] uppercase tracking-wider text-muted">{p.hex}</span></li>)}
        </ul>
      </section>

      <section className="section" aria-labelledby="t-refs">
        <div className="vhead"><div><h2 id="t-refs" className="h2">Les <em>références</em></h2><p>Chaque élément se retrouve chez les enseignes : prix et disponibilités sur leur site.</p></div><Link className="btn" href="/showroom/">Explorer le showroom</Link></div>
        {grouped.map(([cat, ps]) => (
          <div key={cat} className="mt-8">
            <h3 className="eyebrow mb-3">{cat}</h3>
            <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
              {ps.map((p, i) => (
                <li key={`${p.ref}-${i}`} className="panel flex gap-4">
                  <SampleImg src={d.samples.get(p.ref)} />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display text-[22px] leading-tight">{p.name.split(" · ")[0]}</h4>
                    <p className="text-[13px] text-muted">{p.role}{p.name.includes(" · ") ? ` · ${p.name.split(" · ").slice(1).join(" · ")}` : ""}</p>
                    {p.shop.q && <div className="mt-2"><ShopLinks query={p.shop.q} kinds={p.shop.kinds} max={3} title="" compact /></div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="section" aria-labelledby="t-budget">
        <div className="vhead"><div><h2 id="t-budget" className="h2">Votre <em>budget</em></h2><p>Ordres de grandeur indicatifs par poste, gamme {TIERS[d.tier].toLowerCase()}. Ajustez chaque montant selon vos choix : le total se met à jour.</p></div><button type="button" className="btn" onClick={() => window.print()}>Imprimer</button></div>
        <div className="panel overflow-x-auto p-0">
          <table className="w-full min-w-[620px] border-collapse text-[14.5px]">
            <thead><tr className="text-left text-[12px] uppercase tracking-wider text-muted"><th className="p-4 font-medium">Poste</th><th className="p-4 font-medium">Détail</th><th className="p-4 text-right font-medium">Fourchette</th><th className="p-4 text-right font-medium">Mon budget</th></tr></thead>
            <tbody>
              {result!.lines.map((l) => (
                <tr key={l.label} className="border-t border-line">
                  <td className="p-4"><span className="block text-[11.5px] uppercase tracking-wider text-muted">{l.category}</span>{l.label}</td>
                  <td className="p-4 text-muted">{l.detail}</td>
                  <td className="whitespace-nowrap p-4 text-right">{l.low.toLocaleString("fr-FR")} – {l.high.toLocaleString("fr-FR")} €</td>
                  <td className="p-4 text-right"><input className="input w-28 text-right" inputMode="numeric" aria-label={`Mon budget : ${l.label}`} value={mine[l.label] ?? 0} onChange={(e) => setMine((m) => ({ ...m, [l.label]: Number(e.target.value.replace(/\D/g, "")) || 0 }))} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="border-t-2 border-ink font-medium"><td className="p-4" colSpan={2}>Total</td><td className="whitespace-nowrap p-4 text-right">{d.budget.low.toLocaleString("fr-FR")} – {d.budget.high.toLocaleString("fr-FR")} €</td><td className="whitespace-nowrap p-4 text-right font-display text-[22px]">{myTotal.toLocaleString("fr-FR")} €</td></tr></tfoot>
          </table>
        </div>
        <p className="mt-3 text-[12.5px] text-muted">Hors pose et main-d'œuvre. Ces montants ne sont pas des prix de produits : vérifiez toujours chez l'enseigne.</p>
      </section>

      <section className="section grid gap-6 rounded-[var(--r-l)] bg-soft p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
        <div><h2 className="h2">Aller plus loin</h2><p className="mt-2 max-w-[60ch] text-muted">Modifiez chaque échantillon dans votre planche, visitez votre logement en 3D, ou lancez l'étude complète (plan, zones, tutos). Le rendu photoréaliste de votre propre pièce par intelligence artificielle sera proposé avec le mode connecté.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" className="btn btn-primary" onClick={openBoard}>Ma planche</button><Link className="btn" href="/visite-3d/">Visite 3D</Link><Link className="btn" href="/projet/nouveau/">Étude complète</Link></div>
      </section>
      {msg && <p role="alert" className="notice notice-warn mt-4">{msg}</p>}
    </div>
  );
}

function SampleImg({ src }: { src: CanvasImageSource | undefined }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c || !src) return;
    const x = c.getContext("2d")!; x.clearRect(0, 0, c.width, c.height);
    const s = src as HTMLCanvasElement, w = s.width, h = s.height, k = Math.max(c.width / w, c.height / h) * 1.12;
    x.drawImage(s, (c.width - w * k) / 2, (c.height - h * k) / 2, w * k, h * k);
  }, [src]);
  return <canvas ref={ref} width={192} height={192} aria-hidden="true" className="h-24 w-24 shrink-0 rounded-[12px] bg-[radial-gradient(circle_at_40%_30%,#FBF9F4,#E7E1D6)]" />;
}
