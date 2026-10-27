"use client";
import { useSyncExternalStore } from "react";

/**
 * Paramètres d'URL lus sans « bail-out » du rendu statique : la page est pré-rendue avec les valeurs par défaut,
 * puis React applique les paramètres réels à l'hydratation (pas de décalage de mise en page).
 */
const subscribe = (cb: () => void) => { window.addEventListener("popstate", cb); return () => window.removeEventListener("popstate", cb); };
export function useSearch(): URLSearchParams {
  const s = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  return new URLSearchParams(s);
}
