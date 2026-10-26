import type { StudyResult } from "@core/schemas/study.ts";

/**
 * Études d'exemple (mode démonstration). Elles respectent exactement le schéma validé côté serveur.
 * Aucune référence produit : les besoins sont décrits par attributs, comme le fait la vraie étude.
 */
export const DEMO_INTERIOR: StudyResult = {
  concept: {
    title: "Salon japandi lumineux",
    summary: "La pièce reçoit une belle lumière latérale venant de la gauche : on la garde comme point fort. On réchauffe les murs avec un blanc cassé, on ancre le canapé sur un grand tapis de laine et on regroupe les rangements sur un seul mur pour libérer la vue.",
    mood: "Bois clair, lin lavé, lumière filtrée. Calme, chaleureux, sans encombrement.",
    analysis: ["Salon d'environ 24 m², hauteur sous plafond estimée à 2,60 m", "Fenêtre à gauche, lumière d'après-midi", "Parquet en chêne conservé", "Canapé gris conservé, à réchauffer avec des textiles"],
    principles: ["Une seule famille de tons sable, déclinée en textures", "Mobilier bas pour agrandir visuellement", "Éclairage en trois couches pour le soir"],
  },
  palette: [
    { name: "Blanc cassé chaud", usage: "Murs", hex: "#ECE6DA", paintColorId: null },
    { name: "Lin naturel", usage: "Textiles", hex: "#D8CDB8", paintColorId: null },
    { name: "Chêne clair", usage: "Bois", hex: "#C9A97E", paintColorId: null },
    { name: "Vert sauge", usage: "Accent", hex: "#A8B19A", paintColorId: null },
    { name: "Encre douce", usage: "Contrastes", hex: "#3C3A35", paintColorId: null },
  ],
  zones: [
    { id: 1, x: 62, y: 52, title: "Canapé", action: "Garder le canapé gris, ajouter une housse et des coussins en lin." },
    { id: 2, x: 57, y: 22, title: "Mur du fond", action: "Peinture blanc cassé chaud, cadre en bois clair." },
    { id: 3, x: 36, y: 18, title: "Éclairage", action: "Suspension en papier au-dessus de la table basse, lampes basses dans les angles." },
    { id: 4, x: 62, y: 88, title: "Sol", action: "Grand tapis en laine, 200 × 300 cm au minimum." },
    { id: 5, x: 90, y: 58, title: "Angle", action: "Grande plante en pot, près de la lumière." },
  ],
  needs: [
    { id: "n1", zoneId: 2, category: "Peinture", description: "Peinture murale mate, blanc cassé chaud, lessivable", style: ["japandi"], materials: [], colors: ["blanc cassé"], maxDimensionsCm: { w: null, d: null, h: null }, priceRange: { min: 25, max: 90 }, gamme: "milieu", quantity: 2 },
    { id: "n2", zoneId: 3, category: "Luminaire", description: "Suspension en papier ou textile, diamètre 50 à 70 cm, lumière diffuse", style: ["japandi"], materials: ["papier"], colors: ["blanc"], maxDimensionsCm: { w: 70, d: 70, h: null }, priceRange: { min: 20, max: 450 }, gamme: "milieu", quantity: 1 },
    { id: "n3", zoneId: 4, category: "Tapis", description: "Tapis en laine ou jute, 200 × 300 cm, tons sable", style: ["japandi"], materials: ["laine", "jute"], colors: ["sable", "beige"], maxDimensionsCm: { w: 300, d: 300, h: null }, priceRange: { min: 150, max: 1300 }, gamme: "milieu", quantity: 1 },
    { id: "n4", zoneId: 1, category: "Textile", description: "Housses de coussin et plaid en lin lavé, sauge et sable", style: ["japandi"], materials: ["lin"], colors: ["sauge", "sable"], maxDimensionsCm: { w: null, d: null, h: null }, priceRange: { min: 15, max: 130 }, gamme: "milieu", quantity: 4 },
    { id: "n5", zoneId: 5, category: "Pot", description: "Grand pot en terre cuite ou fibre, diamètre 35 à 45 cm", style: ["japandi"], materials: ["terre cuite"], colors: ["naturel"], maxDimensionsCm: { w: 45, d: 45, h: 50 }, priceRange: { min: 20, max: 120 }, gamme: "accessible", quantity: 1 },
  ],
  plants: [],
  custom: [{ element: "Bibliothèque basse sur-mesure en chêne", trade: "Menuisier", description: "Meuble bas de 3 m sous la fenêtre, portes cannées, profondeur 40 cm", budgetMin: 1800, budgetMax: 3200 }],
  tutorials: [
    { title: "Peindre un mur comme un pro", zoneId: 2, difficulty: "Facile", duration: "1 jour, plus le séchage", tools: ["Rouleau à poils moyens", "Pinceau à rechampir", "Bâche et ruban de masquage", "Lessive et éponge", "Enduit de rebouchage et cale à poncer"],
      steps: ["Couper le courant, démonter les caches des prises, protéger le sol et les plinthes.", "Lessiver le mur, rincer, laisser sécher.", "Reboucher les trous, poncer, dépoussiérer.", "Appliquer une sous-couche si le support est neuf, poreux ou d'une couleur très différente.", "Peindre d'abord les angles et le tour des menuiseries au pinceau.", "Au rouleau, déposer la peinture en W puis lisser du haut vers le bas, sans laisser sécher le bord.", "Respecter le temps de séchage indiqué sur le pot avant la seconde couche."],
      tip: "Travaillez par bandes d'un mètre en gardant toujours un bord humide : c'est ce qui évite les traces de reprise.", safety: "Aérez la pièce pendant et après les travaux." },
    { title: "Choisir et poser un grand tapis", zoneId: 4, difficulty: "Facile", duration: "30 minutes", tools: ["Mètre ruban", "Sous-tapis antidérapant"],
      steps: ["Mesurer : le tapis doit passer sous au moins les pieds avant du canapé.", "Laisser 30 à 60 cm de sol visible entre le tapis et les murs.", "Poser un sous-tapis antidérapant, surtout sur parquet.", "Dérouler le tapis à l'envers 24 heures pour l'aplatir."],
      tip: "Dans le doute, prenez la taille au-dessus : un tapis trop petit rétrécit visuellement la pièce.", safety: null },
  ],
  works: [
    { step: "Préparer et peindre les murs", duration: "2 jours", pro: false },
    { step: "Installer la suspension (électricien si nouveau point lumineux)", duration: "½ journée", pro: true },
    { step: "Poser le tapis, réorganiser le mobilier", duration: "½ journée", pro: false },
    { step: "Textiles, plante, cadres", duration: "½ journée", pro: false },
  ],
  regulations: [],
  renderBrief: { prompt: "Photographie d'architecture intérieure, salon japandi, murs blanc cassé chaud #ECE6DA, parquet chêne conservé, canapé gris avec coussins en lin sauge, grand tapis en laine sable, suspension en papier, plante en pot, lumière naturelle de fin d'après-midi venant de la fenêtre gauche, objectif 24 mm", negative: "déformation des murs, mobilier flottant, pieds tordus, texte, logo, personnes, lignes ondulées", light: "Lumière naturelle de fin d'après-midi, fenêtre à gauche, ombres douces" },
};

