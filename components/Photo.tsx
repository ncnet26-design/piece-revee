import type { FreePhoto } from "@/content/gallery";

/** Photo libre de droits avec son crédit (auteur, source, licence), obligatoire pour les licences CC BY. */
export function Photo({ photo, className = "", priority = false, credit = "overlay", inLink = false }: { photo: FreePhoto; className?: string; priority?: boolean; credit?: "overlay" | "below" | "none"; /** Dans un lien : le crédit reste affiché, sans lien imbriqué. */ inLink?: boolean }) {
  const c = (
    <span className={credit === "overlay" ? "pointer-events-auto absolute bottom-2 right-2 max-w-[80%] truncate rounded-full bg-black/45 px-2.5 py-0.5 text-[10.5px] text-white/90 backdrop-blur-sm" : "mt-1 block text-[11px] text-muted"}>
      Photo {inLink ? photo.author : <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-inherit underline-offset-2">{photo.author}</a>} · {photo.license}
    </span>
  );
  return (
    <figure className={`relative m-0 overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : "auto"}
        referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      {credit !== "none" && (credit === "overlay" ? c : <figcaption>{c}</figcaption>)}
    </figure>
  );
}
