"use client";
import { useCallback, useSyncExternalStore } from "react";
import { local } from "./storage";

/**
 * Valeur persistée dans le stockage local, lue sans « effet » : compatible avec le rendu statique
 * (côté serveur, la valeur par défaut est utilisée ; côté client, la valeur stockée).
 */
const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, l: () => void) {
  let set = listeners.get(key); if (!set) { set = new Set(); listeners.set(key, set); }
  set.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === key) { cache.delete(key); l(); } };
  window.addEventListener("storage", onStorage);
  return () => { set.delete(l); window.removeEventListener("storage", onStorage); };
}

export function setLocal<T>(key: string, value: T | null) {
  if (value === null) local.remove(key); else local.set(key, value);
  cache.set(key, value);
  listeners.get(key)?.forEach((l) => l());
}

export function useLocal<T>(key: string, fallback: T): [T, (v: T | null) => void] {
  const get = useCallback(() => {
    if (!cache.has(key)) cache.set(key, local.get<T | null>(key, null));
    const v = cache.get(key) as T | null;
    return v ?? fallback;
  }, [key, fallback]);
  const value = useSyncExternalStore((l) => subscribe(key, l), get, () => fallback);
  const set = useCallback((v: T | null) => setLocal(key, v), [key]);
  return [value, set];
}

/** Vrai uniquement après l'hydratation côté client (utile pour les éléments qui dépendent du navigateur). */
const noop = () => () => {};
export function useHydrated(): boolean { return useSyncExternalStore(noop, () => true, () => false); }
