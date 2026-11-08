"use client";
import { useEffect, useState } from "react";
import type { LignePiece } from "@/components/PrixPiece";

/** Bouton qui fabrique la vidéo avant/après (dans le navigateur, gratuit), puis la montre avec « Partager » et « Télécharger ». */
export function VideoAvantApres({ avant, apres, lignes }: { avant: string; apres: string; lignes: LignePiece[] }) {
  const [etat, setEtat] = useState<{ k: "rien" } | { k: "calcul"; p: number } | { k: "pret"; url: string; fichier: File } | { k: "erreur"; m: string }>({ k: "rien" });
  useEffect(() => () => { if (etat.k === "pret") URL.revokeObjectURL(etat.url); }, [etat]);

  const creer = async () => {
    setEtat({ k: "calcul", p: 0 });
    try {
      const { creerVideo } = await import("@/lib/video-avant-apres");
      const { blob, ext } = await creerVideo(avant, apres, lignes, (p) => setEtat({ k: "calcul", p }));
      const fichier = new File([blob], `ma-piece-avant-apres.${ext}`, { type: blob.type });
      setEtat({ k: "pret", url: URL.createObjectURL(blob), fichier });
    } catch (e) {
      setEtat({ k: "erreur", m: e instanceof Error && /prise en charge/.test(e.message) ? e.message : "La vidéo n'a pas pu être créée sur cet appareil. Essayez avec Chrome, Edge ou Safari à jour." });
    }
  };
  const partager = async (f: File) => {
    try { await navigator.share({ files: [f], title: "Ma pièce avant / après", text: "Ma pièce refaite avec Pièce Rêvée" }); } catch { /* partage annulé */ }
  };
  const peutPartager = (f: File) => typeof navigator !== "undefined" && "canShare" in navigator && navigator.canShare({ files: [f] });

  return (
    <div className="rounded-[2px] bg-surface p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted">Vidéo à partager</p>
      {etat.k === "rien" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[46ch] text-[14px]">Une vidéo verticale de 10 secondes : votre pièce avant, puis refaite, avec les meubles et leurs prix. Prête pour Instagram, TikTok ou WhatsApp.</p>
          <button type="button" className="btn btn-primary" onClick={() => void creer()}>Créer ma vidéo avant / après</button>
        </div>
      )}
      {etat.k === "calcul" && (
        <div className="mt-3" role="status" aria-live="polite">
          <p className="text-[14px]">Fabrication de la vidéo… {Math.round(etat.p * 100)} %</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full bg-ink transition-[width]" style={{ width: `${Math.round(etat.p * 100)}%` }} /></div>
        </div>
      )}
      {etat.k === "pret" && (
        <div className="mt-3 grid items-start gap-4 sm:grid-cols-[200px_1fr]">
          <video src={etat.url} controls autoPlay muted loop playsInline className="w-full rounded-[2px] bg-ink" aria-label="Aperçu de la vidéo avant / après" />
          <div className="flex flex-col items-start gap-2">
            <p className="text-[14px]">Votre vidéo est prête. Elle reste sur votre appareil : rien n'est publié sans vous.</p>
            {peutPartager(etat.fichier) && <button type="button" className="btn btn-primary" onClick={() => void partager(etat.fichier)}>Partager</button>}
            <a className="btn" href={etat.url} download={etat.fichier.name}>Télécharger la vidéo</a>
            <p className="text-[12px] text-muted">La vidéo indique que l'image « après » est créée par IA.</p>
          </div>
        </div>
      )}
      {etat.k === "erreur" && <p className="mt-3 text-[14px]" role="alert">{etat.m} <button type="button" className="underline" onClick={() => setEtat({ k: "rien" })}>Réessayer</button></p>}
    </div>
  );
}
