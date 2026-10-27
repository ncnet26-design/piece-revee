import { shopLinks, type RetailerKind } from "@/lib/retailers";

/**
 * « Où l'acheter » : liens vers la recherche des enseignes (IKEA, Leroy Merlin, Castorama…).
 * Les produits, prix et disponibilités sont ceux de l'enseigne, consultés chez elle : rien n'est inventé ici.
 */
export function ShopLinks({ query, kinds, max = 5, title = "Où l'acheter", compact = false }: { query: string; kinds?: RetailerKind[]; max?: number; title?: string; compact?: boolean }) {
  const links = shopLinks(query, kinds, max);
  return (
    <div>
      {title && <h3 className={compact ? "text-[13.5px] font-semibold font-ui" : "font-ui text-[15px] font-semibold"}>{title}</h3>}
      <p className="mt-0.5 text-[12px] text-muted">« {query} » chez :</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {links.map((l) => (
          <a key={l.retailer} className="btn btn-sm" href={l.url} target="_blank" rel="noopener noreferrer nofollow" title={l.exact ? `Résultats « ${query} » sur ${l.retailer}` : `Site de ${l.retailer}`}>
            {l.retailer}{!l.exact && <span className="font-normal text-muted"> · site</span>} <span aria-hidden="true">↗</span><span className="sr-only"> (nouvel onglet{l.exact ? ", résultats de recherche" : ", page d'accueil"})</span>
          </a>
        ))}
      </div>
      <p className="mt-1.5 text-[11.5px] text-muted">Prix et disponibilité sur le site de chaque enseigne.</p>
    </div>
  );
}
