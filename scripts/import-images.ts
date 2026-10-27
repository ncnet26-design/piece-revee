/**
 * Import des photos libres de droits pour la galerie et les lieux (à lancer dans GitHub Actions, qui a accès à Internet).
 * Sources : Unsplash et Pexels (clés gratuites), Openverse et Wikimedia Commons (sans clé).
 * Seules les licences permettant l'usage commercial sont retenues ; auteur, source et licence sont toujours enregistrés.
 * Usage : UNSPLASH_ACCESS_KEY=… PEXELS_API_KEY=… node --experimental-strip-types scripts/import-images.ts
 */
import { writeFileSync } from "node:fs";
import { STYLES, GALLERY_SPACES, PLACES } from "../content/index.ts";
import type { FreePhoto } from "../content/gallery.ts";

const UA = { "user-agent": "PieceReveeImageImport/1.0 (contact via site)" };
/** Requête avec limite de temps : une API qui ne répond pas ne bloque plus tout l'import. */
const fetch = (url: string, init: RequestInit = {}) => globalThis.fetch(url, { ...init, signal: AbortSignal.timeout(20000) }).catch(() => new Response(null, { status: 599 }));
const EN_SPACE: Record<string, string> = { Salon: "living room", Chambre: "bedroom", Cuisine: "kitchen", "Salle de bain": "bathroom", Bureau: "home office", Entrée: "entryway", Jardin: "garden", Terrasse: "terrace patio", Balcon: "balcony", Cour: "courtyard", "Abords de piscine": "pool deck" };
const EN_STYLE: Record<string, string> = { japandi: "japandi", mediterraneen: "mediterranean", "art-deco": "art deco", scandinave: "scandinavian", industriel: "industrial loft", boheme: "boho", "mid-century": "mid century modern", riad: "moroccan riad", minimaliste: "minimalist", "campagne-chic": "french country", maximaliste: "maximalist", "bord-de-mer": "coastal", "jardin-sec": "mediterranean dry garden", "jardin-japonais": "japanese garden", "jardin-anglais": "english cottage garden", "terrasse-contemporaine": "modern terrace", "potager-chic": "vegetable garden raised beds", "balcon-urbain": "small balcony plants", "prairie-naturelle": "naturalistic meadow garden", tropical: "tropical garden" };
const OK_OPENVERSE = new Set(["cc0", "pdm", "by", "by-sa"]);
const PER_COMBO = Number(process.env.PER_COMBO ?? 14);

