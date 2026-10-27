import type { GuideArticle } from "./types.ts";
import { SRC } from "./sources.ts";

export interface ProjectStep {
  id: "preparer" | "concevoir" | "acheter" | "realiser" | "entretenir";
  title: string;
  subtitle: string;
  todo: string[];
  todoExterior: string[];
  mistakes: string[];
  camillePrompt: string;
}

/** Parcours guidé en 5 étapes, présent dans chaque projet. */
export const PROJECT_STEPS: ProjectStep[] = [
  { id: "preparer", title: "Préparer", subtitle: "Mesures, photos, budget, autorisations",
    todo: ["Mesurer longueur, largeur et hauteur sous plafond", "Repérer fenêtres, portes, prises, radiateurs", "Photographier depuis un angle, à hauteur de poitrine, en lumière du jour", "Fixer un budget en gardant 10 à 15 % pour les imprévus", "Locataire : vérifier ce que le bail autorise", "Copropriété : relire le règlement"],
    todoExterior: ["Noter l'orientation (boussole du téléphone)", "Repérer les zones d'ombre aux différentes heures", "Vérifier le type de sol (argileux, sableux, calcaire)", "Se renseigner en mairie sur le PLU avant une pergola, un abri ou une clôture"],
    mistakes: ["Acheter avant d'avoir mesuré les passages de porte et l'escalier", "Oublier prises et radiateurs dans le plan", "Sous-estimer le budget de livraison et de pose"],
    camillePrompt: "Je prépare mon projet. Que dois-je vérifier avant de commencer ?" },
  { id: "concevoir", title: "Concevoir", subtitle: "Étude, rendus, affinages",
    todo: ["Lancer l'étude sur votre photo", "Comparer les 3 rendus et garder votre préféré", "Affiner : « plus lumineux », « budget réduit »…", "Tester la palette avec un échantillon A4 au mur, matin et soir"],
    todoExterior: ["Vérifier la rusticité des plantes proposées pour votre commune", "Prévoir l'arrosage dès la conception"],
    mistakes: ["Choisir une couleur sur écran sans échantillon", "Mélanger trop de styles dans une même pièce", "Oublier l'éclairage du soir"],
    camillePrompt: "Je suis à l'étape de conception. Comment savoir si mon projet est cohérent ?" },
  { id: "acheter", title: "Acheter", subtitle: "Liste d'achats, délais, alternatives",
    todo: ["Commander d'abord les articles à long délai (canapé, sur-mesure)", "Vérifier les dimensions de chaque meuble sur le plan", "Comparer les alternatives proposées", "Activer les alertes de prix si vous pouvez attendre"],
    todoExterior: ["Acheter les plantes en saison de plantation", "Préférer de jeunes plants : moins chers, mieux installés"],
    mistakes: ["Tout commander d'un coup sans regarder les délais", "Oublier frais de livraison et de montage", "Acheter une copie d'un meuble de designer en pensant à l'original"],
    camillePrompt: "Je vais acheter. Par quoi commencer et comment éviter les erreurs ?" },
  { id: "realiser", title: "Réaliser", subtitle: "Ordre des travaux, tutos, artisans",
    todo: ["Faire d'abord les travaux poussiéreux", "Peindre plafond, puis murs, puis boiseries", "Poser les sols avant le mobilier", "Demander 2 à 3 devis détaillés pour le sur-mesure", "Garder factures et notices"],
    todoExterior: ["Préparer le sol avant de planter (décompacter, amender)", "Planter, arroser copieusement, pailler"],
    mistakes: ["Peindre après avoir posé tapis et meubles", "Toucher à l'électricité sans couper le courant ou sans professionnel", "Poncer une vieille peinture sans vérifier la présence de plomb"],
    camillePrompt: "Je commence les travaux. Dans quel ordre faire les choses ?" },
  { id: "entretenir", title: "Profiter et entretenir", subtitle: "Entretien, photo après",
    todo: ["Noter les gestes d'entretien de chaque matière", "Prendre une photo « après » sous le même angle", "Programmer les rappels d'entretien saisonniers"],
    todoExterior: ["Suivre le calendrier de taille et d'arrosage", "Réduire l'arrosage dès la deuxième année"],
    mistakes: ["Utiliser un produit acide sur une pierre naturelle", "Arroser les plantes méditerranéennes tous les jours"],
    camillePrompt: "Mon projet est terminé. Comment l'entretenir pour qu'il dure ?" },
];

const g = (a: GuideArticle) => a;

