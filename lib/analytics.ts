"use client";
import { POSTHOG_HOST, POSTHOG_KEY } from "./site";

/**
 * Mesure d'audience chargée uniquement après consentement.
 * Le script PostHog est servi depuis l'instance européenne ; rien n'est chargé si la clé est absente.
 */
export function startAnalytics(): void {
  if (!POSTHOG_KEY || typeof window === "undefined" || document.getElementById("ph-script")) return;
  const s = document.createElement("script");
  s.id = "ph-script"; s.async = true; s.src = `${POSTHOG_HOST.replace(/\/$/, "")}/static/array.js`;
  s.onload = () => {
    const ph = (window as unknown as { posthog?: { init: (k: string, o: Record<string, unknown>) => void } }).posthog;
    ph?.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, person_profiles: "identified_only", capture_pageview: true, disable_session_recording: true });
  };
  document.head.appendChild(s);
}
