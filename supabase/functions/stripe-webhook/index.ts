import Stripe from "stripe";
import { creditFromSale } from "../_shared/core/envelope.ts";
import { getPlan } from "../_shared/core/plans.ts";
import { toBillingAction, type MinimalEvent } from "../_shared/core/stripe-events.ts";
import { env } from "../_shared/env.ts";
import { admin, log } from "../_shared/http.ts";

/**
 * Webhook Stripe : signature vérifiée, idempotent (table stripe_events), traduit en actions par core/stripe-events.
 * Configurer dans Stripe : checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid, charge.refunded.
 */
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Méthode non autorisée", { status: 405 });
  const key = env().STRIPE_SECRET_KEY, secret = env().STRIPE_WEBHOOK_SECRET;
  if (!key || !secret) return new Response("Paiement non configuré", { status: 503 });
  const s = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
  const raw = await req.text();
  let event: Stripe.Event;
  try { event = await s.webhooks.constructEventAsync(raw, req.headers.get("stripe-signature") ?? "", secret, undefined, Stripe.createSubtleCryptoProvider()); }
  catch { return new Response("Signature invalide", { status: 400 }); }

  const db = admin();
  const { error: dup } = await db.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dup) return new Response("Déjà traité", { status: 200 }); // idempotence

  try {
    const action = toBillingAction(event as unknown as MinimalEvent, Deno.env.toObject());
    switch (action.kind) {
      case "grant_one_time": {
        const p = getPlan(action.plan);
        const until = new Date(Date.now() + (p.accessDays ?? 30) * 86_400_000).toISOString();
        await db.from("purchases").insert({ user_id: action.userId, plan: action.plan, amount_ttc_cents: action.amountTtc, stripe_event_id: event.id, access_until: until });
        if (action.plan === "credits") await db.from("credit_ledger").insert({ user_id: action.userId, delta: p.quotas.render ?? 15, reason: "achat", ref: event.id });
        await creditEnvelope(action.plan, action.amountTtc, event.id);
        break;
      }
      case "upsert_subscription": {
        await db.from("subscriptions").upsert({ user_id: action.userId, plan: action.plan, status: action.status, stripe_subscription_id: action.stripeSubscriptionId, stripe_customer_id: action.stripeCustomerId, current_period_end: action.periodEnd, updated_at: new Date().toISOString() }, { onConflict: "stripe_subscription_id" });
        break;
      }
      case "end_subscription":
        await db.from("subscriptions").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", action.stripeSubscriptionId);
        break;
      case "refund": {
        const pi = await s.paymentIntents.retrieve(action.paymentIntentId);
        const userId = pi.metadata.user_id;
        if (userId) await db.from("purchases").update({ refunded: true }).eq("user_id", userId).gte("created_at", new Date(pi.created * 1000 - 86_400_000).toISOString());
        break;
      }
      case "ignore":
        if (event.type === "invoice.paid") {
          const inv = event.data.object as Stripe.Invoice;
          const sub = inv.parent?.subscription_details?.metadata ?? {};
          const plan = (sub.plan ?? "plus_mensuel") as Parameters<typeof getPlan>[0];
          if (inv.amount_paid > 0) await creditEnvelope(plan, inv.amount_paid, event.id);
        }
        break;
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    log("error", "webhook_failed", { type: event.type, message: e instanceof Error ? e.message : String(e) });
    await db.from("stripe_events").delete().eq("id", event.id); // Stripe réessaiera
    return new Response("Erreur", { status: 500 });
  }
});

/** Chaque encaissement alimente l'enveloppe IA (coût prévu de l'offre + part du gratuit). */
async function creditEnvelope(plan: Parameters<typeof getPlan>[0], amountTtc: number, ref: string) {
  const delta = creditFromSale({ paidBalance: 0, freeBalance: 0 }, plan, amountTtc);
  await admin().rpc("envelope_credit", { p_paid: delta.paidBalance, p_free: delta.freeBalance, p_reason: "vente", p_ref: ref });
}
