import type { Cents } from "./money.ts";

export type PlanId = "decouverte" | "pass" | "plus_mensuel" | "plus_annuel" | "credits" | "pro" | "agence";
export type UsageKind = "study" | "render" | "edit" | "message" | "pdf";
export type Billing = "free" | "one_time" | "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  priceTtc: Cents;
  billing: Billing;
  /** Durée d'accès pour un achat unique, en jours. */
  accessDays?: number;
  tagline: string;
  features: string[];
  /** Fonctions annoncées mais pas encore livrées : affichées « bientôt », jamais vendues comme acquises. */
  soon?: string[];
  /** Quotas par période (mois glissant pour les abonnements, durée d'accès pour le Pass). `null` = illimité (usage raisonnable). */
  quotas: Record<UsageKind, number | null>;
  /** Limite de messages à Camille par jour. `null` = illimitée (usage raisonnable). */
  messagesPerDay: number | null;
  renderMaxPx: 1024 | 2048 | 4096;
  watermark: boolean;
  trialDays?: number;
  highlight?: boolean;
  /** Coût IA moyen attendu pour un usage type, en centimes (sert à créditer l'enveloppe IA). */
  expectedAiCost: Cents;
}

export const PLANS: readonly Plan[] = [
  {
    id: "decouverte", name: "Découverte", priceTtc: 0, billing: "free",
    tagline: "Pour essayer, sans carte bancaire",
    features: ["1 étude complète offerte", "3 rendus d'essai par mois", "Galerie, quiz et matériauthèque illimités", "Camille : 10 messages par jour"],
    quotas: { study: 1, render: 3, edit: 0, message: null, pdf: 0 },
    messagesPerDay: 10, renderMaxPx: 1024, watermark: true, expectedAiCost: 60,
  },
  {
    id: "pass", name: "Pass Projet", priceTtc: 1490, billing: "one_time", accessDays: 30,
    tagline: "Une pièce à faire ? Sans abonnement",
    features: ["3 études complètes", "30 rendus HD sans filigrane", "Export PDF de l'étude", "Camille illimitée et guide d'étapes"],
    soon: ["Retouche par zone"],
    quotas: { study: 3, render: 30, edit: 30, message: null, pdf: 10 },
    messagesPerDay: null, renderMaxPx: 2048, watermark: false, expectedAiCost: 470,
  },
  {
    id: "plus_mensuel", name: "Plus", priceTtc: 990, billing: "monthly",
    tagline: "Tout votre logement, mois après mois",
    features: ["10 études et 60 rendus HD par mois", "Ma maison : toutes vos pièces", "Export PDF illimité", "Essai gratuit de 7 jours"],
    soon: ["Retouche par zone", "Alertes de prix"],
    quotas: { study: 10, render: 60, edit: 60, message: null, pdf: null },
    messagesPerDay: null, renderMaxPx: 4096, watermark: false, trialDays: 7, highlight: true, expectedAiCost: 350,
  },
  {
    id: "plus_annuel", name: "Plus annuel", priceTtc: 6900, billing: "yearly",
    tagline: "Le Plus, 42 % moins cher",
    features: ["Tout le Plus", "Payé une fois par an"],
    quotas: { study: 10, render: 60, edit: 60, message: null, pdf: null },
    messagesPerDay: null, renderMaxPx: 4096, watermark: false, trialDays: 7, expectedAiCost: 3000,
  },
  {
    id: "credits", name: "Crédits", priceTtc: 490, billing: "one_time", accessDays: 365,
    tagline: "15 rendus, à utiliser quand vous voulez",
    features: ["15 rendus HD", "Valables 12 mois", "Cumulables avec toutes les offres"],
    quotas: { study: 0, render: 15, edit: 0, message: 0, pdf: 0 },
    messagesPerDay: 0, renderMaxPx: 2048, watermark: false, expectedAiCost: 165,
  },
  {
    id: "pro", name: "Pro", priceTtc: 2900, billing: "monthly",
    tagline: "Agents immobiliers et home stagers",
    features: ["30 études et 100 rendus par mois", "Export HD sans filigrane", "Facture Stripe à votre nom"],
    soon: ["Home staging en lot"],
    quotas: { study: 30, render: 100, edit: 100, message: null, pdf: null },
    messagesPerDay: null, renderMaxPx: 4096, watermark: false, expectedAiCost: 1100,
  },
  {
    id: "agence", name: "Pro Agence", priceTtc: 7900, billing: "monthly",
    tagline: "Pour les équipes",
    features: ["100 études et 400 rendus par mois", "Export HD sans filigrane", "Facture Stripe à votre nom"],
    soon: ["Plusieurs utilisateurs", "Marque blanche (votre logo)"],
    quotas: { study: 100, render: 400, edit: 400, message: null, pdf: null },
    messagesPerDay: null, renderMaxPx: 4096, watermark: false, expectedAiCost: 4400,
  },
] as const;

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Offre inconnue : ${id}`);
  return plan;
}

/** Usage raisonnable : plafond de dépense IA par utilisateur et par jour (centimes). */
export const DAILY_AI_SPEND_CAP: Cents = 150;
/** Part du chiffre d'affaires HT qui finance l'offre gratuite. */
export const FREE_TIER_SHARE = 0.15;
