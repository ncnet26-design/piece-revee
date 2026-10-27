import Stripe from "stripe";
import { z } from "zod";
import { getPlan } from "../_shared/core/plans.ts";
import { env } from "../_shared/env.ts";
import { admin, handler, HttpError, json, rateLimit, requireUser } from "../_shared/http.ts";

const Body = z.object({ plan: z.enum(["pass", "plus_mensuel", "plus_annuel", "credits", "pro", "agence"]), returnUrl: z.string().url() }).strict();
const PRICE_ENV = { pass: "STRIPE_PRICE_PASS", plus_mensuel: "STRIPE_PRICE_PLUS_MONTHLY", plus_annuel: "STRIPE_PRICE_PLUS_YEARLY", credits: "STRIPE_PRICE_CREDITS", pro: "STRIPE_PRICE_PRO", agence: "STRIPE_PRICE_AGENCY" } as const;

function stripe(): Stripe {
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(503, "billing_unavailable", "Le paiement n'est pas encore activé.");
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

/** Paiement par Stripe Checkout (page hébergée par Stripe). TVA via Stripe Tax ; consentement à l'exécution immédiate recueilli. */
Deno.serve(handler(async (req) => {
  const user = await requireUser(req);
  await rateLimit(`user:${user.id}:checkout`, 600, 10);
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) throw new HttpError(400, "invalid", "Offre inconnue.");
  const { plan, returnUrl } = body.data;
  if (new URL(returnUrl).origin !== new URL(env().SITE_URL).origin && !returnUrl.startsWith("http://localhost")) throw new HttpError(400, "invalid", "Adresse de retour non autorisée.");
  const price = Deno.env.get(PRICE_ENV[plan]);
  if (!price) throw new HttpError(503, "billing_unavailable", "Cette offre n'est pas encore disponible.");
  const s = stripe(); const db = admin();
  const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  let customer = profile?.stripe_customer_id as string | null;
  if (!customer) {
    const c = await s.customers.create({ email: user.email, metadata: { user_id: user.id } });
    customer = c.id;
    await db.from("profiles").update({ stripe_customer_id: customer }).eq("id", user.id);
  }
  const p = getPlan(plan);
  const oneTime = p.billing === "one_time";
  const session = await s.checkout.sessions.create({
    mode: oneTime ? "payment" : "subscription",
    customer, client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    metadata: { plan, user_id: user.id },
    ...(oneTime ? { payment_intent_data: { metadata: { plan, user_id: user.id } } } : { subscription_data: { metadata: { user_id: user.id, plan }, ...(p.trialDays ? { trial_period_days: p.trialDays } : {}) } }),
    automatic_tax: { enabled: true },
    customer_update: { address: "auto" },
    allow_promotion_codes: true,
    locale: "fr",
    consent_collection: { terms_of_service: "required" },
    custom_text: { terms_of_service_acceptance: { message: "J'accepte les [CGV](" + env().SITE_URL + "/legal/cgv/), je demande l'accès immédiat au service et je reconnais perdre mon droit de rétractation pour les contenus numériques déjà fournis." } },
    success_url: `${new URL(returnUrl).origin}/compte/?paiement=ok`,
    cancel_url: `${new URL(returnUrl).origin}/tarifs/?paiement=annule`,
  });
  if (!session.url) throw new HttpError(502, "billing_error", "Le paiement n'a pas pu démarrer.");
  return json(req, { url: session.url });
}));
