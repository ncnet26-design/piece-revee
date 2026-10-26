import { FREE_TIER_SHARE, getPlan, type PlanId } from "./plans.ts";
import { estimateStripeFees, htFromTtc, type Cents } from "./money.ts";

/**
 * Enveloppe IA : l'IA n'est jamais payée de votre poche.
 * Chaque vente crédite l'enveloppe ; chaque appel IA la débite ; vide = fonctions IA gratuites suspendues.
 */
export interface EnvelopeState {
  /** Solde réservé aux clients payants (centimes). */
  paidBalance: Cents;
  /** Solde qui finance l'offre gratuite (centimes). */
  freeBalance: Cents;
}

export function creditFromSale(state: EnvelopeState, plan: PlanId, amountTtc: Cents): EnvelopeState {
  const p = getPlan(plan);
  const net = htFromTtc(amountTtc) - estimateStripeFees(amountTtc);
  const forPaid = Math.min(p.expectedAiCost, Math.max(0, net));
  const forFree = Math.max(0, Math.round(htFromTtc(amountTtc) * FREE_TIER_SHARE));
  return { paidBalance: state.paidBalance + forPaid, freeBalance: state.freeBalance + forFree };
}

export type DebitResult = { ok: true; state: EnvelopeState } | { ok: false; reason: "free_envelope_empty" | "paid_envelope_empty" };

export function debit(state: EnvelopeState, cost: Cents, payer: "paid" | "free"): DebitResult {
  if (payer === "free") {
    if (state.freeBalance < cost) return { ok: false, reason: "free_envelope_empty" };
    return { ok: true, state: { ...state, freeBalance: state.freeBalance - cost } };
  }
  // Un client payant n'est jamais bloqué tant que l'enveloppe totale couvre le coût.
  const total = state.paidBalance + state.freeBalance;
  if (total < cost) return { ok: false, reason: "paid_envelope_empty" };
  const fromPaid = Math.min(state.paidBalance, cost);
  return { ok: true, state: { paidBalance: state.paidBalance - fromPaid, freeBalance: state.freeBalance - (cost - fromPaid) } };
}

/** Nombre de jours restants au rythme de consommation donné. */
export function daysLeft(state: EnvelopeState, dailySpend: Cents): number | null {
  if (dailySpend <= 0) return null;
  return Math.floor((state.paidBalance + state.freeBalance) / dailySpend);
}
