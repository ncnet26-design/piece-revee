import Stripe from "stripe";
import { z } from "zod";
import { env } from "../_shared/env.ts";
import { admin, handler, HttpError, json, requireUser } from "../_shared/http.ts";

const Body = z.object({ returnUrl: z.string().url() }).strict();

/** Portail client Stripe : factures, moyen de paiement, changement d'offre, résiliation en un clic. */
Deno.serve(handler(async (req) => {
  const user = await requireUser(req);
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) throw new HttpError(400, "invalid", "Requête invalide.");
  const key = env().STRIPE_SECRET_KEY; if (!key) throw new HttpError(503, "billing_unavailable", "Le paiement n'est pas encore activé.");
  const { data: profile } = await admin().from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  if (!profile?.stripe_customer_id) throw new HttpError(404, "no_customer", "Aucun achat pour l'instant : rien à gérer.");
  const s = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
  const returnUrl = new URL(body.data.returnUrl).origin === new URL(env().SITE_URL).origin ? body.data.returnUrl : `${env().SITE_URL}/compte/`;
  const portal = await s.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: returnUrl, locale: "fr" });
  return json(req, { url: portal.url });
}));
