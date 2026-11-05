/** Ce que Camille propose sur chaque page : un conseil d'entrée et des questions adaptées à l'étape. */
export interface GuideStep { key: string; tip: string; questions: string[] }

const STEPS: Array<[RegExp, GuideStep]> = [
  [/^\/showroom/, { key: "showroom", tip: "Choisissez une famille, puis jouez sur les teintes, formats et finitions. Ouvrez un échantillon pour le tourner en 3D, et ajoutez vos préférés à votre planche.", questions: ["Quel zellige pour une cuisine lumineuse ?", "Quelle peinture avec un parquet en chêne ?", "Laiton brossé ou poli pour des poignées ?"] }],
  [/^\/planche/, { key: "planche", tip: "Partez d'un modèle ou d'une image, faites glisser les échantillons, superposez-les, zoomez jusqu'au grain. « Photo réaliste » transforme la planche en vraie photo, et vous pouvez l'appliquer à la photo de votre pièce.", questions: ["Combien de matières mettre sur une planche ?", "Comment équilibrer bois, métal et tissu ?", "Quelle couleur d'accent avec du lin et du chêne ?"] }],
  [/^\/transformer/, { key: "transformer", tip: "Photographiez votre pièce depuis un angle, à hauteur d'yeux, en lumière du jour. Ajoutez trois images qui vous inspirent : je m'occupe de la palette, des matières et du budget.", questions: ["Comment bien photographier ma pièce ?", "Comment choisir mes trois inspirations ?", "Quel budget prévoir pour refaire un salon ?"] }],
  [/^\/concept/, { key: "concept", tip: "Décrivez l'ambiance comme à une amie : la pièce, deux ou trois couleurs, une matière que vous aimez. Je compose ensuite la fiche et ses matières, rôle par rôle.", questions: ["Comment décrire l'ambiance que je veux ?", "Quelles matières vont avec un vert sauge ?"] }],
  [/^\/projet/, { key: "projet", tip: "Je vous accompagne pièce par pièce : plan, zones, matières, éclairage, puis l'ordre des travaux.", questions: ["Dans quel ordre faire les travaux ?", "Comment bien éclairer un salon le soir ?"] }],
  [/^\/(galerie|inspirations)/, { key: "galerie", tip: "Gardez les images qui vous parlent : elles nourrissent vos projets et le parcours « Transformer ».", questions: ["Quel style me correspond ?", "Comment agrandir visuellement une petite pièce ?"] }],
  [/^\/$/, { key: "accueil", tip: "Bonjour, je suis Camille, votre designer d'intérieur virtuelle. Commencez par une photo de votre pièce, une ambiance en une phrase, ou les matières une à une : je vous guide à chaque étape.", questions: ["Par quoi commencer pour refaire mon salon ?", "Quel style me correspond ?", "Comment agrandir visuellement une petite chambre ?"] }],
];
export function guideFor(path: string): GuideStep | null {
  return STEPS.find(([re]) => re.test(path))?.[1] ?? null;
}
export const guideByKey = (key: string | undefined) => STEPS.find(([, s]) => s.key === key)?.[1] ?? null;
