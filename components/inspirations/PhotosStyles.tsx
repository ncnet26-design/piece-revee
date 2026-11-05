import Link from "next/link";
import { NOM_STYLE, STYLES } from "@/lib/catalogue-achetable";
import { PHOTOS_STYLES, SIGNATURE } from "@/lib/inspirations-photos";
import { PhotoUnsplash } from "./PhotoUnsplash";

/**
 * Les huit styles en vraies photos d'intérieur (6 par style, choisies une à une pour leurs marqueurs),
 * chacun relié à ses pièces en vente, par budget.
 */
export function PhotosStyles() {
  const styles = STYLES.filter((s) => PHOTOS_STYLES[s]?.length);
  return (
    <div>
      <nav aria-label="Aller au style" className="flex flex-wrap gap-1.5">
        {styles.map((s) => <a key={s} href={`#style-${s}`} className="chip no-underline">{NOM_STYLE[s]}</a>)}
      </nav>
      {styles.map((s, i) => {
        const [une, ...autres] = PHOTOS_STYLES[s];
        return (
          <section key={s} id={`style-${s}`} aria-labelledby={`h-style-${s}`} className="scroll-mt-24 border-t border-line pt-10 mt-16 first-of-type:mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{String(i + 1).padStart(2, "0")} · Style</p>
                <h2 id={`h-style-${s}`} className="mt-3 text-[clamp(40px,5vw,72px)]">{NOM_STYLE[s]}</h2>
                <p className="mt-3 max-w-[60ch] text-[16px] text-muted">{SIGNATURE[s]}</p>
              </div>
              <Link href={`/boutique/?style=${s}#selection`} className="btn btn-primary">Les pièces de ce style, par budget</Link>
            </div>
            <div className="mt-8 grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:row-span-2">
                <PhotoUnsplash p={une!} alt={`Intérieur ${NOM_STYLE[s].toLowerCase()} : ${une!.alt}`} sizes="(min-width:1024px) 66vw, 100vw" className="aspect-[3/2] lg:aspect-auto lg:h-[calc(100%-1.75rem)]" eager={i === 0} />
              </div>
              {autres.map((p) => (
                <PhotoUnsplash key={p.ref} p={p} alt={`Intérieur ${NOM_STYLE[s].toLowerCase()} : ${p.alt}`} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="aspect-[3/2]" />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
