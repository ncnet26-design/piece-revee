"use client";
import { useState } from "react";
import { IA_URL } from "@/lib/ia";
import { visitorId } from "@/lib/ia-jobs";
import { lensUrl } from "@/lib/parcours";

/**
 * Recherche de l'article identique : le meuble exact, découpé sur l'image, est confié à Google Lens (recherche par image, gratuite),
 * qui trouve les articles qui lui ressemblent trait pour trait chez les vendeurs, sur Pinterest, etc.
 */
export function Identique({ photo, image, label }: { photo?: string; image: string; label: string }) {
  const [etat, setEtat] = useState<"pret" | "envoi" | "erreur">("pret");
  const chercher = async () => {
    // La fenêtre s'ouvre tout de suite (sinon le navigateur la bloque), puis reçoit l'adresse de Google Lens.
    const fen = window.open("about:blank", "_blank");
    if (!photo) { if (fen) fen.location.href = lensUrl(image); return; }
    setEtat("envoi");
    try {
      const r = await fetch(`${IA_URL}/v2/recadrage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: photo, visiteur: visitorId() }) });
      const j = await r.json().catch(() => ({})) as { url?: string };
      if (!r.ok || !j.url) throw new Error("recadrage");
      if (fen) fen.location.href = lensUrl(j.url); else window.location.href = lensUrl(j.url);
      setEtat("pret");
    } catch {
      // En secours : l'image entière (on sélectionne le meuble dans Google Lens).
      if (fen) fen.location.href = lensUrl(image);
      setEtat("erreur");
    }
  };
  return (
    <section aria-label="Trouver l'article identique" className="mt-3 flex gap-3 rounded-[2px] bg-[var(--soft)] p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo && <img src={photo} alt={`${label}, découpé sur l'image`} className="size-20 shrink-0 rounded-[2px] object-cover" />}
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold">L'identique, partout sur le web</p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted">Google Lens cherche ce meuble exact par son image : mêmes formes, mêmes matières, chez les vendeurs et sur Pinterest.</p>
        <button type="button" className="btn btn-primary mt-2 !min-h-9 !px-4 !py-1.5 text-[13px]" disabled={etat === "envoi"} onClick={() => void chercher()}>
          {etat === "envoi" ? "Préparation…" : "Trouver l'identique"}<span className="sr-only"> (Google Lens, nouvel onglet)</span>
        </button>
        {etat === "erreur" && <p className="mt-1.5 text-[11.5px] text-muted">Image entière ouverte dans Google Lens : sélectionnez le meuble pour lancer la recherche.</p>}
      </div>
    </section>
  );
}
