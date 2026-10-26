/**
 * Pages légales : BROUILLONS à faire relire par un juriste avant la mise en ligne commerciale.
 * Les éléments entre crochets doivent être complétés (identité de l'éditeur, statut, adresse…).
 */
export interface LegalDoc { slug: string; title: string; updated: string; sections: { h: string; p: string[] }[] }

const ED = "[Nom et prénom ou dénomination sociale de l'éditeur]";
const ADDR = "[Adresse postale de l'éditeur]";
const SIRET = "[Numéro SIRET, une fois l'activité déclarée]";
const MAIL = "[adresse e-mail de contact]";
const UPDATED = "26 octobre 2026";

export const LEGAL: LegalDoc[] = [
  { slug: "mentions-legales", title: "Mentions légales", updated: UPDATED, sections: [
    { h: "Éditeur du site", p: [`${ED}, ${ADDR}. ${SIRET}. Contact : ${MAIL}.`, "Directeur de la publication : [nom]."] },
    { h: "Hébergement", p: ["Site : Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis (réseau mondial, dont des centres en Europe).", "Base de données et fichiers : Supabase Inc. (hébergement dans l'Union européenne, région choisie à la création du projet)."] },
    { h: "Propriété intellectuelle", p: ["Les textes, la structure et les illustrations dessinées du site sont protégés. Les photographies affichées dans la galerie restent la propriété de leurs auteurs et sont utilisées selon leur licence (Unsplash, Pexels, Creative Commons), avec leur crédit.", "Les noms de designers, d'éditeurs, de marques et de lieux sont cités à titre informatif. Pièce Rêvée n'est ni affilié à ces marques ni sponsorisé par elles, sauf mention « sponsorisé »."] },
    { h: "Images générées par intelligence artificielle", p: ["Les rendus de projet sont générés par intelligence artificielle et portent la mention « Image générée par IA ». Ils illustrent une proposition et ne constituent ni un plan technique ni un engagement sur le résultat réel."] },
  ] },
  { slug: "cgu", title: "Conditions générales d'utilisation", updated: UPDATED, sections: [
    { h: "Objet", p: ["Les présentes conditions encadrent l'utilisation de Pièce Rêvée : galerie, bibliothèque éditoriale, études d'aménagement, rendus, conseillère IA « Camille », moodboard et partage de projets."] },
    { h: "Compte", p: ["La création d'un compte est gratuite. Vous êtes responsable de la confidentialité de votre accès. Vous pouvez exporter vos données et supprimer votre compte à tout moment depuis la page « Compte »."] },
    { h: "Vos photos", p: ["Vous ne déposez que des photos dont vous détenez les droits et qui ne montrent pas de personnes identifiables sans leur accord. Vos photos servent uniquement à réaliser vos études et rendus. Elles ne sont jamais utilisées pour entraîner un modèle d'intelligence artificielle sans votre consentement explicite et séparé. Elles sont supprimées automatiquement après la durée indiquée dans la politique de confidentialité."] },
    { h: "Nature des conseils", p: ["Les études, rendus et réponses de Camille sont des propositions d'aménagement générées en partie par intelligence artificielle, à titre indicatif. Ils ne remplacent pas l'avis d'un professionnel pour tout ce qui touche à la structure du bâtiment, à l'électricité, au gaz, à la sécurité ou aux autorisations d'urbanisme. Vérifiez toujours dimensions, prix et disponibilité avant d'acheter."] },
    { h: "Produits et liens affiliés", p: ["Les produits affichés proviennent des catalogues des enseignes partenaires, avec la date de mise à jour du prix. Certains liens sont affiliés : Pièce Rêvée peut percevoir une commission, sans surcoût pour vous. Les contenus sponsorisés sont toujours signalés. La vente est conclue directement avec l'enseigne, selon ses propres conditions."] },
    { h: "Usages interdits", p: ["Il est interdit d'utiliser le service pour produire des contenus illicites, trompeurs ou portant atteinte aux droits de tiers, d'automatiser des requêtes en masse, ou de tenter de contourner les limites techniques et les quotas."] },
    { h: "Partage public", p: ["Un projet rendu public est visible par toute personne disposant du lien. Vous pouvez le rendre privé à tout moment. Nous pouvons retirer un projet public signalé comme inapproprié."] },
    { h: "Responsabilité", p: ["Le service est fourni avec soin mais sans garantie de disponibilité continue. Notre responsabilité ne peut être engagée pour des travaux réalisés sur la base des propositions sans vérification par un professionnel lorsque celle-ci est recommandée."] },
    { h: "Droit applicable", p: ["Droit français. En cas de litige, vous pouvez recourir gratuitement à un médiateur de la consommation : [nom et coordonnées du médiateur, à désigner]."] },
  ] },
  { slug: "cgv", title: "Conditions générales de vente", updated: UPDATED, sections: [
    { h: "Vendeur", p: [`${ED}, ${ADDR}. ${SIRET}. Contact : ${MAIL}.`] },
    { h: "Offres et prix", p: ["Les offres (Pass Projet, Plus mensuel ou annuel, Crédits, Pro, Pro Agence) et leurs quotas sont décrits sur la page Tarifs. Les prix sont indiqués en euros toutes taxes comprises. [À vérifier selon le statut : mention « TVA non applicable, art. 293 B du CGI » en franchise de TVA.]"] },
    { h: "Paiement", p: ["Le paiement est effectué par carte bancaire via Stripe, prestataire de paiement sécurisé. Aucune donnée bancaire n'est conservée par Pièce Rêvée. Une facture est disponible dans votre compte."] },
    { h: "Abonnements", p: ["Les abonnements Plus et Pro sont reconduits automatiquement à chaque échéance jusqu'à résiliation. La résiliation se fait en un clic depuis le portail de facturation ; l'accès reste ouvert jusqu'à la fin de la période payée. L'essai gratuit de 7 jours de l'offre Plus peut être annulé sans frais avant son terme."] },
    { h: "Droit de rétractation", p: ["Vous disposez de 14 jours à compter de l'achat pour vous rétracter. Toutefois, conformément à l'article L221-28 du Code de la consommation, ce droit ne peut être exercé pour un contenu numérique fourni sur un support immatériel dont l'exécution a commencé avec votre accord préalable exprès et votre renoncement exprès à ce droit. Au moment du paiement, il vous est demandé si vous souhaitez un accès immédiat : si vous l'acceptez, vous reconnaissez perdre votre droit de rétractation pour les études et rendus déjà générés.", "Pour vous rétracter lorsque ce droit s'applique, écrivez à " + MAIL + " ou utilisez le formulaire de rétractation [lien à ajouter]."] },
    { h: "Garanties", p: ["Vous bénéficiez de la garantie légale de conformité des contenus et services numériques (articles L224-25-12 et suivants du Code de la consommation)."] },
    { h: "Médiation", p: ["[Nom et coordonnées du médiateur de la consommation à désigner.] Plateforme européenne de règlement des litiges : ec.europa.eu/consumers/odr."] },
  ] },
  { slug: "confidentialite", title: "Politique de confidentialité", updated: UPDATED, sections: [
    { h: "Responsable du traitement", p: [`${ED}, ${ADDR}. Contact pour vos données : ${MAIL}.`] },
    { h: "Données traitées et finalités", p: [
      "Compte : adresse e-mail, nom éventuel, profil de goûts, préférences. Base légale : exécution du contrat.",
      "Projets : photos de vos pièces, descriptions, études, rendus, moodboard. Base légale : exécution du contrat. Les métadonnées de localisation (EXIF/GPS) sont supprimées à l'envoi.",
      "Conversations avec Camille : messages et résumé de mémoire, consultables et effaçables par vous. Base légale : exécution du contrat.",
      "Paiement : géré par Stripe ; nous conservons l'historique de vos achats et factures. Base légale : contrat et obligations comptables.",
      "Mesure d'audience : uniquement si vous l'acceptez (PostHog, hébergé dans l'Union européenne). Base légale : consentement.",
      "Clics sur les liens produits : identifiant du produit et date, sans adresse IP en clair, pour le suivi de l'affiliation. Base légale : intérêt légitime.",
    ] },
    { h: "Durées de conservation", p: ["Photos de projet : supprimées automatiquement après [12] mois sans activité (réglable dans votre compte). Compte : jusqu'à sa suppression, puis 30 jours de sauvegarde. Factures : 10 ans (obligation légale). Journaux techniques : 12 mois au plus."] },
    { h: "Intelligence artificielle", p: ["Vos photos et messages sont transmis à nos fournisseurs d'IA (Anthropic pour l'analyse et la conversation, un fournisseur de génération d'images pour les rendus) uniquement pour produire le résultat demandé, dans le cadre de contrats de sous-traitance. Ils ne sont pas utilisés pour entraîner des modèles. Nous ne les utilisons jamais pour entraîner un modèle sans votre consentement explicite et séparé."] },
    { h: "Sous-traitants", p: ["Supabase (base de données, stockage, authentification, UE) ; Cloudflare (hébergement et sécurité) ; Anthropic (IA, États-Unis, clauses contractuelles types) ; fournisseur de rendus [à préciser] ; Stripe (paiement) ; Resend (e-mails) ; Sentry (suivi des erreurs) ; PostHog UE (audience, avec consentement). La liste à jour et leurs accords de traitement figurent dans le registre des traitements."] },
    { h: "Vos droits", p: ["Accès, rectification, effacement, portabilité, limitation, opposition, et retrait du consentement à tout moment. Export et suppression de compte en un clic depuis la page « Compte ». Pour toute demande : " + MAIL + ". Vous pouvez saisir la CNIL (cnil.fr)."] },
  ] },
  { slug: "cookies", title: "Cookies et traceurs", updated: UPDATED, sections: [
    { h: "Ce que nous utilisons", p: ["Strictement nécessaires (sans consentement) : session de connexion, mémorisation de votre choix de cookies, thème clair ou sombre, moodboard et profil de goûts enregistrés sur votre appareil.", "Mesure d'audience (avec consentement) : PostHog, hébergé dans l'Union européenne, sans enregistrement de session. Aucun cookie publicitaire, aucun traceur de réseau social."] },
    { h: "Votre choix", p: ["Refuser est aussi simple qu'accepter, dès le bandeau. Aucun traceur soumis à consentement n'est déposé avant votre accord. Vous pouvez changer d'avis à tout moment en effaçant les données du site dans votre navigateur ; le bandeau réapparaît alors. Votre choix est conservé 6 mois."] },
  ] },
  { slug: "affiliation", title: "Liens affiliés et contenus sponsorisés", updated: UPDATED, sections: [
    { h: "Comment nous sommes financés", p: ["Pièce Rêvée vit des abonnements, du Pass Projet et des crédits. Une partie des liens vers les enseignes sont des liens affiliés : si vous achetez après avoir cliqué, l'enseigne nous verse une commission. Le prix pour vous est le même."] },
    { h: "Indépendance", p: ["Les produits proposés dans une étude sont choisis par correspondance avec vos besoins (style, dimensions, budget), pas selon la commission. Quand aucun produit du catalogue ne convient, nous l'indiquons et donnons les critères de recherche plutôt que de proposer un produit inadapté."] },
    { h: "Sponsorisé", p: ["Une marque peut payer pour être mise en avant. Ces emplacements portent toujours la mention « sponsorisé » et ne sont jamais mélangés aux recommandations sans cette mention."] },
    { h: "Prix", p: ["Les prix proviennent des catalogues des enseignes, avec leur date de mise à jour. Ils sont indicatifs : le prix applicable est celui affiché par l'enseigne au moment de l'achat."] },
  ] },
];
