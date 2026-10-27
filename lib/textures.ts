import data from "@/content/data/textures.json";

/** Textures photographiques (Poly Haven, CC0) récupérées par le robot de ressources, par matière. */
export interface RealTexture { assetId: string; name: string; url: string; authors: string[]; license: string; tile: number }
export const REAL_TEXTURES = data as Record<string, RealTexture>;
export const realTexture = (id: string): RealTexture | undefined => REAL_TEXTURES[id];
export const textureUrl = (id: string, map: "diff" | "nor" | "rough") => `/textures/${id}/${map}.webp`;
