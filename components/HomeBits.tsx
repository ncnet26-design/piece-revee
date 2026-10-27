"use client";
import { useRouter } from "next/navigation";
import { GALLERY } from "@/content/gallery";
import { STYLES } from "@/content/lookup";
import { BeforeAfter } from "./BeforeAfter";
import { GalleryCard } from "./cards";
import { Scene } from "./Visual";

const JAPANDI = STYLES.find((s) => s.id === "japandi")!;

export function HeroCompare() {
  const spec = { scope: "interieur" as const, space: "Salon", palette: JAPANDI.palette, seed: 424242 };
  return <BeforeAfter before={<Scene spec={{ ...spec, bare: true }} width={800} height={600} label="Salon avant transformation (illustration)" />} after={<Scene spec={spec} width={800} height={600} label="Salon après transformation (illustration)" />} />;
}

export function HomeInspirations() {
  const router = useRouter();
  const picks = GALLERY.filter((_, i) => i % 14 === 0).slice(0, 8);
  return <div className="grid-cards">{picks.map((g) => <GalleryCard key={g.id} item={g} onOpen={(id) => router.push(`/galerie/?g=${id}`)} />)}</div>;
}
