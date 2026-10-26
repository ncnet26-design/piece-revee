"use client";
import { useSyncExternalStore } from "react";
import { KEYS, local } from "./storage";

/** « Ma maison » : un logement regroupe des projets et porte un fil conducteur (style, palette). */
export interface Home { id: string; name: string; postalCode: string | null; threadStyleId: string | null; projectIds: string[] }
type L = () => void;
const ls = new Set<L>();
let cache: Home | null | undefined;
const read = (): Home | null => (cache === undefined ? (cache = local.get<Home | null>(KEYS.home, null)) : cache);
const write = (h: Home | null) => { cache = h; local.set(KEYS.home, h); ls.forEach((l) => l()); };
export const homeStore = {
  get: read,
  save: write,
  subscribe(l: L) { ls.add(l); return () => { ls.delete(l); }; },
};
export function useHome(): Home | null { return useSyncExternalStore(homeStore.subscribe, read, () => null); }
