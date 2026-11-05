"use client";
import Link from "next/link";
import { useState } from "react";
import { PLANS, type PlanId } from "@core/plans.ts";
import { formatEuros } from "@core/money.ts";
import { startCheckout } from "@/lib/billing";

const UNIT: Record<string, string> = { free: "", one_time: "une fois", monthly: "/ mois", yearly: "/ an" };

export function Pricing({ ids }: { ids?: PlanId[] } = {}) {
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const buy = async (id: PlanId) => {
    setError(null); setBusy(id);
    const r = await startCheckout(id);
    if (!r.ok) setError(r.message);
    setBusy(null);
  };
  return (
    <>
      <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr))]">
        {PLANS.filter((p) => !ids || ids.includes(p.id)).map((p) => (
          <article key={p.id} className={`panel flex flex-col gap-3 ${p.highlight ? "border-2 border-accent" : ""}`}>
            {p.highlight && <span className="self-start rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-ink">Recommandé</span>}
            {p.id === "pass" && <span className="self-start rounded-full bg-soft px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted">Sans abonnement</span>}
            <h2 className="text-[22px]">{p.name}</h2>
            <p className="text-sm text-muted">{p.tagline}</p>
            <div className="font-display text-4xl tracking-tight">{p.priceTtc === 0 ? "0 €" : formatEuros(p.priceTtc)} <small className="font-body text-sm font-medium tracking-normal text-muted">{UNIT[p.billing]}{p.accessDays && p.billing === "one_time" ? ` · ${p.accessDays === 365 ? "12 mois" : `${p.accessDays} jours`}` : ""}</small></div>
            <ul className="dots text-sm">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            {p.soon && p.soon.length > 0 && <p className="mt-2 text-[12.5px] text-muted">Bientôt inclus, sans surcoût : {p.soon.map((f) => f.charAt(0).toLowerCase() + f.slice(1)).join(", ")}.</p>}
            {p.id === "decouverte"
              ? <Link className="btn mt-auto" href="/connexion/">Créer mon compte</Link>
              : <button type="button" className={`btn mt-auto ${p.highlight ? "btn-primary" : ""}`} disabled={busy !== null} onClick={() => void buy(p.id)}>{busy === p.id ? <><span className="spinner" /> Redirection…</> : p.trialDays ? `Essayer ${p.trialDays} jours` : "Choisir"}</button>}
          </article>
        ))}
      </div>
      {error && <p role="alert" className="notice notice-warn mt-4">{error}</p>}
    </>
  );
}
