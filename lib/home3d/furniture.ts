import * as THREE from "three";
import { rng, hashStr } from "@/lib/draw";
import { CATALOG, type Item } from "./plan";

/** Fabrique de matériaux fournie par le moteur (textures mises en cache). */
export interface Mats {
  fabric(id: string | undefined, hex: string): THREE.Material;
  struct(id: string | undefined): THREE.Material;
  paint(hex: string, rough?: number): THREE.Material;
  std(hex: string, rough: number, metal?: number, emissive?: string): THREE.Material;
  glass(): THREE.Material;
  mirror(): THREE.Material;
  art(hex: string, seed: string): THREE.Material;
}

type G = THREE.Group;
const box = (g: G, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); mesh.position.set(x, y, z); g.add(mesh); return mesh;
};
const cyl = (g: G, rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 24) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); mesh.position.set(x, y, z); g.add(mesh); return mesh;
};
const sphere = (g: G, r: number, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, detail = 1) => {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), m); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); g.add(mesh); return mesh;
};
/** Quatre pieds aux coins d'un rectangle. */
const legs = (g: G, w: number, d: number, h: number, r: number, m: THREE.Material, inset = 0.05) => {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, r, r * 0.8, h, m, sx * (w / 2 - inset), h / 2, sz * (d / 2 - inset), 10);
};
const WHITE = "#F4F2EE";
const DARK = "#1E1F21";

type Builder = (g: G, it: Item, M: Mats, color: string) => void;

