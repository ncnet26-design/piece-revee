import { DAILY_AI_SPEND_CAP, getPlan, type PlanId, type UsageKind } from "./plans.ts";
import type { Cents } from "./money.ts";

export interface Entitlement {
  plan: PlanId;
  /** Début de la période en cours (ISO). */
  periodStart: string;
  /** Fin d'accès (ISO) : fin d'abonnement, ou fin du Pass. */
  accessUntil: string | null;
}

export interface UsageSnapshot {
  /** Consommation par type sur la période. */
  period: Partial<Record<UsageKind, number>>;
  /** Messages envoyés aujourd'hui. */
  messagesToday: number;
  /** Dépense IA du jour en centimes. */
  spendToday: Cents;
  /** Rendus achetés en crédits, restants. */
  creditBalance: number;
}

export type QuotaDecision =
  | { allowed: true; source: "plan" | "credits"; remaining: number | null }
  | { allowed: false; reason: "quota" | "daily_cap" | "expired" | "not_included"; message: string };

const LABEL: Record<UsageKind, string> = {
  study: "études", render: "rendus", edit: "retouches", message: "messages", pdf: "exports PDF",
};

/** Décide si une action est permise. Toujours appelée côté serveur ; le client n'affiche que le résultat. */
export function checkQuota(ent: Entitlement, usage: UsageSnapshot, kind: UsageKind, now: Date = new Date()): QuotaDecision {
  if (ent.accessUntil && new Date(ent.accessUntil) < now && ent.plan !== "decouverte") {
    return { allowed: false, reason: "expired", message: "Votre accès est terminé. Renouvelez votre offre pour continuer." };
  }
  if (usage.spendToday >= DAILY_AI_SPEND_CAP && kind !== "pdf") {
    return { allowed: false, reason: "daily_cap", message: "Vous avez atteint la limite d'usage du jour. Elle se réinitialise demain." };
  }
  const plan = getPlan(ent.plan);
  if (kind === "message") {
    if (plan.messagesPerDay === null) return { allowed: true, source: "plan", remaining: null };
    const left = plan.messagesPerDay - usage.messagesToday;
    if (left > 0) return { allowed: true, source: "plan", remaining: left - 1 };
    return { allowed: false, reason: "quota", message: `Vous avez utilisé vos ${plan.messagesPerDay} messages du jour. Ils reviennent demain, ou passez au Pass Projet pour une conversation illimitée.` };
  }
  const limit = plan.quotas[kind];
  const used = usage.period[kind] ?? 0;
  if (limit === null) return { allowed: true, source: "plan", remaining: null };
  if (used < limit) return { allowed: true, source: "plan", remaining: limit - used - 1 };
  if (kind === "render" && usage.creditBalance > 0) {
    return { allowed: true, source: "credits", remaining: usage.creditBalance - 1 };
  }
  if (limit === 0) {
    return { allowed: false, reason: "not_included", message: `Les ${LABEL[kind]} ne sont pas inclus dans l'offre ${plan.name}.` };
  }
  return { allowed: false, reason: "quota", message: `Vous avez utilisé vos ${limit} ${LABEL[kind]} de la période.` };
}
