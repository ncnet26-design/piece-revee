"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { materialById } from "@/content/lookup";
import { FAMILIES, GROUPS, PAINT_FAMILIES, VARIANT_COUNT, familyById, makeRef, parseVariant, variantName, variantShop, withOption, type Family, type Opt, variantCode, isColorAxis, customId } from "@/lib/showroom/catalog";
import { addToStoredBoard } from "@/lib/board/state";
import { sampleSize } from "@/lib/showroom/geometry";
import { ShopLinks } from "../ShopLinks";
import { Maisons } from "../Maisons";
import { IconClose } from "../icons";
import { Swatch } from "./Swatch";

const SampleViewer = dynamic(() => import("./SampleViewer").then((m) => m.SampleViewer), { ssr: false, loading: () => <span className="grid h-full place-items-center text-[13px] text-muted">Préparation de l'échantillon…</span> });

/** Options choisies pour les axes secondaires d'une famille (le premier axe forme la grille). */
type Picks = Record<string, Record<string, string>>;
const firstPicks = (): Picks => Object.fromEntries(FAMILIES.map((f) => [f.id, Object.fromEntries(f.axes.slice(1).map((a) => [a.id, a.options[0]!.id]))]));
const refFor = (f: Family, primary: Opt, picks: Record<string, string>) => makeRef(f, [primary, ...f.axes.slice(1).map((a) => a.options.find((x) => x.id === picks[a.id]) ?? a.options[0]!)]);

export default function Showroom() {
  const [fid, setFid] = useState("zellige");
  const [picks, setPicks] = useState<Picks>(firstPicks);
  const [detail, setDetail] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; link?: boolean } | null>(null);
  const [urlRead, setUrlRead] = useState(false);
  const fam = familyById.get(fid) ?? FAMILIES[0]!;

  // État partageable dans l'adresse : ?f=famille&v=déclinaison
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const f = q.get("f"), v = q.get("v");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique de l'adresse après hydratation
    if (f && familyById.has(f)) setFid(f);
    const pv = v ? parseVariant(v) : null;
    if (pv) { setFid(pv.family.id); setDetail(pv.ref); }
    setUrlRead(true);
  }, []);
  useEffect(() => {
    if (!urlRead) return;
    const q = new URLSearchParams(); q.set("f", fid); if (detail) q.set("v", detail);
    history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
  }, [fid, detail, urlRead]);

  const say = useCallback((text: string, link = false) => { setToast({ text, link }); window.setTimeout(() => setToast(null), 3600); }, []);
  const add = (ref: string) => { const n = addToStoredBoard(ref); say(`${variantName(parseVariant(ref)!, true)} ajouté à votre planche (${n} élément${n > 1 ? "s" : ""}).`, true); };
  const fp = picks[fam.id]!;
  const primary = fam.axes[0]!;
  const sections = useMemo(() => fam.id === "peinture" ? PAINT_FAMILIES.map((g) => ({ title: g.name, opts: g.shades })) : [{ title: "", opts: primary.options }], [fam, primary]);
  const mat = fam.materialId ? materialById.get(fam.materialId) : undefined;

  return (
    <div className="showroom">
      <header className="pb-10 pt-6 sm:pt-10">
        <span className="eyebrow">Matières</span>
        <h1 className="mt-3 max-w-[18ch] text-[clamp(44px,6.4vw,92px)] leading-[.95]">Chaque matière, <em>dans toutes ses nuances</em></h1>
        <p className="mt-5 max-w-[60ch] text-[17px] text-muted">{FAMILIES.length} familles et {VARIANT_COUNT.toLocaleString("fr-FR")} déclinaisons : teintes, formats, finitions et joints. Composez, comparez en 3D, puis ajoutez-les à votre planche.</p>
      </header>

      <nav aria-label="Familles de matières" className="sticky top-[70px] z-20 -mx-4 border-y border-line bg-[var(--bg)]/92 px-4 py-3 backdrop-blur-md">
        <div className="flex gap-6 overflow-x-auto">
          {GROUPS.map((g) => (
            <div key={g} className="flex shrink-0 items-center gap-1.5">
              <span className="mr-1 text-[11px] uppercase tracking-[.16em] text-muted">{g}</span>
              {FAMILIES.filter((f) => f.group === g).map((f) => (
                <button key={f.id} type="button" aria-pressed={f.id === fid} onClick={() => { setFid(f.id); setDetail(null); }} className={`chip whitespace-nowrap ${f.id === fid ? "chip-on" : ""}`}>{f.name}</button>
              ))}
            </div>
          ))}
        </div>
      </nav>

      <section className="pt-10" aria-labelledby="famille">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h2 id="famille" className="text-[clamp(34px,4vw,56px)] leading-none">{fam.name}</h2>
            <p className="mt-3 max-w-[62ch] text-muted">{fam.intro}</p>
            {mat && <p className="mt-2 text-[13.5px] text-muted">Prix indicatif : {mat.priceRange} · <Link className="underline" href={`/matieres/${mat.slug}/`}>pose, entretien, alternatives</Link></p>}
          </div>
        </div>
        {fam.axes.length > 1 && (
          <div className="mt-6 grid gap-3">
            {fam.axes.slice(1).map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-1.5" role="group" aria-label={a.label}>
                <span className="w-24 shrink-0 text-[12px] uppercase tracking-[.14em] text-muted">{a.label}</span>
                {a.options.map((o) => (
                  <button key={o.id} type="button" aria-pressed={fp[a.id] === o.id} className={`chip text-[13px] ${fp[a.id] === o.id ? "chip-on" : ""}`}
                    onClick={() => setPicks((p) => ({ ...p, [fam.id]: { ...p[fam.id], [a.id]: o.id } }))}>
                    {o.hex && <span aria-hidden="true" className="mr-1.5 inline-block h-3 w-3 rounded-full align-[-1px] ring-1 ring-black/10" style={{ background: o.hex }} />}{o.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {sections.map((sec) => (
          <div key={sec.title || "all"} className="mt-10">
            {sec.title && <h3 className="mb-4 font-display text-[26px]">{sec.title}</h3>}
            <ul className={`m-0 grid list-none gap-x-4 gap-y-7 p-0 ${fam.id === "peinture" ? "grid-cols-3 sm:grid-cols-5 lg:grid-cols-8" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
              {sec.opts.map((o) => {
                const ref = refFor(fam, o, fp), name = variantName(parseVariant(ref)!);
                return (
                  <li key={o.id} className="group">
                    <button type="button" className="block w-full text-left" onClick={() => setDetail(ref)}>
                      <span aria-hidden="true" className="block overflow-hidden rounded-[2px] shadow-[0_1px_0_rgba(0,0,0,.04),0_10px_30px_-18px_rgba(40,30,20,.45)] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-20px_rgba(40,30,20,.55)]">
                        <Swatch key={ref} refId={ref} label={name} size={fam.id === "peinture" ? 200 : 320} className="aspect-square" />
                      </span>
                      <span className="mt-2.5 block font-display text-[19px] leading-tight">{o.label}</span>
                      {fam.id !== "peinture" && <span className="block truncate text-[12.5px] text-muted">{fam.axes.slice(1).map((a) => a.options.find((x) => x.id === fp[a.id])?.label).filter((l) => l && l !== "Joint clair").join(" · ")}</span>}
                      {fam.id === "peinture" && o.hex && <span className="block text-[11.5px] uppercase tracking-wider text-muted">{o.hex}</span>}
                    </button>
                    <button type="button" className="mt-1.5 text-[12.5px] font-medium text-bronze underline-offset-4 hover:underline" onClick={() => add(ref)}>+ Ma planche<span className="sr-only"> : {name}</span></button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {detail && <Detail refId={detail} onChange={setDetail} onClose={() => setDetail(null)} onAdd={add} />}
      {toast && (
        <p role="status" className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#161512] px-5 py-2.5 text-[13.5px] text-[#F2EEE6] shadow-xl lg:bottom-8">
          {toast.text}{toast.link && <Link href="/planche/" className="font-semibold text-[#D2AE7E] underline-offset-4 hover:underline">Ouvrir</Link>}
        </p>
      )}
    </div>
  );
}

function Detail({ refId, onChange, onClose, onAdd }: { refId: string; onChange: (r: string) => void; onClose: () => void; onAdd: (r: string) => void }) {
  const v = parseVariant(refId)!;
  const name = variantName(v), shop = variantShop(v), mat = v.family.materialId ? materialById.get(v.family.materialId) : undefined;
  const viewerBox = useRef<HTMLDivElement>(null);
  const [ai, setAi] = useState<{ busy: boolean; image: string | null; msg: string | null; ref: string } | null>(null);
  if (ai && ai.ref !== refId && !ai.busy) setAi(null);
  /** L'échantillon 3D, photographié pour de vrai par IA (même angle, même matière). */
  const makePhoto = async () => {
    const cv = viewerBox.current?.querySelector("canvas"); if (!cv) return;
    setAi({ busy: true, image: null, msg: null, ref: refId });
    const { photoreal } = await import("@/lib/ia");
    const r = await photoreal(cv.toDataURL("image/jpeg", 0.92), `Un seul échantillon : ${name}.`, "1:1");
    setAi({ busy: false, image: r.ok ? r.image : null, msg: r.ok ? null : r.message, ref: refId });
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={name} onClick={onClose}>
      <div className="flex h-full w-full max-w-[1040px] flex-col overflow-y-auto bg-[var(--bg)] shadow-2xl lg:flex-row" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-square w-full shrink-0 bg-[radial-gradient(circle_at_40%_35%,#FBF8F2,#E6E0D5)] lg:aspect-auto lg:h-full lg:w-[54%]">
          <div ref={viewerBox} className="h-full w-full"><SampleViewer refId={refId} label={`Échantillon en 3D : ${name}. Faites glisser pour le tourner.`} /></div>
          {ai?.image && (
            <div className="absolute inset-0 bg-[var(--bg)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ai.image} alt={`Photo réaliste créée par IA : ${name}`} className="h-full w-full object-cover" />
              <span className="absolute left-4 top-14 rounded-full bg-white/80 px-3 py-1 text-[11.5px] text-ink/80 backdrop-blur">Photo créée par IA</span>
            </div>
          )}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {ai?.image && <><a className="btn btn-sm btn-light" href={ai.image} download={`${name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.jpg`}>Télécharger</a><button type="button" className="btn btn-sm btn-light" onClick={() => setAi(null)}>Revenir à la 3D</button></>}
            {!ai?.image && <button type="button" className="btn btn-sm btn-light" onClick={() => void makePhoto()} disabled={ai?.busy}>{ai?.busy ? <><span className="spinner" /> Photo en cours…</> : "Photo réaliste (IA)"}</button>}
          </div>
          {ai?.msg && <p role="status" className="absolute bottom-16 right-4 max-w-[70%] rounded-[2px] bg-white/90 px-3 py-2 text-[12.5px] text-ink shadow">{ai.msg}</p>}
          <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/70 px-3 py-1 text-[11.5px] uppercase tracking-[.14em] text-ink/70 backdrop-blur">Échantillon {Math.round(sampleSize(v.family.gen) * 100)} × {Math.round(sampleSize(v.family.gen) * 100)} cm</span>
        </div>
        <div className="flex flex-1 flex-col gap-5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="eyebrow">{v.family.name}</span>
              <h2 className="mt-2 text-[clamp(28px,3vw,40px)] leading-[1.02]">{variantName(v, true)}</h2>
              <p className="mt-1 text-[14px] text-muted">{name.split(" · ").slice(1).join(" · ")}</p>
              <p className="mt-1 font-mono text-[11.5px] tracking-[.04em] text-muted">Réf. {variantCode(v)}</p>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" aria-label="Fermer" onClick={onClose}><IconClose width={18} height={18} /></button>
          </div>
          {v.family.axes.map((a, i) => (
            <div key={a.id} role="group" aria-label={a.label}>
              <span className="text-[11.5px] uppercase tracking-[.16em] text-muted">{a.label} · <b className="font-medium normal-case tracking-normal text-ink">{v.opts[i]!.label}</b></span>
              <div className={`mt-2 flex flex-wrap ${a.options.length > 20 ? "gap-1" : "gap-1.5"}`}>
                {a.options.map((o) => {
                  const on = v.opts[i]!.id === o.id, swatch = o.hex && (a.id === "teinte" || a.id === "couleur" || a.id === "fond" || a.id === "metal");
                  return swatch
                    ? <button key={o.id} type="button" title={o.label} aria-label={o.label} aria-pressed={on} onClick={() => onChange(withOption(refId, a.id, o.id))}
                      className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-[var(--bg)] transition ${on ? "ring-2 ring-[var(--accent)]" : "ring-1 ring-black/10 hover:scale-110"}`} style={{ background: o.hex }} />
                    : <button key={o.id} type="button" aria-pressed={on} onClick={() => onChange(withOption(refId, a.id, o.id))} className={`chip text-[13px] ${on ? "chip-on" : ""}`}>{o.label}</button>;
                })}
                {isColorAxis(a) && (
                  <label className={`relative grid h-7 w-7 cursor-pointer place-items-center rounded-full ring-offset-2 ring-offset-[var(--bg)] ${v.opts[i]!.id.startsWith("x-") ? "ring-2 ring-[var(--accent)]" : "ring-1 ring-black/10"}`} style={{ background: "conic-gradient(#e66 0 16%,#ec6 0 33%,#6c6 0 50%,#6ce 0 66%,#66e 0 83%,#e6e 0)" }} title="Teinte sur mesure">
                    <span className="sr-only">Teinte sur mesure ({a.label.toLowerCase()})</span>
                    <input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={v.opts[i]!.hex ?? "#cccccc"} onChange={(e) => onChange(withOption(refId, a.id, customId(e.target.value)))} />
                  </label>
                )}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" className="btn btn-primary" onClick={() => onAdd(refId)}>Ajouter à ma planche</button>
            <Link className="btn" href="/planche/">Voir ma planche</Link>
          </div>
          {mat && <p className="text-[13.5px] text-muted">Prix indicatif : <b className="font-medium text-ink">{mat.priceRange}</b>. Entretien : {mat.care}</p>}
          {shop.q && <div className="border-t border-line pt-5"><ShopLinks query={shop.q} kinds={shop.kinds} max={4} /></div>}
          <Maisons family={v.family.id} compact />
          <p className="text-[11.5px] text-muted">Rendu généré à partir de textures photographiées (Poly Haven, CC0) et de relevés de teintes : les couleurs réelles varient selon les lots et l'éclairage. Demandez un échantillon avant de commander.</p>
        </div>
      </div>
    </div>
  );
}
