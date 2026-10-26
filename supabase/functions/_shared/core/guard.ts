/**
 * Garde-fous de Camille : sujets à risque et encadrement des données externes.
 */
const RISKY: { re: RegExp; topic: string; pro: string }[] = [
  { re: /\b(mur porteur|porteur|poutre|dalle|fissure|structure|tr[ée]mie|surélévation|charpente)\b/i, topic: "structure", pro: "un architecte ou un bureau d'études structure" },
  { re: /\b(électri|tableau électrique|disjoncteur|prise|câbl|domino|interrupteur|NF ?C ?15-100)/i, topic: "électricité", pro: "un électricien qualifié" },
  { re: /\b(gaz|chaudi[èe]re|conduit de fum[ée]e|po[êe]le|insert)\b/i, topic: "gaz et combustion", pro: "un professionnel qualifié (gaz ou fumisterie)" },
  { re: /\b(amiante|plomb)\b/i, topic: "amiante ou plomb", pro: "un diagnostiqueur certifié" },
  { re: /\b(permis de construire|déclaration préalable|PLU|urbanisme|ABF|bâtiments de France)\b/i, topic: "urbanisme", pro: "le service urbanisme de votre mairie ou le CAUE de votre département" },
];

export function detectRiskyTopics(text: string): { topic: string; pro: string }[] {
  return RISKY.filter((r) => r.re.test(text)).map(({ topic, pro }) => ({ topic, pro }));
}

export function proNotice(topics: { topic: string; pro: string }[]): string | null {
  if (!topics.length) return null;
  const list = topics.map((t) => `${t.topic} : ${t.pro}`).join(" ; ");
  return `Pour ces points, je donne une information générale. La décision et les travaux reviennent à un professionnel (${list}).`;
}

/**
 * Encadre un contenu externe (fiche produit, page web, résultat d'outil) pour qu'il soit lu comme une donnée.
 * Les balises de fermeture éventuelles sont neutralisées pour empêcher toute « évasion ».
 */
export function asData(source: string, content: string): string {
  const safe = content.replaceAll("</donnees>", "&lt;/donnees&gt;").slice(0, 20_000);
  return `<donnees source="${source.replace(/"/g, "'")}">\n${safe}\n</donnees>`;
}

/** Vérifie que chaque identifiant cité [[id]] existe vraiment ; retire les autres. */
export function sanitizeCitations(text: string, known: (id: string) => boolean): { text: string; removed: string[] } {
  const removed: string[] = [];
  const out = text.replace(/\[\[([a-z0-9][a-z0-9:_-]{1,79})\]\]/g, (m, id: string) => {
    if (known(id)) return m;
    removed.push(id);
    return "";
  });
  return { text: out, removed };
}

const OFF_TOPIC = /\b(recette de cuisine|horoscope|crypto|bitcoin|devoirs de math|code python|élection|parti politique)\b/i;
export function isOffTopic(text: string): boolean { return OFF_TOPIC.test(text); }
