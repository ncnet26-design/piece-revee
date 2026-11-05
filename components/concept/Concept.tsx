"use client";
import { MentionIA } from "@/components/MentionIA";
/* eslint-disable @next/next/no-img-element -- image produite à la volée (data URL) */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extractPalette } from "@/lib/photo";
import { conceptImage } from "@/lib/ia";
import { SUGGESTIONS, buildConcept, guessRoom, type ConceptCard } from "@/lib/concept";
import { chooseReferences, composeBoard, guessStyle } from "@/lib/transform/match";
import { Swatch } from "../showroom/Swatch";
import { libModel } from "@/lib/home3d/library";

interface Result { card: ConceptCard; image: string; palette: string[] }

export default function Concept() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [left, setLeft] = useState<string | null>(null);
  const [res, setRes] = useState<Result | null>(null);
  const [sheet, setSheet] = useState<"idle" | "busy">("idle");
  const top = useRef<HTMLDivElement>(null);

  const create = async () => {
    const p = prompt.trim();
    if (p.length < 8) { setMsg("Décrivez l'ambiance en une phrase (pièce, couleurs, matières)."); return; }
    setBusy(true); setMsg(null);
    const room = guessRoom(p);
    const r = await conceptImage(`${p}\nPièce : ${room}. Vue large de la pièce entière, mobilier et matières bien visibles.`, "4:5");
    if (!r.ok) { setMsg(r.message); setBusy(false); return; }
    try {
      const palette = await extractPalette(r.image, 6);
      const style = guessStyle(palette);
      const card = buildConcept(p, palette, style, chooseReferences(palette, room, style));
      setRes({ card, image: r.image, palette });
      setLeft(r.left > 0 ? `Il vous reste ${r.left} image${r.left > 1 ? "s" : ""} aujourd'hui.` : "C'était votre dernière image du jour.");
      requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setMsg("L'image a été créée mais n'a pas pu être analysée sur cet appareil. Réessayez.");
    }
    setBusy(false);
  };

  const download = async () => {
    if (!res) return;
    setSheet("busy");
    try {
      const [{ drawConceptSheet }, { shootSample }, R] = await Promise.all([import("@/lib/concept-sheet"), import("@/lib/showroom/thumbs"), import("@/lib/transform/render")]);
      await R.fontsReady();
      const img = await R.loadImage(res.image);
      const samples = new Map<string, CanvasImageSource>();
      for (const p of res.card.picks) {
        if (libModel(p.ref)) { try { samples.set(p.ref, await R.loadImage(`/models/thumbs/${p.ref}.webp`)); } catch { /* sans vignette */ } continue; }
        const cv = document.createElement("canvas"); cv.width = cv.height = 512;
        try { if (await shootSample(p.ref, cv)) samples.set(p.ref, cv); } catch { /* sans vignette */ }
      }
      const out = drawConceptSheet(res.card, img, res.palette, samples);
      const a = document.createElement("a");
      a.href = out.toDataURL("image/jpeg", 0.92); a.download = `concept-${res.card.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.jpg`; a.click();
    } catch { setMsg("La fiche n'a pas pu être créée sur cet appareil."); }
    setSheet("idle");
  };

  const openBoard = async () => {
    if (!res) return;
    try {
      // Planche façon architecte : l'image du concept en tirage, et ses matières autour.
      const m = await import("@/lib/board/fromImage");
      const { board, photoId, dataUrl } = await m.boardFromImage(res.image, res.card.title);
      m.storeBoardWithPhoto(board, photoId, dataUrl);
    } catch {
      try { localStorage.setItem("pr_planche", JSON.stringify({ v: 1, title: res.card.title, bg: "#EFEBE3", items: composeBoard(res.card.picks) })); } catch { /* stockage plein */ }
    }
    router.push("/planche/");
  };
  useEffect(() => { if (msg) document.getElementById("concept-msg")?.focus(); }, [msg]);

  return (
    <div>
      <header className="mx-auto max-w-[860px] pb-8 pt-8 text-center sm:pt-14">
        <span className="eyebrow">Générer un concept</span>
        <h1 className="mt-3 text-[clamp(40px,5.6vw,76px)] leading-[1]">Décrivez l'ambiance, <em>on compose le concept.</em></h1>
        <p className="mx-auto mt-5 max-w-[56ch] text-[17px] text-muted">Une phrase suffit : une image éditoriale est créée, puis le site en tire la palette et choisit dans le showroom les matières assorties, rôle par rôle.</p>
      </header>

      <form className="mx-auto max-w-[860px] rounded-[2px] bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,.04),0_24px_48px_-28px_rgba(0,0,0,.2)] sm:p-6" onSubmit={(e) => { e.preventDefault(); void create(); }}>
        <label htmlFor="concept-prompt" className="sr-only">Votre ambiance</label>
        <textarea id="concept-prompt" rows={3} maxLength={600} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ex. : salon lambrissé de noyer, canapé brun en velours et touches de bleu doux"
          className="block w-full resize-none border-0 bg-transparent p-2 text-[18px] leading-relaxed outline-none placeholder:text-muted" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-[13px] text-muted">Image créée par IA · 6 par jour et par visiteur</p>
          <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>{busy ? <><span className="spinner" /> Création (20 à 40 s)…</> : "Créer le concept"}</button>
        </div>
      </form>
      <ul className="mx-auto mt-4 flex max-w-[860px] list-none flex-wrap justify-center gap-2 p-0" aria-label="Idées">
        {SUGGESTIONS.map((s) => <li key={s}><button type="button" className="rounded-full border border-line bg-surface px-3.5 py-2 text-left text-[13px] text-ink hover:border-ink" onClick={() => setPrompt(s)}>{s}</button></li>)}
      </ul>
      {msg && <p id="concept-msg" tabIndex={-1} role="alert" className="notice notice-warn mx-auto mt-5 max-w-[860px]">{msg}</p>}

      <div ref={top} className="scroll-mt-24" />
      {res && (
        <section aria-labelledby="concept-title" className="mt-12 rounded-[2px] bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_30px_60px_-34px_rgba(0,0,0,.25)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
            <div className="flex flex-col">
              <h2 id="concept-title" className="text-[clamp(40px,4.6vw,68px)] leading-[1]">{res.card.title}</h2>
              <p className="mt-3 text-[19px] text-muted">{res.card.tagline}</p>
              <ul className="mt-6 flex list-none gap-2.5 p-0" aria-label="Palette">
                {res.palette.map((h) => <li key={h} className="h-8 w-8 rounded-full ring-1 ring-black/10" style={{ background: h }}><span className="sr-only">{h}</span></li>)}
              </ul>
              <p className="mt-6 max-w-[52ch] text-[16px] leading-relaxed text-[#3A3A40] dark:text-muted">{res.card.text}</p>
              <dl className="mt-auto grid pt-8 text-[15px]">
                {[["Espace", res.card.room], ["Style", res.card.style.name], ["Matières", `${res.card.picks.length} références`]].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-t border-line py-3"><dt className="text-[12px] font-medium uppercase tracking-[.12em] text-muted">{k}</dt><dd className="m-0 font-semibold">{v}</dd></div>
                ))}
              </dl>
            </div>
            <figure className="relative m-0">
              <img src={res.image} alt={`Image d'ambiance : ${prompt}`} className="aspect-[4/5] w-full rounded-[2px] object-cover" />
              <MentionIA className="top-2.5 right-2.5" /><figcaption className="mt-2 text-[12px] text-muted">À titre d'inspiration.</figcaption>
            </figure>
          </div>

          <h3 className="mt-12 text-[22px]">Les matières, rôle par rôle</h3>
          <ul className="mt-5 grid list-none grid-cols-2 gap-x-5 gap-y-7 p-0 sm:grid-cols-3 lg:grid-cols-5">
            {res.card.picks.map((p, i) => (
              <li key={`${p.ref}-${i}`}>
                {libModel(p.ref)
                  ? <img src={`/models/thumbs/${p.ref}.webp`} alt="" className="aspect-square w-full rounded-[2px] bg-[#F2F2F4] object-contain p-3" loading="lazy" />
                  : <Swatch refId={p.ref} label={p.name} size={260} className="aspect-square w-full rounded-[2px]" />}
                <p className="mb-0 mt-3 text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{p.role}</p>
                <p className="m-0 mt-1 text-[14.5px] font-medium leading-snug">{p.name.split(" · ")[0]}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
            <button type="button" className="btn btn-primary" onClick={() => void download()} disabled={sheet === "busy"}>{sheet === "busy" ? <><span className="spinner" /> Préparation…</> : "Télécharger la fiche HD"}</button>
            <button type="button" className="btn" onClick={() => void openBoard()}>Ouvrir dans ma planche</button>
            <button type="button" className="btn" onClick={() => void create()} disabled={busy}>{busy ? "Création…" : "Autre proposition"}</button>
          </div>
          {left && <p className="mt-3 text-[13px] text-muted">{left}</p>}
        </section>
      )}
    </div>
  );
}
