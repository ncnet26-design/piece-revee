"use client";
import { useSyncExternalStore } from "react";
import { KEYS, local } from "./storage";

/** Moodboard : identifiants d'éléments de la bibliothèque ou de la galerie. Stocké localement, synchronisé au compte si connecté. */
type Listener = () => void;
const listeners = new Set<Listener>();
let cache: string[] | null = null;
const EMPTY: string[] = [];

function read(): string[] { cache ??= local.get<string[]>(KEYS.favorites, []); return cache; }
function write(next: string[]) { cache = next; local.set(KEYS.favorites, next); listeners.forEach((l) => l()); }

export const favorites = {
  list: read,
  has: (id: string) => read().includes(id),
  toggle(id: string) { const cur = read(); write(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]); },
  add(id: string) { if (!read().includes(id)) write([...read(), id]); },
  clear() { write([]); },
  subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; },
};

export function useFavorites(): string[] {
  return useSyncExternalStore(favorites.subscribe, favorites.list, () => EMPTY);
}
