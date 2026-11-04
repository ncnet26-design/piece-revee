/**
 * Élévation d'architecte au trait (vue de face) d'une famille de produits, avec sa cote si l'enseigne la publie.
 * Langage des planches de présentation des architectes d'intérieur : trait fin, cotes, nomenclature.
 */
const D: Record<string, string> = {
  canape: "M30 58 h140 v34 h-140 z M30 58 v-22 a6 6 0 0 1 6-6 h128 a6 6 0 0 1 6 6 v22 M22 62 h14 v30 h-14 z M164 62 h14 v30 h-14 z M38 92 v8 M162 92 v8 M36 74 h128",
  fauteuil: "M62 60 h76 v32 h-76 z M66 60 v-26 a6 6 0 0 1 6-6 h56 a6 6 0 0 1 6 6 v26 M52 62 h14 v30 h-14 z M134 62 h14 v30 h-14 z M60 92 v9 M140 92 v9 M66 75 h68",
  chaise: "M74 20 v80 M74 60 h52 v6 h-52 M126 66 v34 M80 66 v34 M74 20 h10 v40",
  "table-basse": "M28 70 h144 v8 h-144 z M40 78 v22 M160 78 v22 M40 100 h-6 M160 100 h6",
  "table-manger": "M24 38 h152 v7 h-152 z M40 45 v55 M160 45 v55 M100 45 v0",
  lit: "M24 44 v56 M176 64 v36 M24 52 h-0 M24 64 h152 v20 h-152 M30 64 v-8 a4 4 0 0 1 4-4 h40 a4 4 0 0 1 4 4 v8 M24 84 v16 M24 44 h12 v20",
  luminaire: "M100 4 v40 M70 70 q30 -40 60 0 z M70 70 h60 M96 70 a4 4 0 0 0 8 0",
  lampadaire: "M100 100 v-74 a24 24 0 0 1 24 -24 M112 2 l24 0 l8 20 h-40 z M84 100 h32",
  rangement: "M24 40 h152 v52 h-152 z M24 46 h152 M62 46 v46 M100 46 v46 M138 46 v46 M58 66 v6 M96 66 v6 M134 66 v6 M32 92 v8 M168 92 v8",
  tapis: "M30 92 l20 -36 h120 l-20 36 z M36 92 l-4 6 M60 92 l-4 6 M84 92 l-4 6 M108 92 l-4 6 M132 92 l-4 6 M56 74 h96",
  deco: "M92 98 h16 q12 -16 8 -40 q-4 -14 -4 -24 h-24 q0 10 -4 24 q-4 24 8 40 z M88 34 h24",
  rideau: "M24 14 h152 M40 14 v86 M58 14 v86 M76 14 q4 43 -2 86 M124 14 q-4 43 2 86 M142 14 v86 M160 14 v86 M24 10 v8 M176 10 v8",
  "salle-de-bain": "M30 66 h140 v34 M30 66 v34 M70 66 q0 -22 30 -22 q30 0 30 22 M100 44 v-14 h12",
  robinetterie: "M90 100 h20 M100 100 v-56 q0 -18 22 -18 h14 v10 M88 60 h24",
  poignee: "M60 70 h80 M70 70 v-12 M130 70 v-12",
  peinture: "M70 40 h60 v60 h-60 z M70 52 h60 M84 40 v-12 h32 v12",
  sol: "M24 90 h152 M24 90 l20 -40 h112 l20 40 M64 50 l-14 40 M100 50 v40 M136 50 l14 40",
  "lampe-a-poser": "M78 50 l8 -30 h28 l8 30 z M100 50 v38 M84 100 h32 q-4 -12 -16 -12 q-12 0 -16 12",
  applique: "M64 30 v40 M64 50 h22 M86 50 l-6 -18 h28 l-6 18 z M100 50 v0",
  armoire: "M60 6 h80 v94 h-80 z M100 6 v94 M94 50 v8 M106 50 v8 M64 100 v4 M136 100 v4",
  etagere: "M58 6 v98 M142 6 v98 M58 28 h84 M58 52 h84 M58 76 h84 M58 100 h84",
  bureau: "M30 46 h140 v6 h-140 z M36 52 v48 M164 52 v48 M120 52 v22 h44",
  commode: "M50 34 h100 v62 h-100 z M50 54 h100 M50 74 h100 M96 44 h8 M96 64 h8 M96 84 h8 M56 96 v6 M144 96 v6",
  miroir: "M100 8 a34 46 0 1 0 0.1 0 z M100 18 a24 36 0 1 0 0.1 0",
  coussin: "M50 50 q50 -14 100 0 q8 22 0 44 q-50 14 -100 0 q-8 -22 0 -44 z",
  tabouret: "M70 46 h60 v6 h-60 z M78 52 l-6 48 M122 52 l6 48 M76 80 h48",
  pouf: "M54 64 q0 -18 46 -18 q46 0 46 18 v22 q0 14 -46 14 q-46 0 -46 -14 z M54 64 q0 14 46 14 q46 0 46 -14",
};

/** Dessin selon la famille, précisé par le nom (lampe à poser, applique, armoire, étagère, bureau…). */
export function dessinDe(famille: string, nom: string): string {
  const n = nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const regles: Array<[RegExp, string]> = [
    [/lampe (a poser|de table|de chevet|de bureau)|table lamp/, "lampe-a-poser"], [/\bapplique|sconce/, "applique"],
    [/armoire|penderie|dressing/, "armoire"], [/etagere|bibliotheque|shelf|shelving/, "etagere"], [/\bbureau\b|desk/, "bureau"],
    [/commode|chiffonnier|dresser/, "commode"], [/miroir|mirror/, "miroir"], [/coussin|cushion|pillow/, "coussin"],
    [/tabouret|stool/, "tabouret"], [/\bpouf|ottoman/, "pouf"], [/vase|jarre|pot\b/, "deco"],
  ];
  return regles.find(([re]) => re.test(n))?.[1] ?? famille;
}

/** Première cote publiée : « 274 × 128 × 83 cm » → « 274 cm » ; « Ø 30 cm » gardé tel quel. */
const cote = (dims: string | null) => (dims ? (dims.startsWith("Ø") ? dims : `${dims.split("×")[0]!.trim()} cm`) : null);

export function Elevation({ famille, nom = "", dimensions, className = "" }: { famille: string; nom?: string; dimensions: string | null; className?: string }) {
  const c = cote(dimensions);
  const d = D[dessinDe(famille, nom)] ?? D[famille];
  return (
    <svg viewBox="0 0 200 128" className={className} role="img" aria-label={`Élévation au trait${c ? `, largeur ${c}` : ""}`} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path d={d ?? "M50 30 h100 v70 h-100 z"} vectorEffect="non-scaling-stroke" />
      {c && (
        <g strokeWidth=".7">
          <path d="M24 114 h152 M24 110 v8 M176 110 v8" vectorEffect="non-scaling-stroke" />
          <text x="100" y="125" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none" style={{ fontFamily: "var(--f-mono)", letterSpacing: ".04em" }}>{c}</text>
        </g>
      )}
    </svg>
  );
}
