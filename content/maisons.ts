/**
 * Maisons d'édition de niche, citées à titre de référence (aucun partenariat, aucun produit ni prix repris).
 * Chaque description résume des sources publiques ; le lien « site » n'est donné que lorsque l'adresse officielle
 * a été vérifiée, sinon le lien ouvre une recherche sur le nom de la maison.
 */
export interface Maison { id: string; name: string; country: string; text: string; site?: string; families: string[] }

export const MAISONS: Maison[] = [
  { id: "ressource", name: "Ressource", country: "France", text: "Peintures et papiers peints haut de gamme, fabriqués en Provence par une entreprise familiale.", site: "https://ressource-peintures.com", families: ["peinture"] },
  { id: "little-greene", name: "Little Greene", country: "Royaume-Uni", text: "Peintures aux teintes historiques, issues notamment d'un partenariat avec le National Trust ; fabrication près de Manchester.", site: "https://www.littlegreene.com", families: ["peinture", "papier-peint"] },
  { id: "cole-and-son", name: "Cole & Son", country: "Royaume-Uni", text: "Papiers peints imprimés depuis 1875, nés d'un atelier d'impression à la planche à Islington.", site: "https://cole-and-son.com", families: ["papier-peint"] },
  { id: "pierre-frey", name: "Pierre Frey", country: "France", text: "Maison familiale fondée en 1935 : tissus d'ameublement, papiers peints, moquettes et mobilier.", site: "https://www.pierrefrey.com", families: ["tissu", "papier-peint", "moquette"] },
  { id: "zuber", name: "Zuber", country: "France", text: "Manufacture de Rixheim, en Alsace, connue pour ses papiers peints panoramiques imprimés depuis le XIXe siècle.", families: ["papier-peint"] },
  { id: "kvadrat", name: "Kvadrat", country: "Danemark", text: "Textiles d'ameublement, rideaux et solutions acoustiques, fondé en 1968 à Ebeltoft.", families: ["tissu"] },
  { id: "cogolin", name: "Manufacture Cogolin", country: "France", text: "Manufacture centenaire du Var : tapis noués main et tissés sur métiers Jacquard à bras.", site: "https://www.manufacturecogolin.com", families: ["moquette"] },
  { id: "popham", name: "Popham Design", country: "Maroc", text: "Studio fondé en 2007 à Marrakech : carreaux de ciment faits main par des artisans locaux.", families: ["ciment"] },
  { id: "bert-and-may", name: "Bert & May", country: "Royaume-Uni et Espagne", text: "Carreaux de ciment faits main et carreaux anciens de récupération.", site: "https://www.bertandmay.com", families: ["ciment", "tomette"] },
  { id: "mutina", name: "Mutina", country: "Italie", text: "Céramiques de designers (Patricia Urquiola, Ronan et Erwan Bouroullec…), éditées à Fiorano, près de Modène.", site: "https://www.mutina.it", families: ["faience", "zellige", "terrazzo"] },
  { id: "salvatori", name: "Salvatori", country: "Italie", text: "Pierre naturelle et marbre travaillés depuis 1946 à Querceta, au pied des carrières de Carrare.", site: "https://www.salvatoriofficial.com", families: ["marbre"] },
  { id: "buster-punch", name: "Buster + Punch", country: "Royaume-Uni", text: "Quincaillerie de porte et de meuble en métal massif, reconnaissable à son moletage en pointe de diamant.", families: ["quincaillerie", "metal"] },
  { id: "atelier-vime", name: "Atelier Vime", country: "France", text: "Maison de Vallabrègues, dans le Gard : objets, miroirs et luminaires tressés en osier, rotin et corde.", site: "https://ateliervime.com", families: ["cannage"] },
  { id: "sika-design", name: "Sika-Design", country: "Danemark", text: "Mobilier en rotin, édité par une entreprise familiale danoise.", families: ["cannage"] },
  { id: "petite-friture", name: "Petite Friture", country: "France", text: "Éditeur parisien de mobilier et de luminaires, fondé en 2009, qui travaille avec une trentaine de designers.", families: ["objets"] },
];
export const maisonsFor = (familyId: string) => MAISONS.filter((m) => m.families.includes(familyId));
export const maisonUrl = (m: Maison) => m.site ?? `https://www.google.com/search?q=${encodeURIComponent(`${m.name} ${m.country}`)}`;
