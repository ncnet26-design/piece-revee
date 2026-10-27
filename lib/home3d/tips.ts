import type { ItemType, RoomKind } from "./plan";

/** Astuces de l'équipe : repères d'aménagement courants (ordres de grandeur, à adapter à chaque logement). */
export interface Tip { title: string; text: string; link?: { label: string; href: string } }

export const ROOM_TIPS: Record<RoomKind, Tip[]> = {
  salon: [
    { title: "Laissez circuler", text: "Gardez environ 90 cm pour les passages principaux et au moins 60 cm pour les passages secondaires. Un salon où l'on se faufile paraît toujours plus petit." },
    { title: "Trois sources de lumière", text: "Un éclairage général, une lampe de lecture près du canapé et une lumière d'ambiance basse. Le soir, préférez des ampoules de 2 700 à 3 000 K.", link: { label: "Guide de l'éclairage", href: "/guides/" } },
    { title: "Le tapis relie l'ensemble", text: "Posez au moins les pieds avant du canapé et des fauteuils sur le tapis : le coin salon paraît plus grand et plus cohérent." },
    { title: "Ne bouchez pas la lumière", text: "Évitez les meubles hauts devant les fenêtres ; placez-les sur les murs pleins, perpendiculaires à la source de lumière." },
  ],
  cuisine: [
    { title: "Le triangle d'activité", text: "Évier, plaque et réfrigérateur forment un triangle : ni trop serré, ni trop étiré, sans obstacle au milieu. C'est lui qui fait gagner des pas." },
    { title: "La bonne hauteur de plan", text: "Le plan de travail se règle selon la taille de la personne qui cuisine le plus, souvent entre 85 et 95 cm." },
    { title: "Autour de l'îlot", text: "Prévoyez environ 1 m de passage autour d'un îlot, davantage si deux personnes cuisinent en même temps." },
    { title: "Hotte et sécurité", text: "La hauteur de la hotte au-dessus de la plaque dépend du modèle : suivez la notice du fabricant. Gaz ou électricité : faites intervenir un professionnel qualifié." },
  ],
  chambre: [
    { title: "De l'espace autour du lit", text: "Visez environ 60 cm de chaque côté et au pied du lit pour circuler et faire le lit sans effort." },
    { title: "La tête de lit sur un mur plein", text: "Évitez de placer la tête du lit sous une fenêtre (courants d'air, lumière du matin). Un mur plein rassure et isole." },
    { title: "Devant l'armoire", text: "Des portes battantes demandent environ 90 cm devant elles. S'il manque de place, choisissez des portes coulissantes." },
    { title: "Des couleurs qui apaisent", text: "Les tons sourds (sauge, lin, terre) reposent davantage que les couleurs vives saturées. Peignez un mur d'accent derrière la tête de lit." },
  ],
  sdb: [
    { title: "Électricité : zones réglementées", text: "Autour de la baignoire et de la douche, les prises et luminaires obéissent à des règles de sécurité strictes (norme NF C 15-100). Faites valider par un électricien." },
    { title: "Ventiler, toujours", text: "Une ventilation efficace évite moisissures et peintures qui cloquent. Choisissez une peinture spéciale pièces humides." },
    { title: "Hauteur de la vasque", text: "Un plan de vasque entre 85 et 90 cm est confortable pour la plupart des adultes ; un miroir assez large agrandit la pièce." },
  ],
  entree: [
    { title: "Un miroir pour agrandir", text: "Un miroir face à la lumière ou en biais multiplie la clarté d'une entrée sombre et permet un dernier coup d'œil avant de sortir." },
    { title: "Tout à portée de main", text: "Un banc pour se chausser, des patères à environ 1,60 m et un vide-poches : l'entrée reste rangée sans effort." },
    { title: "Une couleur d'accueil", text: "L'entrée est un bon endroit pour oser une couleur plus soutenue : on n'y reste pas longtemps, elle donne le ton du logement." },
  ],
  exterieur: [
    { title: "Rien d'escaladable au garde-corps", text: "Ne placez ni jardinière ni meuble contre le garde-corps : un enfant pourrait s'en servir pour grimper." },
    { title: "Vérifiez la charge", text: "Grandes jardinières pleines de terre mouillée = beaucoup de poids. En copropriété, renseignez-vous sur la charge admissible du balcon ou de la terrasse." },
    { title: "Des plantes adaptées à l'exposition", text: "Plein sud : plantes méditerranéennes peu gourmandes en eau. Nord : fougères et hostas. Consultez nos fiches plantes.", link: { label: "Fiches plantes", href: "/plantes/" } },
  ],
};

export const ITEM_TIPS: Partial<Record<ItemType, string>> = {
  canape: "Laissez 40 à 45 cm entre le canapé et la table basse : assez pour passer, assez près pour poser un verre.",
  fauteuil: "Orientez le fauteuil vers le canapé pour créer un coin conversation, à moins de 2,5 m pour se parler sans hausser la voix.",
  "table-basse": "Une table basse de la hauteur de l'assise du canapé, ou un peu plus basse, est la plus confortable.",
  "meuble-tv": "Placez le centre de l'écran à hauteur des yeux une fois assis, souvent autour d'un mètre du sol.",
  table: "Comptez environ 60 cm de largeur par convive, et 80 cm derrière chaque chaise pour se lever sans gêner.",
  chaise: "Une assise à environ 45 cm pour une table à 75 cm : c'est le couple le plus courant.",
  tabouret: "Pour un plan à 90 cm, choisissez des tabourets d'environ 65 cm ; pour un bar à 105 cm, plutôt 75 cm.",
  lit: "Un lit plus large que 160 cm dans une chambre de moins de 10 m² réduit vite la circulation : mesurez avant de choisir.",
  chevet: "Un chevet à la hauteur du matelas, ou un peu au-dessus, se révèle le plus pratique.",
  armoire: "Prévoyez environ 90 cm devant des portes battantes ; sinon, optez pour des portes coulissantes.",
  bibliotheque: "Mélangez livres couchés et debout, objets et vides : une bibliothèque respire mieux remplie aux deux tiers.",
  tapis: "Les pieds avant des assises posés sur le tapis : le coin salon se lit comme un tout.",
  lampadaire: "Un lampadaire placé dans un angle éclaire les murs et fait paraître la pièce plus grande.",
  suspension: "Au-dessus d'une table, une suspension se place souvent entre 65 et 75 cm du plateau.",
  plante: "Rapprochez les plantes de la lumière en hiver et éloignez-les des radiateurs.",
  cuisine: "Façades claires et mates dans une petite cuisine ; le plan de travail peut apporter le contraste.",
  ilot: "Un îlot de 90 cm de profondeur permet d'y manger d'un côté et de cuisiner de l'autre.",
  "meuble-vasque": "Un meuble suspendu dégage le sol : la salle de bain paraît plus grande et se nettoie plus vite.",
  miroir: "Un miroir face à une fenêtre double la lumière naturelle de la pièce.",
  tableau: "Accrochez le centre du tableau à environ 1,50 m du sol, la hauteur moyenne du regard.",
  console: "Une console de 30 à 35 cm de profondeur suffit dans une entrée sans gêner le passage.",
  "salon-jardin": "Prévoyez environ 80 cm autour de la table pour reculer les chaises sur la terrasse.",
  transat: "Orientez les transats vers la vue et le soleil de fin de journée.",
  parasol: "Lestez correctement le parasol : le vent le fait vite basculer sur une terrasse en étage.",
  jardiniere: "Une jardinière d'au moins 40 cm de profondeur garde mieux l'humidité en été.",
};
