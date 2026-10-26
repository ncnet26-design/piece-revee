"use client";
import type { PlanId } from "@core/plans.ts";
import { DEMO_MODE } from "./site";
import { callFunction, supabase } from "./supabase";

/** Lance un paiement Stripe Checkout (page hébergée par Stripe : aucune donnée bancaire ne transite par le site). */
export async function startCheckout(plan: PlanId): Promise<{ ok: true } | { ok: false; message: string }> {
  if (DEMO_MODE) return { ok: false, message: "Le paiement n'est pas encore activé sur ce site de démonstration. Il le sera dès l'ouverture du compte Stripe." };
  const sb = supabase();
  const session = (await sb?.auth.getSession())?.data.session;
  if (!session) { window.location.assign(new URL(`/connexion/?next=${encodeURIComponent(`/tarifs/?plan=${plan}`)}`, window.location.origin)); return { ok: true }; }
  try {
    const { url } = await callFunction<{ url: string }>("checkout", { plan, returnUrl: window.location.origin });
    window.location.href = url;
    return { ok: true };
  } catch {
    return { ok: false, message: "Le paiement n'a pas pu démarrer. Réessayez dans un instant ; si le problème continue, écrivez-nous." };
  }
}

/** Ouvre le portail client Stripe : factures, moyen de paiement, résiliation. */
export async function openBillingPortal(): Promise<{ ok: true } | { ok: false; message: string }> {
  if (DEMO_MODE) return { ok: false, message: "Disponible dès l'activation des paiements." };
  try { const { url } = await callFunction<{ url: string }>("billing-portal", { returnUrl: window.location.href }); window.location.href = url; return { ok: true }; }
  catch { return { ok: false, message: "Le portail de facturation n'a pas pu s'ouvrir. Réessayez dans un instant." }; }
}
