/** Montants toujours manipulés en centimes d'euro (entiers). */
export type Cents = number;

export function formatEuros(cents: Cents, opts: { decimals?: boolean } = {}): string {
  const value = cents / 100;
  const decimals = opts.decimals ?? !Number.isInteger(value);
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
}

/** TVA française à 20 % : montant HT à partir du TTC, arrondi au centime. */
export function htFromTtc(ttc: Cents, vatRate = 0.2): Cents {
  return Math.round(ttc / (1 + vatRate));
}

/** Estimation des frais Stripe (carte UE standard + Stripe Tax). Valeurs à confirmer dans docs/COSTS.md. */
export function estimateStripeFees(ttc: Cents): Cents {
  const percent = 0.015 + 0.005; // carte UE + Stripe Tax
  return Math.round(ttc * percent + 25);
}
