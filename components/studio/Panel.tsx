"use client";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fiche contextuelle : panneau latéral sur grand écran, feuille glissée depuis le bas sur mobile.
 * La pièce reste visible ; Échap ferme ; le focus va au titre à l'ouverture.
 */
export function Panel({ open, title, kicker, onClose, children }: { open: boolean; title: string; kicker?: string; onClose: () => void; children: ReactNode }) {
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!open) return;
    head.current?.focus({ preventScroll: true });
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, title, onClose]);
  return (
    <aside aria-label={title} hidden={!open}
      className="studio-panel fixed inset-x-0 bottom-0 z-40 max-h-[72vh] overflow-y-auto rounded-t-[26px] border-t border-line bg-[#FBFAF8] px-5 pb-8 pt-3 shadow-[0_-24px_60px_-30px_rgba(0,0,0,.35)] lg:absolute lg:inset-y-3 lg:right-3 lg:left-auto lg:bottom-auto lg:max-h-none lg:w-[400px] lg:rounded-[22px] lg:border lg:pt-5">
      <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-line lg:hidden" />
      <div className="flex items-start justify-between gap-3">
        <div>
          {kicker && <p className="text-[10.5px] font-semibold uppercase tracking-[.16em] text-muted">{kicker}</p>}
          <h2 ref={head} tabIndex={-1} className="text-[19px] font-semibold leading-tight tracking-tight outline-none">{title}</h2>
        </div>
        <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-white text-[18px] leading-none transition hover:border-ink/40" aria-label="Fermer la fiche">×</button>
      </div>
      {children}
    </aside>
  );
}
