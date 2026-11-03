"use client";
import { useState } from "react";

/**
 * Photo d'un produit telle que publiée par l'enseigne : affichée depuis son site (jamais copiée ni stockée chez nous),
 * sans transmettre l'adresse de la page (no-referrer). Si l'image n'est pas disponible, un fond neutre avec l'initiale de l'enseigne.
 */
export function ProduitImage({ src, alt, merchant, className = "" }: { src?: string | null; alt: string; merchant: string; className?: string }) {
  const [ok, setOk] = useState(Boolean(src));
  return (
    <span className={`relative block aspect-square overflow-hidden bg-[#F6F4F0] ${className}`}>
      {ok && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setOk(false)}
          className="absolute inset-0 size-full object-contain p-3 mix-blend-multiply transition duration-500 group-hover:scale-[1.03]" />
      ) : (
        <span aria-hidden className="absolute inset-0 grid place-items-center font-display text-[44px] text-[#CFC7BA]">{merchant.charAt(0)}</span>
      )}
    </span>
  );
}