/** Guides pratiques publiés en pages SEO. */
export const GUIDES: GuideArticle[] = [
  g({ id: "g-mesurer", slug: "mesurer-sa-piece", title: "Mesurer sa pièce en 10 minutes", scope: "interieur",
    summary: "Les mesures à prendre avant tout achat, et comment les noter pour ne rien oublier.",
    steps: [
      { title: "Dessinez le plan à main levée", body: "Une feuille, un crayon : dessinez la forme de la pièce vue de dessus, sans chercher l'échelle." },
      { title: "Mesurez chaque mur", body: "Au mètre ruban ou au télémètre laser, à environ 1 m du sol. Notez chaque longueur sur le mur correspondant du croquis." },
      { title: "Placez les ouvertures", body: "Pour chaque porte et fenêtre : distance depuis l'angle, largeur, hauteur, hauteur d'allège, sens d'ouverture." },
      { title: "Repérez les contraintes", body: "Prises, interrupteurs, radiateurs, points lumineux, poutres, colonnes, plinthes : tout ce qui gêne un meuble." },
      { title: "Hauteur sous plafond et passages", body: "Mesurez la hauteur, puis la largeur des portes et de l'escalier pour vérifier que les meubles passeront." },
    ],
    mistakes: ["Mesurer en un seul point : les murs anciens ne sont pas toujours d'équerre", "Oublier le sens d'ouverture des portes et fenêtres"], sources: [SRC.caue] }),
  g({ id: "g-photo", slug: "bien-photographier-sa-piece", title: "Bien photographier sa pièce pour l'étude", scope: "les-deux",
    summary: "Une bonne photo donne une meilleure étude et des rendus plus fidèles.",
    steps: [
      { title: "En lumière du jour", body: "Ouvrez rideaux et volets, éteignez les lampes pour éviter les couleurs mélangées." },
      { title: "Depuis un angle", body: "Placez-vous dans un coin de la pièce pour voir deux ou trois murs et la fenêtre principale." },
      { title: "À hauteur de poitrine", body: "Tenez le téléphone droit, à environ 1,3 m du sol, sans l'incliner : les verticales restent droites." },
      { title: "Sans zoom", body: "Utilisez l'objectif standard. Le très grand-angle déforme les lignes." },
      { title: "Dehors", body: "Pour un jardin ou une terrasse, photographiez depuis la maison, comme vous le regardez habituellement, par temps clair mais pas en plein soleil de midi." },
    ],
    mistakes: ["Photo de nuit ou en contre-jour", "Pièce encombrée : rangez ce qui ne restera pas"], sources: [] }),
  g({ id: "g-peinture", slug: "choisir-et-poser-sa-peinture", title: "Choisir sa peinture et réussir la pose", scope: "interieur",
    summary: "Finitions, couleurs, préparation : tout pour un mur sans traces.",
    steps: [
      { title: "Choisir la finition", body: "Mat pour masquer les défauts (salon, chambre), velours pour un bon compromis, satiné pour les pièces humides et les boiseries." },
      { title: "Choisir la couleur selon la lumière", body: "Au nord, des teintes à base chaude ; au sud, les teintes fraîches restent agréables. Testez un échantillon A4 matin et soir." },
      { title: "Préparer", body: "Lessiver, reboucher, poncer, dépoussiérer, protéger sols et prises après avoir coupé le courant." },
      { title: "Sous-couche si nécessaire", body: "Sur plâtre neuf, support poreux, taches, ou pour passer du foncé au clair." },
      { title: "Peindre", body: "Rechampir les angles au pinceau, puis rouleau en W et lissage vertical, en gardant toujours un bord humide. Deux couches." },
    ],
    mistakes: ["Choisir la couleur sur un nuancier papier minuscule", "Peindre sur un mur sale ou gras", "Recharger trop le rouleau : coulures"], sources: [SRC.ademe] }),
  g({ id: "g-eclairage", slug: "eclairer-son-salon", title: "Éclairer son salon comme un pro", scope: "interieur",
    summary: "Trois couches de lumière et quelques réglages changent complètement une pièce le soir.",
    steps: [
      { title: "Lumière générale", body: "Suspension, plafonnier ou appliques, idéalement sur variateur." },
      { title: "Lumières d'ambiance", body: "Deux ou trois lampes basses réparties aux angles de la pièce." },
      { title: "Lumière de tâche", body: "Une liseuse près du fauteuil, une lampe au-dessus du bureau." },
      { title: "La bonne température", body: "Blanc chaud (2 700 K) le soir dans les pièces à vivre." },
    ],
    mistakes: ["Un seul plafonnier puissant", "Ampoules de températures différentes dans la même pièce", "Créer un point lumineux soi-même sans électricien"], sources: [SRC.ademe, SRC.consoElec] }),
  g({ id: "g-petit-espace", slug: "amenager-un-petit-espace", title: "Aménager un studio ou une petite pièce", scope: "interieur",
    summary: "Gagner de la place et de la lumière sans travaux lourds.",
    steps: [
      { title: "Trier d'abord", body: "Un petit espace commence par moins d'objets visibles." },
      { title: "Une palette claire et continue", body: "Même couleur sur murs et plafond, peu de contrastes." },
      { title: "Monter en hauteur", body: "Rangements toute hauteur, étagères au-dessus des portes, lit sur coffre ou mezzanine." },
      { title: "Mobilier sur pieds et transparent", body: "Voir le sol sous les meubles agrandit l'espace." },
      { title: "Zoner avec des tapis et la lumière", body: "Un tapis et une lampe suffisent à créer un coin salon dans un studio." },
    ],
    mistakes: ["Beaucoup de petits meubles plutôt que quelques grands", "Rideaux courts posés au ras de la fenêtre"], sources: [] }),
  g({ id: "g-locataire", slug: "decorer-quand-on-est-locataire", title: "Décorer quand on est locataire", scope: "interieur",
    summary: "Transformer son logement sans risquer sa caution.",
    steps: [
      { title: "Ce que dit la loi", body: "On peut aménager, pas transformer sans accord écrit du propriétaire." },
      { title: "Les murs sans percer", body: "Papier peint repositionnable, crochets adhésifs, rails et cimaises posés au plafond." },
      { title: "La lumière sur prise", body: "Appliques avec câble apparent et lampes à poser à la place d'un plafonnier." },
      { title: "Le sol", body: "Grands tapis, ou dalles vinyle posées sans colle là où le support le permet." },
      { title: "Tout ce qui se déménage", body: "Textiles, mobilier, plantes, cadres : votre style vous suit." },
    ],
    mistakes: ["Peindre en couleur très foncée sans accord", "Percer du carrelage"], sources: [SRC.loi89] }),
  g({ id: "g-jardin-sec", slug: "creer-un-jardin-sec", title: "Créer un jardin sec qui ne demande presque pas d'eau", scope: "exterieur",
    summary: "Les bonnes plantes, le bon sol et la bonne saison pour un jardin qui supporte la chaleur.",
    steps: [
      { title: "Planter à l'automne", body: "Le sol est chaud et les pluies aident les racines à descendre avant l'été." },
      { title: "Drainer", body: "Décompacter et mélanger du gravier au sol s'il est argileux : l'excès d'eau en hiver tue plus que la sécheresse." },
      { title: "Choisir des plantes adaptées", body: "Lavande, romarin, cistes, phlomis, perovskia, graminées comme le stipa." },
      { title: "Pailler au gravier", body: "5 cm de gravier gardent le sol frais et limitent les herbes." },
      { title: "Arroser la première année seulement", body: "Arrosages copieux et espacés, puis presque plus rien ensuite." },
    ],
    mistakes: ["Planter en plein été", "Arroser un peu tous les jours", "Mettre du terreau riche"], sources: [SRC.tela, SRC.ademe] }),
  g({ id: "g-balcon", slug: "amenager-son-balcon", title: "Aménager un petit balcon", scope: "exterieur",
    summary: "Plantes résistantes au vent, poids, intimité : un balcon agréable même en ville.",
    steps: [
      { title: "Vérifier le poids et le règlement", body: "Pots légers, terreau allégé, et un coup d'œil au règlement de copropriété." },
      { title: "Choisir selon l'exposition", body: "Plein sud : lavande, romarin, graminées. Nord : fougères, heuchères, hostas." },
      { title: "Créer de l'intimité", body: "Brise-vue ajouré ou jasmin étoilé sur un treillis." },
      { title: "Mobilier pliant", body: "Une table rabattable au garde-corps et deux chaises pliantes." },
      { title: "Arrosage", body: "Réserves d'eau dans les pots ou goutte-à-goutte sur programmateur." },
    ],
    mistakes: ["Bacs en terre cuite pleins au bord du balcon", "Brise-vue plein qui prend le vent comme une voile"], sources: [SRC.copro] }),
  g({ id: "g-potager", slug: "demarrer-un-potager", title: "Démarrer un petit potager", scope: "exterieur",
    summary: "Commencer petit, bien placé, et récolter dès le premier été.",
    steps: [
      { title: "Le bon emplacement", body: "Au moins 6 heures de soleil par jour, près d'un point d'eau." },
      { title: "Des carrés surélevés", body: "Un ou deux carrés de 1,2 m de côté suffisent pour commencer." },
      { title: "Un bon sol", body: "Terre de jardin et compost mûr." },
      { title: "Des cultures faciles", body: "Tomates, courgettes, salades, radis, aromatiques, fraisiers." },
      { title: "Pailler et arroser au pied", body: "Le paillage limite l'arrosage et le désherbage." },
    ],
    mistakes: ["Trop grand dès la première année", "Planter les tomates avant les dernières gelées"], sources: [SRC.ademe] }),
  g({ id: "g-haie", slug: "planter-une-haie", title: "Planter une haie variée", scope: "exterieur",
    summary: "Une haie qui protège des regards, résiste aux maladies et accueille les oiseaux.",
    steps: [
      { title: "Respecter les distances", body: "Plus de 2 m de haut : à au moins 2 m de la limite. Sinon 0,5 m." },
      { title: "Mélanger les essences", body: "Persistants et caducs, floraisons étalées, espèces locales." },
      { title: "Planter en automne-hiver", body: "Hors gel, de novembre à mars pour les racines nues." },
      { title: "Pailler", body: "Une épaisse couche de paillis au pied les premières années." },
      { title: "Tailler hors nidification", body: "Éviter de tailler au printemps, quand les oiseaux nichent." },
    ],
    mistakes: ["Une seule espèce sur 30 mètres", "Planter trop près de la limite"], sources: [SRC.codeCivil, SRC.ofb] }),
];
