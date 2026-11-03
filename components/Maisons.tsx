import { maisonUrl, maisonsFor } from "@/content/maisons";

/** Maisons de niche de référence pour une famille de matières (liens vers leur site ou une recherche). */
export function Maisons({ family, compact = false }: { family: string; compact?: boolean }) {
  const list = maisonsFor(family);
  if (!list.length) return null;
  return (
    <div>
      <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[.14em] text-muted">Maisons de référence</p>
      <ul className={`m-0 mt-2 grid list-none gap-2 p-0 ${compact ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {list.map((m) => (
          <li key={m.id} className="rounded-[2px] border border-line bg-surface p-3">
            <a href={maisonUrl(m)} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-ink no-underline hover:underline">{m.name}<span className="sr-only"> ({m.site ? "site officiel" : "recherche"}, nouvel onglet)</span></a>
            <span className="text-[12px] text-muted"> · {m.country}</span>
            <p className="m-0 mt-1 text-[12.5px] leading-snug text-muted">{m.text}</p>
          </li>
        ))}
      </ul>
      <p className="m-0 mt-2 text-[11px] text-muted">Citées à titre de référence, sans partenariat : modèles, disponibilités et prix sont à voir directement chez elles.</p>
    </div>
  );
}