export const DEMO_EXTERIOR: StudyResult = {
  concept: {
    title: "Terrasse méditerranéenne sèche",
    summary: "Terrasse plein sud d'environ 30 m², très exposée l'après-midi. On crée de l'ombre avec une structure légère, on encadre l'espace de massifs de plantes peu gourmandes en eau, et on garde un coin repas.",
    mood: "Tons sable et lavande, ombre légère, plantes sobres en eau.",
    analysis: ["Exposition sud, ensoleillement fort l'après-midi", "Zone de rusticité à confirmer avec votre code postal", "Dalles existantes conservées", "Vis-à-vis côté est"],
    principles: ["Ombre avant tout pour profiter de l'après-midi", "Plantes méditerranéennes en sol drainé", "Peu de mobilier, bien choisi"],
  },
  palette: [
    { name: "Sable", usage: "Sol, pots", hex: "#E2D3B8", paintColorId: null },
    { name: "Terre cuite", usage: "Accents", hex: "#C27B4E", paintColorId: null },
    { name: "Olivier", usage: "Feuillage", hex: "#8A9A6E", paintColorId: null },
    { name: "Lavande", usage: "Floraison", hex: "#A98BB8", paintColorId: null },
    { name: "Bleu ardoise", usage: "Mobilier", hex: "#5E6E7C", paintColorId: null },
  ],
  zones: [
    { id: 1, x: 60, y: 26, title: "Ombre", action: "Structure légère avec toile ou canisse pour l'ombre de l'après-midi." },
    { id: 2, x: 12, y: 68, title: "Massif ouest", action: "Lavandes, cistes et graminées, sur sol drainé." },
    { id: 3, x: 58, y: 72, title: "Coin repas", action: "Table pour quatre, chaises en métal." },
    { id: 4, x: 90, y: 70, title: "Écran est", action: "Grands pots avec olivier pour masquer le vis-à-vis." },
  ],
  needs: [
    { id: "e1", zoneId: 1, category: "Ombrage", description: "Pergola légère ou voile d'ombrage, environ 3 × 4 m", style: ["méditerranéen"], materials: ["aluminium", "bois"], colors: ["sable"], maxDimensionsCm: { w: 400, d: 400, h: 260 }, priceRange: { min: 80, max: 1500 }, gamme: "milieu", quantity: 1 },
    { id: "e2", zoneId: 4, category: "Pot", description: "Grands pots résistants au gel, diamètre 50 cm et plus", style: ["méditerranéen"], materials: ["terre cuite", "fibre"], colors: ["terre cuite"], maxDimensionsCm: { w: 70, d: 70, h: 80 }, priceRange: { min: 40, max: 300 }, gamme: "milieu", quantity: 2 },
    { id: "e3", zoneId: 3, category: "Mobilier extérieur", description: "Table quatre places et chaises empilables en métal traité", style: ["méditerranéen"], materials: ["métal"], colors: ["bleu ardoise"], maxDimensionsCm: { w: 160, d: 90, h: null }, priceRange: { min: 200, max: 1400 }, gamme: "milieu", quantity: 1 },
  ],
  plants: [
    { plantId: "p-olivier", zoneId: 4, quantity: 2, why: "Persistant et tolérant à la sécheresse, il masque le vis-à-vis toute l'année." },
    { plantId: "p-lavande-vraie", zoneId: 2, quantity: 7, why: "Floraison d'été parfumée, très peu d'arrosage une fois installée." },
    { plantId: "p-ciste-pourpre", zoneId: 2, quantity: 3, why: "Fleurs de printemps, adore le sol pauvre et drainé." },
    { plantId: "p-cheveux-d-ange", zoneId: 2, quantity: 5, why: "Graminée légère qui bouge au vent et adoucit le massif." },
    { plantId: "p-gaura", zoneId: 2, quantity: 3, why: "Floraison de juin aux gelées." },
    { plantId: "p-romarin", zoneId: 2, quantity: 2, why: "Aromatique, persistant, résiste au vent." },
  ],
  custom: [{ element: "Banquette maçonnée enduite", trade: "Maçon", description: "Banquette de 2,5 m le long du mur ouest, enduit à la chaux", budgetMin: 1500, budgetMax: 2800 }],
  tutorials: [
    { title: "Planter un massif méditerranéen", zoneId: 2, difficulty: "Facile", duration: "½ journée", tools: ["Bêche et grelinette", "Gravier 6/10 mm", "Sable", "Arrosoir"],
      steps: ["Planter de préférence à l'automne, quand le sol est encore chaud.", "Décompacter la terre et y mélanger gravier et sable si elle retient l'eau.", "Tremper les mottes dans un seau d'eau avant de planter.", "Planter en quinconce, en respectant la taille adulte des plantes.", "Pailler avec du gravier pour garder le sol au chaud et limiter les herbes.", "Arroser copieusement la première année, puis espacer fortement."],
      tip: "Ces plantes meurent plus souvent d'un excès d'eau en hiver que de sécheresse : le drainage compte plus que l'arrosage.", safety: "Portez des gants pour manipuler les euphorbes, dont la sève est irritante." },
  ],
  works: [
    { step: "Vérifier en mairie la règle d'urbanisme pour la pergola", duration: "1 à 4 semaines", pro: false },
    { step: "Installer la structure d'ombrage", duration: "1 à 2 jours", pro: true },
    { step: "Préparer le sol et planter les massifs", duration: "1 jour, à l'automne", pro: false },
    { step: "Mobilier et pots", duration: "½ journée", pro: false },
  ],
  regulations: [
    "Distances de plantation (Code civil, art. 671) : plantations de plus de 2 m de haut à au moins 2 m de la limite de propriété, les autres à au moins 0,5 m, sauf règlement local.",
    "Pergola : selon sa surface et le règlement d'urbanisme (PLU), une déclaration préalable peut être nécessaire. À vérifier en mairie avant d'acheter.",
  ],
  renderBrief: { prompt: "Photographie d'architecture extérieure, terrasse méditerranéenne, dalles sable conservées, pergola légère avec toile, massifs de lavande, cistes et graminées sur gravier, deux oliviers en grands pots terre cuite, table en métal bleu ardoise, lumière de fin d'après-midi", negative: "plantes tropicales, pelouse, déformation, texte, logo, personnes", light: "Soleil de fin d'après-midi venant de l'ouest, ombres portées longues" },
};