const B: Record<Item["type"], Builder> = {
  canape(g, it, M, color) {
    const f = M.fabric(it.fabric ?? CATALOG.canape.fabric, color), s = M.struct(it.structure ?? CATALOG.canape.structure);
    const W = it.variant === "2 places" ? 1.6 : it.variant === "D'angle" ? 2.6 : 2.1, D = 0.92;
    legs(g, W - 0.1, D - 0.1, 0.1, 0.022, s);
    box(g, W, 0.3, D, f, 0, 0.25, 0);
    const seats = it.variant === "2 places" ? 2 : 3, sw = (W - 0.36) / seats;
    for (let i = 0; i < seats; i++) box(g, sw - 0.02, 0.14, D - 0.24, f, -W / 2 + 0.18 + sw / 2 + i * sw, 0.47, 0.08);
    box(g, W - 0.36, 0.46, 0.22, f, 0, 0.62, -D / 2 + 0.11);
    for (let i = 0; i < seats; i++) { const c = box(g, sw - 0.06, 0.38, 0.14, f, -W / 2 + 0.18 + sw / 2 + i * sw, 0.66, -D / 2 + 0.28); c.rotation.x = -0.12; }
    for (const sx of [-1, 1]) box(g, 0.18, 0.62, D, f, sx * (W / 2 - 0.09), 0.41, 0);
    if (it.variant === "D'angle") {
      const L = 1.65;
      box(g, 0.9, 0.3, L - D, f, W / 2 - 0.45 - 0.18, 0.25, D / 2 + (L - D) / 2);
      box(g, 0.86, 0.14, L - D, f, W / 2 - 0.45 - 0.18, 0.47, D / 2 + (L - D) / 2);
      box(g, 0.18, 0.62, L - D, f, W / 2 - 0.09, 0.41, D / 2 + (L - D) / 2);
    }
  },
  fauteuil(g, it, M, color) {
    const f = M.fabric(it.fabric ?? CATALOG.fauteuil.fabric, color), s = M.struct(it.structure ?? CATALOG.fauteuil.structure);
    legs(g, 0.7, 0.7, 0.16, 0.02, s);
    box(g, 0.78, 0.26, 0.78, f, 0, 0.29, 0);
    box(g, 0.56, 0.12, 0.6, f, 0, 0.48, 0.06);
    const back = box(g, 0.78, 0.55, 0.16, f, 0, 0.7, -0.31); back.rotation.x = -0.15;
    for (const sx of [-1, 1]) box(g, 0.12, 0.3, 0.7, f, sx * 0.33, 0.55, 0.02);
  },
  "table-basse"(g, it, M) {
    const s = M.struct(it.structure ?? CATALOG["table-basse"].structure);
    if (it.variant === "Ronde") { cyl(g, 0.42, 0.42, 0.05, s, 0, 0.355, 0, 40); cyl(g, 0.24, 0.26, 0.33, s, 0, 0.165, 0, 32); }
    else { box(g, 1.1, 0.05, 0.6, s, 0, 0.355, 0); box(g, 0.2, 0.33, 0.5, s, -0.38, 0.165, 0); box(g, 0.2, 0.33, 0.5, s, 0.38, 0.165, 0); }
  },
  "meuble-tv"(g, it, M) {
    const s = M.struct(it.structure ?? CATALOG["meuble-tv"].structure), dark = M.std(DARK, 0.4);
    legs(g, 1.5, 0.34, 0.08, 0.015, M.std(DARK, 0.5));
    box(g, 1.6, 0.4, 0.4, s, 0, 0.28, 0);
    for (const x of [-0.4, 0, 0.4]) box(g, 0.004, 0.36, 0.004, dark, x, 0.28, 0.201);
    if (it.variant !== "Sans écran") {
      box(g, 0.25, 0.03, 0.18, dark, 0, 0.495, -0.05); box(g, 0.05, 0.12, 0.03, dark, 0, 0.56, -0.08);
      box(g, 1.23, 0.71, 0.035, dark, 0, 0.95, -0.08);
      box(g, 1.19, 0.67, 0.005, M.std("#0B0D10", 0.12, 0.2), 0, 0.95, -0.06);
    }
  },
  table(g, it, M) {
    const s = M.struct(it.structure ?? CATALOG.table.structure);
    if (it.variant === "Ronde") { cyl(g, 0.55, 0.55, 0.04, s, 0, 0.73, 0, 48); cyl(g, 0.06, 0.08, 0.7, s, 0, 0.36, 0); cyl(g, 0.3, 0.32, 0.03, s, 0, 0.015, 0, 32); return; }
    const W = it.variant === "6 personnes" ? 1.8 : 1.4, D = it.variant === "6 personnes" ? 0.9 : 0.85;
    box(g, W, 0.04, D, s, 0, 0.73, 0);
    legs(g, W, D, 0.71, 0.03, s, 0.08);
  },
  chaise(g, it, M, color) {
    const f = M.fabric(it.fabric ?? CATALOG.chaise.fabric, color), s = M.struct(it.structure ?? CATALOG.chaise.structure);
    legs(g, 0.42, 0.42, 0.43, 0.016, s, 0.03);
    box(g, 0.44, 0.03, 0.44, s, 0, 0.445, 0);
    box(g, 0.42, 0.05, 0.42, f, 0, 0.485, 0.005);
    for (const sx of [-1, 1]) box(g, 0.025, 0.42, 0.025, s, sx * 0.19, 0.67, -0.2);
    box(g, 0.42, 0.14, 0.025, s, 0, 0.8, -0.205);
  },
  tabouret(g, it, M) {
    const s = M.struct(it.structure ?? CATALOG.tabouret.structure);
    cyl(g, 0.18, 0.17, 0.05, s, 0, 0.65, 0, 28);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, l = cyl(g, 0.013, 0.013, 0.64, s, Math.cos(a) * 0.13, 0.32, Math.sin(a) * 0.13, 8); l.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.008, 6, 24), M.std(DARK, 0.4, 0.6)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.25; g.add(ring);
  },
  lit(g, it, M, color) {
    const f = M.fabric(it.fabric ?? CATALOG.lit.fabric, color), s = M.struct(it.structure ?? CATALOG.lit.structure);
    const W = it.variant === "140 × 190" ? 1.4 : it.variant === "180 × 200" ? 1.8 : 1.6, L = it.variant === "140 × 190" ? 1.9 : 2.0;
    legs(g, W, L, 0.12, 0.03, s, 0.08);
    box(g, W + 0.06, 0.24, L + 0.04, s, 0, 0.24, 0.02);
    box(g, W, 0.2, L, M.std(WHITE, 0.9), 0, 0.46, 0.02);
    box(g, W + 0.04, 0.09, L * 0.68, M.std("#ECE7DE", 0.95), 0, 0.6, L * 0.17);
    box(g, W + 0.08, 0.025, 0.5, f, 0, 0.66, L / 2 - 0.3);
    for (const sx of [-1, 1]) { const p = box(g, W / 2 - 0.12, 0.13, 0.36, M.std(WHITE, 0.95), sx * (W / 4), 0.63, -L / 2 + 0.28); p.rotation.x = -0.25; }
    box(g, W + 0.14, 1.1, 0.1, f, 0, 0.55, -L / 2 - 0.04);
  },
  chevet(g, it, M) {
    const s = M.struct(it.structure ?? CATALOG.chevet.structure);
    legs(g, 0.4, 0.36, 0.14, 0.012, s, 0.03);
    box(g, 0.45, 0.36, 0.4, s, 0, 0.32, 0);
    box(g, 0.38, 0.004, 0.004, M.std(DARK, 0.5), 0, 0.36, 0.201);
    cyl(g, 0.06, 0.07, 0.2, M.std("#D9CBB4", 0.6), 0.08, 0.6, -0.05, 16);
    cyl(g, 0.09, 0.12, 0.16, M.std("#F6EBD6", 0.9, 0, "#FFD9A0"), 0.08, 0.77, -0.05, 24);
  },
  bureau(g, it, M) {
    const s = M.struct(it.structure ?? CATALOG.bureau.structure), dark = M.std(DARK, 0.5);
    box(g, 1.2, 0.03, 0.6, s, 0, 0.745, 0);
    legs(g, 1.2, 0.6, 0.73, 0.016, M.std(DARK, 0.4, 0.6), 0.05);
    box(g, 0.4, 0.14, 0.5, s, 0.38, 0.66, 0);
    box(g, 0.36, 0.004, 0.004, dark, 0.38, 0.66, 0.251);
    cyl(g, 0.08, 0.09, 0.02, dark, -0.4, 0.77, -0.15, 20);
    const arm = cyl(g, 0.008, 0.008, 0.45, dark, -0.4, 0.98, -0.15, 8); arm.rotation.z = 0.25;
    cyl(g, 0.05, 0.09, 0.12, M.std("#E9E2D3", 0.8, 0, "#FFE2B0"), -0.33, 1.18, -0.1, 20);
  },
  armoire(g, it, M, color) {
    const p = M.paint(color, 0.6), s = M.struct(it.structure ?? CATALOG.armoire.structure), dark = M.std(DARK, 0.6);
    box(g, 1.2, 0.08, 0.56, dark, 0, 0.04, -0.02);
    box(g, 1.2, 2.12, 0.6, p, 0, 1.14, 0);
    box(g, 0.004, 2.0, 0.004, dark, 0, 1.14, 0.301);
    for (const sx of [-1, 1]) box(g, 0.02, 0.35, 0.025, s, sx * 0.05, 1.15, 0.31);
  },
  commode(g, it, M, color) {
    const p = M.paint(color, 0.6), s = M.struct(it.structure ?? CATALOG.commode.structure), dark = M.std(DARK, 0.6);
    legs(g, 0.95, 0.45, 0.15, 0.015, s, 0.04);
    box(g, 1.0, 0.7, 0.5, p, 0, 0.5, 0);
    for (const y of [0.38, 0.6]) box(g, 0.96, 0.004, 0.004, dark, 0, y, 0.251);
    for (const y of [0.27, 0.49, 0.71]) box(g, 0.18, 0.02, 0.02, s, 0, y, 0.26);
  },
  bibliotheque(g, it, M) {
    const s = M.struct(it.structure ?? CATALOG.bibliotheque.structure);
    const W = 1.2, H = 2.0, D = 0.35;
    for (const sx of [-1, 1]) box(g, 0.025, H, D, s, sx * (W / 2 - 0.0125), H / 2, 0);
    box(g, W, H, 0.012, s, 0, H / 2, -D / 2 + 0.006);
    const R = rng(hashStr(it.id)), cols = ["#7A1E2A", "#2F4A3D", "#D9CBB4", "#3B3D3F", "#C0714F", "#E9E2D3", "#24545C", "#C99A2E"];
    for (let i = 0; i <= 5; i++) {
      const y = 0.04 + i * (H - 0.06) / 5; box(g, W - 0.05, 0.025, D, s, 0, y, 0);
      if (i === 5) continue;
      let x = -W / 2 + 0.05;
      while (x < W / 2 - 0.12) {
        if (R() < 0.18) { x += 0.12 + R() * 0.15; continue; }
        const bw = 0.025 + R() * 0.03, bh = 0.18 + R() * 0.12;
        box(g, bw, bh, 0.2 + R() * 0.05, M.std(cols[Math.floor(R() * cols.length)]!, 0.8), x + bw / 2, y + 0.0125 + bh / 2, 0.02);
        x += bw + 0.003;
      }
    }
  },
  console(g, it, M) {
    const s = M.struct(it.structure ?? CATALOG.console.structure);
    box(g, 1.0, 0.035, 0.35, s, 0, 0.8, 0);
    box(g, 0.94, 0.025, 0.3, s, 0, 0.18, 0);
    legs(g, 1.0, 0.35, 0.79, 0.014, s, 0.03);
    sphere(g, 0.09, M.std("#C9A97E", 0.6), 0.3, 0.9, 0, 1, 1.1, 1, 2);
    cyl(g, 0.12, 0.12, 0.03, M.std(DARK, 0.4, 0.4), -0.25, 0.83, 0, 24);
  },
  "porte-manteau"(g, it, M) {
    const s = M.struct(it.structure ?? CATALOG["porte-manteau"].structure);
    box(g, 0.9, 0.08, 0.025, s, 0, 1.65, -0.1);
    for (let i = 0; i < 5; i++) cyl(g, 0.012, 0.012, 0.09, s, -0.36 + i * 0.18, 1.64, -0.05, 8).rotation.x = Math.PI / 2;
    box(g, 0.4, 0.75, 0.12, M.std("#5B6E7E", 0.95), -0.18, 1.25, -0.02);
    box(g, 0.36, 0.6, 0.1, M.std("#B9874F", 0.95), 0.18, 1.32, -0.02);
  },
  banc(g, it, M, color) {
    const s = M.struct(it.structure ?? CATALOG.banc.structure), f = M.fabric(it.fabric ?? CATALOG.banc.fabric, color);
    legs(g, 1.0, 0.36, 0.4, 0.02, s, 0.05);
    box(g, 1.0, 0.04, 0.38, s, 0, 0.41, 0);
    box(g, 0.96, 0.06, 0.34, f, 0, 0.46, 0);
  },
  cuisine(g, it, M, color) {
    const L = it.variant === "3 m" ? 3.0 : 2.4, front = M.paint(color, 0.45), top = M.struct(it.structure ?? CATALOG.cuisine.structure), dark = M.std(DARK, 0.5);
    box(g, L, 0.1, 0.52, dark, 0, 0.05, -0.04);
    box(g, L, 0.78, 0.58, front, 0, 0.49, 0);
    const n = Math.round(L / 0.6);
    for (let i = 1; i < n; i++) box(g, 0.004, 0.74, 0.004, dark, -L / 2 + i * (L / n), 0.49, 0.291);
    box(g, L, 0.004, 0.004, dark, 0, 0.7, 0.291);
    box(g, L + 0.02, 0.04, 0.62, top, 0, 0.9, 0.01);
    box(g, L, 0.55, 0.015, top, 0, 1.195, -0.29);
    box(g, L, 0.7, 0.35, front, 0, 1.82, -0.125);
    for (let i = 1; i < n; i++) box(g, 0.004, 0.66, 0.004, dark, -L / 2 + i * (L / n), 1.82, 0.051);
    box(g, 0.5, 0.012, 0.4, M.std("#9DA3A6", 0.25, 0.9), -L / 4, 0.917, 0.02);
    cyl(g, 0.012, 0.012, 0.28, M.std("#C9CCCB", 0.2, 1), -L / 4, 1.06, -0.2, 10);
    box(g, 0.02, 0.02, 0.18, M.std("#C9CCCB", 0.2, 1), -L / 4, 1.2, -0.12);
    box(g, 0.6, 0.008, 0.52, M.std("#0E0F11", 0.08, 0.1), L / 4, 0.924, 0.01);
    for (const [dx, dz, r] of [[-0.14, -0.12, 0.09], [0.14, -0.12, 0.07], [-0.14, 0.12, 0.07], [0.14, 0.12, 0.09]] as const) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.004, 4, 32), M.std("#55585C", 0.4)); ring.rotation.x = Math.PI / 2; ring.position.set(L / 4 + dx, 0.93, dz); g.add(ring);
    }
  },
  ilot(g, it, M, color) {
    const front = M.paint(color, 0.45), top = M.struct(it.structure ?? CATALOG.ilot.structure);
    box(g, 1.7, 0.1, 0.8, M.std(DARK, 0.5), 0, 0.05, 0);
    box(g, 1.8, 0.78, 0.9, front, 0, 0.49, 0);
    box(g, 1.95, 0.04, 1.05, top, 0, 0.9, -0.05);
  },
  refrigerateur(g, it, M, color) {
    const p = M.std(color, 0.3, 0.5), h = M.std("#B9BDBF", 0.2, 1);
    box(g, 0.6, 1.85, 0.65, p, 0, 0.925, 0);
    box(g, 0.58, 0.004, 0.004, M.std(DARK, 0.5), 0, 1.15, 0.326);
    box(g, 0.02, 0.5, 0.03, h, -0.24, 1.45, 0.34); box(g, 0.02, 0.3, 0.03, h, -0.24, 0.95, 0.34);
  },
  "meuble-vasque"(g, it, M, color) {
    const p = M.paint(color, 0.5), top = M.struct(it.structure ?? CATALOG["meuble-vasque"].structure);
    box(g, 0.8, 0.48, 0.46, p, 0, 0.56, 0);
    box(g, 0.004, 0.44, 0.004, M.std(DARK, 0.5), 0, 0.56, 0.231);
    box(g, 0.82, 0.03, 0.48, top, 0, 0.815, 0);
    box(g, 0.46, 0.12, 0.36, M.std(WHITE, 0.15), 0, 0.89, 0.02);
    cyl(g, 0.012, 0.012, 0.22, M.std("#C9CCCB", 0.2, 1), 0, 0.94, -0.19, 10);
  },
  miroir(g, it, M) {
    const fr = M.struct(it.structure ?? CATALOG.miroir.structure), y = CATALOG.miroir.mount!;
    if (it.variant === "Rectangulaire") { box(g, 0.72, 0.92, 0.02, fr, 0, y, 0); box(g, 0.68, 0.88, 0.022, M.mirror(), 0, y, 0.002); }
    else {
      const m = cyl(g, 0.33, 0.33, 0.02, M.mirror(), 0, y, 0.004, 48); m.rotation.x = Math.PI / 2;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.015, 8, 48), fr); ring.position.set(0, y, 0.006); g.add(ring);
    }
  },
  baignoire(g, _it, M) {
    const w = M.std(WHITE, 0.15);
    box(g, 1.7, 0.56, 0.75, w, 0, 0.28, 0);
    box(g, 1.56, 0.02, 0.6, M.std("#E7EDEE", 0.1), 0, 0.555, 0);
    box(g, 1.5, 0.015, 0.54, M.std("#BFD4D8", 0.05), 0, 0.5, 0);
    cyl(g, 0.015, 0.015, 0.2, M.std("#C9CCCB", 0.2, 1), 0.78, 0.66, 0, 10);
  },
  douche(g, _it, M) {
    box(g, 0.9, 0.03, 0.9, M.std(WHITE, 0.4), 0, 0.015, 0);
    box(g, 0.01, 2.0, 0.9, M.glass(), 0.45, 1.03, 0);
    box(g, 0.02, 0.02, 0.9, M.std(DARK, 0.4, 0.6), 0.45, 2.03, 0);
    cyl(g, 0.012, 0.012, 1.1, M.std("#C9CCCB", 0.2, 1), -0.35, 1.5, -0.42, 10);
    cyl(g, 0.11, 0.11, 0.015, M.std("#C9CCCB", 0.2, 1), -0.35, 2.05, -0.3, 24);
  },
  wc(g, _it, M) {
    const w = M.std(WHITE, 0.15);
    box(g, 0.5, 1.1, 0.14, M.std("#E5E1DA", 0.6), 0, 0.55, -0.22);
    const bowl = cyl(g, 0.19, 0.16, 0.32, w, 0, 0.42, 0.04, 28); bowl.scale.z = 1.35;
    const lid = cyl(g, 0.19, 0.19, 0.025, w, 0, 0.59, 0.04, 28); lid.scale.z = 1.35;
    box(g, 0.16, 0.08, 0.01, M.std("#C9CCCB", 0.2, 1), 0, 0.95, -0.148);
  },
  tapis(g, it, M, color) {
    const f = M.fabric(it.fabric ?? CATALOG.tapis.fabric, color);
    if (it.variant === "Rond") { cyl(g, 1.0, 1.0, 0.014, f, 0, 0.008, 0, 64); return; }
    const [W, D] = it.variant === "160 × 230" ? [2.3, 1.6] : [3.0, 2.0];
    box(g, W, 0.014, D, f, 0, 0.008, 0);
  },
  lampadaire(g, it, M, color) {
    const s = M.struct(it.structure ?? CATALOG.lampadaire.structure);
    cyl(g, 0.16, 0.17, 0.03, s, 0, 0.015, 0, 32);
    cyl(g, 0.012, 0.012, 1.45, s, 0, 0.75, 0, 10);
    cyl(g, 0.14, 0.22, 0.3, M.std(color, 0.9, 0, "#FFD9A0"), 0, 1.55, 0, 32);
  },
  suspension(g, it, M, color) {
    const s = M.struct(it.structure ?? CATALOG.suspension.structure), y = CATALOG.suspension.mount!;
    cyl(g, 0.004, 0.004, 2.6 - y, M.std(DARK, 0.5), 0, y + (2.6 - y) / 2, 0, 6);
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.std(color, 0.6)); shade.material.side = THREE.DoubleSide; shade.position.y = y - 0.15; g.add(shade);
    cyl(g, 0.03, 0.03, 0.05, s, 0, y + 0.07, 0, 12);
    sphere(g, 0.05, M.std("#FFF4E0", 0.5, 0, "#FFE2B0"), 0, y - 0.1, 0);
  },
  plante(g, it, M, color) {
    const pot = M.std(color, 0.85), R = rng(hashStr(it.id));
    const leafA = M.std("#4F6B3E", 0.8), leafB = M.std("#6C8A4F", 0.8), olive = M.std("#8A9A6E", 0.85), trunk = M.std("#6A5A45", 0.9), soil = M.std("#3D2F24", 1);
    if (it.variant === "Olivier") {
      cyl(g, 0.32, 0.25, 0.5, pot, 0, 0.25, 0, 28); cyl(g, 0.3, 0.3, 0.02, soil, 0, 0.49, 0, 24);
      const t = cyl(g, 0.05, 0.07, 1.1, trunk, 0, 1.0, 0, 8); t.rotation.z = 0.08;
      for (let i = 0; i < 9; i++) sphere(g, 0.32 + R() * 0.15, olive, (R() - 0.5) * 0.8, 1.55 + R() * 0.55, (R() - 0.5) * 0.8, 1, 0.75, 1);
      return;
    }
    const big = it.variant !== "Petite", pr = big ? 0.2 : 0.13, ph = big ? 0.4 : 0.22;
    cyl(g, pr, pr * 0.8, ph, pot, 0, ph / 2, 0, 24); cyl(g, pr * 0.95, pr * 0.95, 0.02, soil, 0, ph - 0.01, 0, 20);
    const n = big ? 11 : 6;
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, r = R() * (big ? 0.28 : 0.12), y = ph + (big ? 0.3 + R() * 0.9 : 0.08 + R() * 0.2);
      const leaf = sphere(g, big ? 0.18 + R() * 0.1 : 0.1 + R() * 0.05, R() < 0.5 ? leafA : leafB, Math.cos(a) * r, y, Math.sin(a) * r, 0.6, 1.4, 0.35);
      leaf.rotation.set((R() - 0.5) * 1.2, a, (R() - 0.5) * 0.8);
    }
    if (big) cyl(g, 0.012, 0.015, 0.9, trunk, 0, ph + 0.45, 0, 6);
  },
  tableau(g, it, M, color) {
    const fr = M.struct(it.structure ?? CATALOG.tableau.structure), y = CATALOG.tableau.mount!;
    box(g, 0.84, 0.64, 0.03, fr, 0, y, 0);
    box(g, 0.78, 0.58, 0.032, M.art(color, it.id), 0, y, 0.002);
  },
  "salon-jardin"(g, it, M, color) {
    const s = M.struct(it.structure ?? CATALOG["salon-jardin"].structure), f = M.fabric("m-lin", color);
    box(g, 1.6, 0.04, 0.9, s, 0, 0.73, 0); legs(g, 1.6, 0.9, 0.71, 0.03, s, 0.08);
    for (const [x, z, r] of [[-0.4, -0.75, 0], [0.4, -0.75, 0], [-0.4, 0.75, Math.PI], [0.4, 0.75, Math.PI]] as const) {
      const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = r; g.add(c);
      legs(c, 0.48, 0.48, 0.42, 0.02, s, 0.03); box(c, 0.5, 0.03, 0.5, s, 0, 0.43, 0); box(c, 0.46, 0.06, 0.46, f, 0, 0.47, 0);
      box(c, 0.5, 0.4, 0.03, s, 0, 0.68, -0.24);
    }
  },
  transat(g, it, M, color) {
    const s = M.struct(it.structure ?? CATALOG.transat.structure), f = M.fabric("m-lin", color);
    legs(g, 0.65, 1.85, 0.25, 0.025, s, 0.06);
    box(g, 0.68, 0.06, 1.3, s, 0, 0.28, 0.3);
    box(g, 0.62, 0.07, 1.25, f, 0, 0.345, 0.3);
    const back = new THREE.Group(); back.position.set(0, 0.3, -0.35); back.rotation.x = -0.75; g.add(back);
    box(back, 0.68, 0.05, 0.6, s, 0, 0, -0.3); box(back, 0.62, 0.07, 0.56, f, 0, 0.055, -0.3);
  },
  parasol(g, it, M, color) {
    const s = M.struct(it.structure ?? CATALOG.parasol.structure);
    cyl(g, 0.25, 0.28, 0.08, M.std("#5A5F63", 0.7), 0, 0.04, 0, 24);
    cyl(g, 0.022, 0.022, 2.3, s, 0, 1.2, 0, 10);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.42, 8, 1, true), M.std(color, 0.95)); (top.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide; top.position.y = 2.25; g.add(top);
  },
  jardiniere(g, it, M) {
    const s = M.struct(it.structure ?? CATALOG.jardiniere.structure), R = rng(hashStr(it.id));
    box(g, 1.2, 0.45, 0.42, s, 0, 0.225, 0);
    box(g, 1.14, 0.02, 0.36, M.std("#3D2F24", 1), 0, 0.44, 0);
    const greens = [M.std("#6C8A4F", 0.8), M.std("#8A9A6E", 0.8), M.std("#A98BB8", 0.8)];
    for (let i = 0; i < 9; i++) sphere(g, 0.1 + R() * 0.08, greens[Math.floor(R() * 3)]!, -0.5 + i * 0.125, 0.55 + R() * 0.12, (R() - 0.5) * 0.18, 1, 1.2, 1);
  },
};

/** Construit l'objet 3D d'un élément du plan (origine au sol, face avant vers +z local). */
export function buildItem(it: Item, M: Mats): THREE.Group {
  const g = new THREE.Group();
  const entry = CATALOG[it.type];
  B[it.type](g, it, M, it.color ?? entry.color ?? "#D6C3A3");
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.itemId = it.id; } });
  if (it.type === "tapis") g.traverse((o) => { o.castShadow = false; });
  g.position.set(it.x, 0, it.z);
  g.rotation.y = it.rot;
  g.userData.itemId = it.id;
  return g;
}
