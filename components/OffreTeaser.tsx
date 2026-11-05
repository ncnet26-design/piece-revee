import Link from "next/link";
import { PLANS } from "@core/plans.ts";
import { formatEuros } from "@core/money.ts";

const plan = (id: string) => PLANS.find((p) => p.id === id)!;

/** Les offres en un coup d'œil, avec les vraies conditions (prix TTC, durée, essai) : sur l'accueil et après une transformation. */
export function OffreTeaser({ titre = "Essayez gratuitement. Payez seulement si vous continuez.", compact = false }: { titre?: string; compact?: boolean }) {
  const d = plan("decouverte"), pass = plan("pass"), plus = plan("plus_mensuel");
  const cartes: Array<[typeof d, string, string]> = [
    [d, "0 €", "pour essayer"],
    [pass, formatEuros(pass.priceTtc), `une fois · ${pass.accessDays} jours`],
    [plus, formatEuros(plus.priceTtc), `par mois · ${plus.trialDays} jours d'essai`],
  ];
  return (
    <section aria-labelledby="h-offres" className={compact ? "mt-10 rounded-[2px] bg-surface p-6 sm:p-8" : "border-t border-line py-20 sm:py-24"}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Tarifs</p>
          <h2 id="h-offres" className={`mt-4 max-w-[22ch] ${compact ? "text-[clamp(28px,3vw,40px)]" : "text-[clamp(36px,4.4vw,60px)]"}`}>{titre}</h2>
        </div>
        <Link href="/tarifs/" className="btn">Comparer les offres</Link>
      </div>
      <ul className="mt-10 grid list-none gap-px bg-line p-0 md:grid-cols-3">
        {cartes.map(([p, prix, unite]) => (
          <li key={p.id} className={`flex flex-col bg-bg p-6 ${p.highlight ? "ring-1 ring-inset ring-ink" : ""}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-[26px] font-normal">{p.name}</h3>
              {p.highlight && <span className="rounded-full bg-ink px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[.12em] text-white">Recommandé</span>}
            </div>
            <p className="mt-1 text-[13px] text-muted">{p.tagline}</p>
            <p className="mt-5"><span className="font-display text-[44px] leading-none">{prix}</span> <span className="text-[13px] text-muted">{unite}</span></p>
            <ul className="mt-5 grid list-none gap-2 p-0 text-[14px]">
              {p.features.slice(0, 3).map((f) => <li key={f} className="flex gap-2"><span aria-hidden className="text-[var(--bronze)]">✓</span>{f}</li>)}
            </ul>
            <Link href={p.id === "decouverte" ? "/transformer/" : "/tarifs/"} className={`btn mt-6 self-start ${p.highlight ? "btn-primary" : ""}`}>
              {p.id === "decouverte" ? "Commencer gratuitement" : p.trialDays ? `Essayer ${p.trialDays} jours` : `Choisir ${p.name}`}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-muted">
        <span>✓ Sans carte bancaire pour essayer</span><span>✓ Pass sans abonnement</span><span>✓ Abonnement résiliable en un clic</span><span>✓ Paiement sécurisé Stripe</span>
      </p>
    </section>
  );
}
