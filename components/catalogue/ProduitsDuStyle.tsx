import Link from "next/link";
import data from "@/data/catalogue.json";
import matieres4k from "@/content/data/matieres-4k.json";
import { Carte } from "@/components/catalogue/CatalogueAchetable";
import { GAMMES, NOM_GAMME, NOM_STYLE, type ProduitAchetable, type Style } from "@/lib/catalogue-achetable";

/** Style des pages éditoriales → style du catalogue (seulement quand la correspondance est claire). */
const CORRESPONDANCE: Record<string, Style> = {
  japandi: "japandi", scandinave: "scandinave", industriel: "industriel", boheme: "boheme", "mid-century": "mid-century",
  minimaliste: "contemporain", "art-deco": "haussmannien", riad: "boheme", mediterraneen: "wabi-sabi",
};

/** Les pièces d'un style, en vente, par budget : 3 produits par gamme, avec le lien vers tout le style dans le catalogue. */
export function ProduitsDuStyle({ styleId }: { styleId: string }) {
  const style = CORRESPONDANCE[styleId];
  if (!style) return null;
  const produits = (data as { produits: ProduitAchetable[] }).produits.filter((p) => p.styles.includes(style));
  if (!produits.length) return null;
  const textures = new Set(Object.keys(matieres4k as Record<string, unknown>));
  return (
    <section aria-labelledby="h-achat-style" className="mt-24 border-t border-line pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">À acheter</p>
          <h2 id="h-achat-style" className="mt-3 text-[clamp(32px,4vw,56px)]">Le style {NOM_STYLE[style].toLowerCase()}, <em>à chaque budget.</em></h2>
        </div>
        <Link href={`/catalogue/?style=${style}`} className="btn">Tout le style dans le catalogue</Link>
      </div>
      <div className="mt-10 grid gap-12 lg:grid-cols-3">
        {GAMMES.map((g) => {
          const l = produits.filter((p) => p.gamme === g).slice(0, 3);
          if (!l.length) return null;
          return (
            <div key={g}>
              <h3 className="border-b border-line pb-2 text-[13px] font-semibold uppercase tracking-[.16em] text-muted">{NOM_GAMME[g]}</h3>
              <ul className="mt-6 grid list-none grid-cols-2 gap-x-4 gap-y-10 p-0 lg:grid-cols-1">{l.map((p) => <Carte key={p.id} p={p} textures={textures} />)}</ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
