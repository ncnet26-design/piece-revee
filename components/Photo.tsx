import variantes from "@/lib/photos-variantes.json";

const V = variantes as Record<string, { w: number[]; ratio: number }>;

/** Adresse de base d'une photo (sans taille ni extension) : « /editorial/ia/cuisine-640.webp » → « /editorial/ia/cuisine ». */
export const photoBase = (src: string) => src.replace(/(-\d{3,4})?\.webp$/, "");

/** Liste srcset des tailles disponibles pour une photo (vide si la photo n'a pas de variantes). */
export function photoSrcSet(src: string): string | undefined {
  const base = photoBase(src), v = V[base];
  if (!v) return undefined;
  const max = Math.max(...v.w.filter((w) => w !== 2400));
  return v.w.map((w) => `${base}${w === max ? "" : `-${w}`}.webp ${w}w`).join(", ");
}

/**
 * Photo du site : choisit la taille utile selon l'écran (srcset), réserve sa place (pas de saut de mise en page)
 * et ne charge en priorité que l'image principale de la page.
 */
export function Photo({ src, alt, sizes = "100vw", priority = false, className = "" }: {
  src: string; alt: string; sizes?: string; priority?: boolean; className?: string;
}) {
  const base = photoBase(src), v = V[base];
  const fallback = v ? `${base}${v.w.includes(1024) ? "-1024" : ""}.webp` : src;
  const ratio = v?.ratio ?? 4 / 3;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={fallback} srcSet={photoSrcSet(src)} sizes={sizes} alt={alt}
      width={1600} height={Math.round(1600 / ratio)}
      loading={priority ? "eager" : "lazy"} decoding={priority ? "sync" : "async"} fetchPriority={priority ? "high" : "auto"}
      className={className} />
  );
}
