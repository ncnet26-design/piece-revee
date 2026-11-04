import { lienUnsplash, srcsetUnsplash, tailleUnsplash, type PhotoStyle } from "@/lib/inspirations-photos";

/** Une vraie photo, servie par Unsplash en AVIF ou WebP à la bonne largeur, avec le crédit du photographe. */
export function PhotoUnsplash({ p, alt, sizes, className = "", eager = false, credit = true }: { p: PhotoStyle; alt: string; sizes: string; className?: string; eager?: boolean; credit?: boolean }) {
  return (
    <figure className="m-0">
      <span className={`block overflow-hidden bg-soft ${className}`}>
        <picture>
          <source type="image/avif" srcSet={srcsetUnsplash(p.src, "avif")} sizes={sizes} />
          <img src={tailleUnsplash(p.src, 1280, "webp")} srcSet={srcsetUnsplash(p.src, "webp")} sizes={sizes} alt={alt} width={p.largeur} height={p.hauteur}
            loading={eager ? "eager" : "lazy"} decoding="async" className="size-full object-cover transition duration-700 group-hover:scale-[1.03]" />
        </picture>
      </span>
      {credit && (
        <figcaption className="mt-2 text-[11px] text-muted">
          Photo <a href={lienUnsplash(p.auteur_url)} target="_blank" rel="noopener noreferrer" className="underline">{p.auteur}</a> sur <a href={lienUnsplash(p.page)} target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a>
        </figcaption>
      )}
    </figure>
  );
}
