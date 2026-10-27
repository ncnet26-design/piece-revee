import { checkQuota, type Entitlement, type QuotaDecision, type UsageSnapshot } from "./core/quotas.ts";
import type { UsageKind } from "./core/plans.ts";
import { admin, HttpError } from "./http.ts";

export interface Access { entitlement: Entitlement & { firstStudyDone: boolean }; decision: QuotaDecision; payer: "paid" | "free" }

/** Décide côté serveur si l'action est permise (le client n'affiche que le résultat). */
export async function access(userId: string, kind: UsageKind): Promise<Access> {
  const db = admin();
  const { data: ent, error: e1 } = await db.rpc("entitlement_of", { p_user: userId });
  if (e1) throw e1;
  const entitlement = ent as Access["entitlement"];
  const { data: use, error: e2 } = await db.rpc("usage_snapshot", { p_user: userId, p_since: entitlement.periodStart });
  if (e2) throw e2;
  const decision = checkQuota(entitlement, use as UsageSnapshot, kind);
  return { entitlement, decision, payer: entitlement.plan === "decouverte" ? "free" : "paid" };
}

export async function requireAccess(userId: string, kind: UsageKind): Promise<Access> {
  const a = await access(userId, kind);
  if (!a.decision.allowed) throw new HttpError(402, a.decision.reason, a.decision.message);
  return a;
}

/** Réserve le coût estimé dans l'enveloppe IA avant l'appel. Enveloppe vide = fonction suspendue, jamais de dépense non couverte. */
export async function reserve(costCents: number, payer: "paid" | "free", ref: string) {
  const { data, error } = await admin().rpc("envelope_debit", { p_cost: costCents, p_payer: payer, p_ref: ref });
  if (error) throw error;
  if (!data) throw new HttpError(503, "envelope_empty", payer === "free"
    ? "L'offre gratuite a atteint son budget du moment. Elle revient dès que possible ; le Pass Projet reste disponible."
    : "Le service est momentanément indisponible. Réessayez un peu plus tard : rien ne vous a été décompté.");
}

export async function recordUsage(userId: string, kind: UsageKind, costCents: number, payer: "paid" | "free", source: "plan" | "credits") {
  const db = admin();
  await db.from("usage_events").insert({ user_id: userId, kind, cost_cents: costCents, payer });
  if (source === "credits") await db.from("credit_ledger").insert({ user_id: userId, delta: -1, reason: "rendu" });
}
