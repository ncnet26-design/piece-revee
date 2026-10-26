const M = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const FULL = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Calendrier sur 12 mois (floraison, plantation, taille). Lisible aussi par les lecteurs d'écran. */
export function YearRow({ label, months, tone }: { label: string; months: number[]; tone: "bloom" | "plant" | "prune" }) {
  const bg = tone === "bloom" ? "color-mix(in srgb, #B16BA8 70%, transparent)" : tone === "plant" ? "var(--accent)" : "color-mix(in srgb, var(--good) 70%, transparent)";
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2 text-[13px]">
      <span>{label}</span>
      <div className="grid grid-cols-12 gap-[3px]" role="img" aria-label={`${label} : ${months.length ? months.map((m) => FULL[m - 1]).join(", ") : "aucun mois"}`}>
        {M.map((m, i) => <div key={i} className="rounded py-1 text-center text-[10.5px]" style={months.includes(i + 1) ? { background: bg, color: "#fff", fontWeight: 600 } : { background: "var(--soft)", color: "var(--muted)" }}>{m}</div>)}
      </div>
    </div>
  );
}
