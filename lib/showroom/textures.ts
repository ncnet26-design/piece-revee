import data from "@/content/data/textures-showroom.json";
import type { RealTexture } from "@/lib/textures";

/** Textures photographiées choisies pour le showroom (robot de ressources, Poly Haven CC0). */
export const SHOWROOM_TEXTURES = data as Record<string, RealTexture>;
export const showroomTexture = (key: string): RealTexture | undefined => SHOWROOM_TEXTURES[key];