async function unsplash(q: string): Promise<FreePhoto[]> {
  const k = process.env.UNSPLASH_ACCESS_KEY; if (!k) return [];
  const r = await fetch(`https://api.unsplash.com/search/photos?per_page=${PER_COMBO}&orientation=landscape&query=${encodeURIComponent(q)}`, { headers: { authorization: `Client-ID ${k}`, ...UA } });
  if (!r.ok) return [];
  const j = await r.json() as { results: { id: string; width: number; height: number; alt_description: string | null; urls: { regular: string; small: string }; links: { html: string }; user: { name: string; links: { html: string } } }[] };
  return j.results.map((p) => ({ id: `unsplash-${p.id}`, styleId: "", space: "", url: p.urls.regular, thumbUrl: p.urls.small, width: p.width, height: p.height, alt: p.alt_description ?? q, author: p.user.name,
    authorUrl: `${p.user.links.html}?utm_source=piece_revee&utm_medium=referral`, source: "Unsplash" as const, sourceUrl: `${p.links.html}?utm_source=piece_revee&utm_medium=referral`, license: "Licence Unsplash", licenseUrl: "https://unsplash.com/license" }));
}
async function pexels(q: string): Promise<FreePhoto[]> {
  const k = process.env.PEXELS_API_KEY; if (!k) return [];
  const r = await fetch(`https://api.pexels.com/v1/search?per_page=${PER_COMBO}&orientation=landscape&query=${encodeURIComponent(q)}`, { headers: { authorization: k, ...UA } });
  if (!r.ok) return [];
  const j = await r.json() as { photos: { id: number; width: number; height: number; alt: string; url: string; photographer: string; photographer_url: string; src: { large: string; medium: string } }[] };
  return j.photos.map((p) => ({ id: `pexels-${p.id}`, styleId: "", space: "", url: p.src.large, thumbUrl: p.src.medium, width: p.width, height: p.height, alt: p.alt || q, author: p.photographer, authorUrl: p.photographer_url, source: "Pexels" as const, sourceUrl: p.url, license: "Licence Pexels", licenseUrl: "https://www.pexels.com/license/" }));
}
let openverseWarned = false;
async function openverse(q: string): Promise<FreePhoto[]> {
  const r = await fetch(`https://api.openverse.org/v1/images/?page_size=${PER_COMBO}&license_type=commercial&category=photograph&size=large&mature=false&q=${encodeURIComponent(q)}`, { headers: UA });
  if (!r.ok) { if (!openverseWarned) { openverseWarned = true; console.log(`Openverse indisponible (${r.status}) : ${(await r.text()).slice(0, 200)}`); } return []; }
  const j = await r.json() as { results: { id: string; url: string; thumbnail: string; width: number | null; height: number | null; title: string; creator: string | null; creator_url: string | null; foreign_landing_url: string; license: string; license_version: string; license_url: string }[] };
  return j.results.filter((p) => OK_OPENVERSE.has(p.license) && p.url.startsWith("https://") && (p.width ?? 0) >= 900).map((p) => ({ id: `openverse-${p.id}`, styleId: "", space: "", url: p.url, thumbUrl: p.thumbnail, width: p.width ?? 1200, height: p.height ?? 800, alt: p.title || q,
    author: p.creator ?? "Auteur inconnu", authorUrl: p.creator_url, source: "Openverse" as const, sourceUrl: p.foreign_landing_url, license: `CC ${p.license.toUpperCase()} ${p.license_version}`.replace("CC PDM", "Domaine public").replace("CC CC0", "CC0"), licenseUrl: p.license_url }));
}
async function commons(q: string): Promise<FreePhoto[]> {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=6&gsrsearch=${encodeURIComponent(q)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1200`;
  const r = await fetch(api, { headers: UA }); if (!r.ok) return [];
  const j = await r.json() as { query?: { pages: Record<string, { title: string; imageinfo?: { url: string; thumburl: string; width: number; height: number; descriptionurl: string; extmetadata: Record<string, { value: string }> }[] }> } };
  return Object.values(j.query?.pages ?? {}).flatMap((p) => {
    const ii = p.imageinfo?.[0]; if (!ii) return [];
    const lic = ii.extmetadata.LicenseShortName?.value ?? "";
    if (!/^(CC0|CC BY(-SA)? [\d.]+|Public domain)/i.test(lic)) return [];
    const author = (ii.extmetadata.Artist?.value ?? "Auteur inconnu").replace(/<[^>]+>/g, "").trim();
    return [{ id: `commons-${p.title}`, styleId: "", space: "", url: ii.thumburl, thumbUrl: ii.thumburl, width: ii.width, height: ii.height, alt: p.title.replace(/^File:|\.\w+$/g, ""), author, authorUrl: null, source: "Wikimedia Commons" as const, sourceUrl: ii.descriptionurl, license: lic, licenseUrl: ii.extmetadata.LicenseUrl?.value ?? null }];
  });
}

const gallery: FreePhoto[] = [];
for (const s of STYLES) for (const space of GALLERY_SPACES[s.scope]) {
  const q = `${EN_STYLE[s.id] ?? s.name} ${EN_SPACE[space] ?? space}`;
  const found = [...await unsplash(q), ...await pexels(q), ...await openverse(q)];
  const unique = found.filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i).slice(0, PER_COMBO);
  gallery.push(...unique.map((p) => ({ ...p, styleId: s.id, space })));
  console.log(`${s.name} · ${space} : ${unique.length}`);
  writeFileSync("content/data/gallery-photos.json", JSON.stringify(gallery, null, 1));
  await new Promise((r) => setTimeout(r, 400)); // respect des limites des API
}
writeFileSync("content/data/gallery-photos.json", JSON.stringify(gallery, null, 1));

const places: Record<string, FreePhoto[]> = {};
for (const p of PLACES) { places[p.id] = (await commons(p.commonsQuery)).slice(0, 4); await new Promise((r) => setTimeout(r, 300)); }
writeFileSync("content/data/place-photos.json", JSON.stringify(places, null, 1));
console.log(`Galerie : ${gallery.length} photos libres. Lieux : ${Object.values(places).flat().length} photos.`);

/* Biens d'exception et architecture : châteaux, gîtes, appartements, villas, intérieurs d'architecte. */
const ARCHI: Array<{ id: string; label: string; queries: string[] }> = [
  { id: "chateaux", label: "Châteaux et demeures", queries: ["french chateau", "chateau interior salon", "castle hall interior"] },
  { id: "gites", label: "Gîtes et maisons de campagne", queries: ["stone cottage france", "french farmhouse", "country house interior kitchen"] },
  { id: "haussmann", label: "Appartements haussmanniens", queries: ["haussmann apartment interior", "parisian apartment interior moulding"] },
  { id: "lofts", label: "Lofts et ateliers", queries: ["loft interior", "industrial loft apartment"] },
  { id: "villas", label: "Villas contemporaines", queries: ["modern villa architecture", "contemporary house pool", "modern house exterior"] },
  { id: "interieurs", label: "Intérieurs d'architecte", queries: ["interior design living room", "luxury living room interior", "minimalist interior architecture"] },
  { id: "cuisines", label: "Cuisines", queries: ["modern kitchen interior", "kitchen island interior design"] },
  { id: "bains", label: "Salles de bain", queries: ["bathroom interior design", "luxury bathroom"] },
  { id: "jardins", label: "Jardins et terrasses", queries: ["formal garden france", "terrace garden design", "mediterranean garden"] },
];
const archi: Array<FreePhoto & { collection: string }> = [];
for (const c of ARCHI) {
  for (const q of c.queries) {
    const found = [...await unsplash(q), ...await pexels(q), ...await openverse(q), ...(await commons(q)).filter((p) => p.width >= 1400)];
    for (const p of found) if (!archi.some((x) => x.id === p.id)) archi.push({ ...p, styleId: "", space: c.label, collection: c.id });
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log(`${c.label} : ${archi.filter((p) => p.collection === c.id).length}`);
  writeFileSync("content/data/architecture-photos.json", JSON.stringify(archi, null, 1));
}
