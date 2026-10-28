"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { registerCamille } from "@/lib/camille-bus";
import type { CamilleRequest } from "./CamilleDrawer";
import { usePathname } from "next/navigation";
import { guideFor } from "@/lib/camille-guide";
import { CamilleAvatar } from "./CamilleAvatar";
import { IconClose } from "./icons";

/** Le tiroir de Camille (et la bibliothèque qu'il utilise) n'est chargé qu'à la première ouverture. */
const CamilleDrawer = dynamic(() => import("./CamilleDrawer"), { ssr: false });

export function Camille() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [request, setRequest] = useState<CamilleRequest | null>(null);
  useEffect(() => registerCamille((question, context) => {
    setLoaded(true); setOpen(true);
    setRequest({ id: Date.now(), question, context });
  }), []);
  // Bulle d'accueil : Camille se présente une fois par étape du site (refusable, mémorisée).
  const path = usePathname() ?? "/";
  const guide = guideFor(path);
  const [bubble, setBubble] = useState<string | null>(null);
  useEffect(() => {
    if (!guide) return;
    let seen: string[] = [];
    try { if (localStorage.getItem("pr_camille_guide") === "off") return; seen = JSON.parse(localStorage.getItem("pr_camille_vu") ?? "[]") as string[]; } catch { return; }
    if (seen.includes(guide.key)) return;
    const t = setTimeout(() => setBubble(guide.key), 1800);
    return () => clearTimeout(t);
  }, [guide]);
  const dismiss = (key: string) => {
    try { const seen = JSON.parse(localStorage.getItem("pr_camille_vu") ?? "[]") as string[]; localStorage.setItem("pr_camille_vu", JSON.stringify([...new Set([...seen, key])])); } catch { /* stockage indisponible */ }
  };
  const openGuide = () => { if (!guide) return; dismiss(guide.key); setLoaded(true); setOpen(true); setRequest({ id: Date.now(), context: { step: guide.key } }); };
  return (
    <>
      <button type="button" className="btn fixed z-26 hidden bg-surface/95 shadow-[0_8px_24px_-12px_rgba(27,26,23,.35)] backdrop-blur lg:inline-flex" style={{ right: "max(20px, calc(env(safe-area-inset-right, 0px) + 20px))", bottom: "calc(24px + env(safe-area-inset-bottom, 0px))", padding: "9px 16px 9px 10px" }}
        onClick={() => { setLoaded(true); setOpen(true); setRequest({ id: Date.now(), context: guide ? { step: guide.key } : {} }); if (guide) dismiss(guide.key); }} onMouseEnter={() => setLoaded(true)} onFocus={() => setLoaded(true)}>
        <CamilleAvatar size={26} className="-my-1" /> Demander à Camille
      </button>
      {bubble && guide && bubble === guide.key && !open && (
        <section aria-label="Conseil de Camille" className="camille-bubble fixed z-26 w-[min(360px,calc(100vw-24px))] rounded-[22px] border border-line bg-surface p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,.35)]"
          style={{ right: "max(12px, calc(env(safe-area-inset-right, 0px) + 20px))", bottom: "calc(var(--tabbar, 0px) + 92px + env(safe-area-inset-bottom, 0px))" }}>
          <div className="flex items-start gap-3">
            <CamilleAvatar size={44} />
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[13px] font-semibold">Camille <span className="font-normal text-muted">· designer d'intérieur virtuelle</span></p>
              <p className="m-0 mt-1 text-[14px] leading-snug">{guide.tip}</p>
            </div>
            <button type="button" className="btn btn-sm btn-ghost -mr-1 -mt-1 h-8 w-8 flex-none p-0" aria-label="Fermer le conseil de Camille" onClick={() => dismiss(guide.key)}><IconClose width={14} height={14} /></button>
          </div>
          <div className="mt-3 flex gap-2 pl-[56px]">
            <button type="button" className="btn btn-sm btn-primary" onClick={openGuide}>Me guider</button>
            <button type="button" className="btn btn-sm" onClick={() => dismiss(guide.key)}>Plus tard</button>
          </div>
        </section>
      )}
      {loaded && <CamilleDrawer open={open} onClose={() => setOpen(false)} request={request} />}
    </>
  );
}
