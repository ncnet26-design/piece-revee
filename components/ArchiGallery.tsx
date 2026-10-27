"use client";
import { useMemo, useState } from "react";
import { useSearch } from "@/lib/use-search";
import { ARCHI_PHOTOS, COLLECTIONS } from "@/lib/photos";
import { Photo } from "./Photo";

/** Photos libres de vrais lieux, par type de bien (châteaux, gîtes, lofts…), avec crédits. */
export function ArchiGallery() {
  const params = useSearch();
  const fromUrl = params.get("collection");
  const available = useMemo(() => COLLECTIONS.filter((c) => ARCHI_PHOTOS.some((p) => p.collection === c.id)), []);
  const [sel, setSel] = useState<string | null>(null);
  const current = sel ?? (fromUrl && available.some((c) => c.id === fromUrl) ? fromUrl : available[0]?.id);
  if (!available.length || !current) return null;
  const c = available.find((x) => x.id === current)!;
  const photos = ARCHI_PHOTOS.filter((p) => p.collection === current).slice(0, 24);
  return (
    <section aria-label="Biens et architecture" className="mb-24">
      <div role="group" aria-label="Type de bien" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {available.map((x) => <button key={x.id} type="button" className="chip flex-none" aria-pressed={x.id === current} onClick={() => setSel(x.id)}>{x.label}</button>)}
      </div>
      <p className="mt-4 max-w-[60ch] text-muted">{c.blurb}</p>
      <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {photos.map((p) => <Photo key={p.id} photo={p} className="break-inside-avoid rounded-[var(--r)]" />)}
      </div>
    </section>
  );
}
