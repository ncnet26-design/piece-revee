/** Configuration publique (aucun secret ici : seules les variables NEXT_PUBLIC_* arrivent dans le navigateur). */
export const SITE = {
  name: "Pièce Rêvée",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://piece-revee.pages.dev",
  tagline: "Votre intérieur rêvé, réellement faisable.",
  description: "Une photo de votre pièce ou de votre jardin : rendus de votre espace transformé, vrais produits à acheter, tutos et conseils à chaque étape.",
  locale: "fr_FR",
  /** Éditeur du site : à compléter avant la mise en ligne (mentions légales). */
  publisher: process.env.NEXT_PUBLIC_PUBLISHER_NAME ?? "[Nom de l'éditeur à compléter]",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@exemple.fr",
};

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
/** Sans Supabase configuré, le site fonctionne en mode démonstration (données d'exemple, stockage local). */
export const DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY;
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}
