import type { PlanId } from "./plans.ts";

/** Correspondance identifiants de prix Stripe → offres. Les identifiants viennent des variables d'environnement. */
export function planFromPriceId(priceId: string, env: Record<string, string | undefined>): PlanId | null {
  const map: Record<string, PlanId> = {};
  const pairs: [string, PlanId][] = [
    ["STRIPE_PRICE_PASS", "pass"], ["STRIPE_PRICE_PLUS_MONTHLY", "plus_mensuel"], ["STRIPE_PRICE_PLUS_YEARLY", "plus_annuel"],
    ["STRIPE_PRICE_CREDITS", "credits"], ["STRIPE_PRICE_PRO", "pro"], ["STRIPE_PRICE_AGENCY", "agence"],
  ];
  for (const [k, plan] of pairs) { const v = env[k]; if (v) map[v] = plan; }
  return map[priceId] ?? null;
}

export type BillingAction =
  | { kind: "grant_one_time"; userId: string; plan: PlanId; amountTtc: number }
  | { kind: "upsert_subscription"; userId: string; plan: PlanId; status: string; periodEnd: string; stripeSubscriptionId: string; stripeCustomerId: string }
  | { kind: "end_subscription"; stripeSubscriptionId: string }
  | { kind: "refund"; paymentIntentId: string; amount: number }
  | { kind: "ignore"; reason: string };

/** Événement Stripe réduit aux champs utiles (validés en amont). */
export interface MinimalEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

/** Traduit un événement Stripe en action métier. Pur et testable ; l'idempotence est assurée par la table stripe_events. */
export function toBillingAction(ev: MinimalEvent, env: Record<string, string | undefined>): BillingAction {
  const o = ev.data.object;
  switch (ev.type) {
    case "checkout.session.completed": {
      const userId = str(o.client_reference_id);
      const meta = (o.metadata ?? {}) as Record<string, unknown>;
      const plan = str(meta.plan) as PlanId | null;
      if (!userId || !plan) return { kind: "ignore", reason: "Session sans utilisateur ou sans offre" };
      if (str(o.mode) === "payment") return { kind: "grant_one_time", userId, plan, amountTtc: num(o.amount_total) ?? 0 };
      return { kind: "ignore", reason: "Abonnement : traité par customer.subscription.*" };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const meta = (o.metadata ?? {}) as Record<string, unknown>;
      const userId = str(meta.user_id);
      const items = (o.items as { data?: { price?: { id?: string } }[] } | undefined)?.data ?? [];
      const priceId = items[0]?.price?.id ?? "";
      const plan = planFromPriceId(priceId, env);
      const periodEndSec = num(o.current_period_end) ?? num((items[0] as Record<string, unknown> | undefined)?.current_period_end);
      if (!userId || !plan || !periodEndSec) return { kind: "ignore", reason: "Abonnement incomplet" };
      return {
        kind: "upsert_subscription", userId, plan, status: str(o.status) ?? "incomplete",
        periodEnd: new Date(periodEndSec * 1000).toISOString(), stripeSubscriptionId: str(o.id) ?? "", stripeCustomerId: str(o.customer) ?? "",
      };
    }
    case "customer.subscription.deleted":
      return { kind: "end_subscription", stripeSubscriptionId: str(o.id) ?? "" };
    case "charge.refunded":
      return { kind: "refund", paymentIntentId: str(o.payment_intent) ?? "", amount: num(o.amount_refunded) ?? 0 };
    default:
      return { kind: "ignore", reason: `Événement non utilisé : ${ev.type}` };
  }
}
