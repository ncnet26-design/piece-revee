"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/products/schema";
import { parseIntent, type Intent } from "@/lib/studio/intent";
import { readShared, saveProject, shareLink, uid, updateProject, useProject, type Version } from "@/lib/studio/project";
import { SHOWCASE, type AiObject } from "@/lib/studio/showcase";
import type { StudioScene } from "@/lib/studio/scene";
import type { IaJob } from "@/lib/ia-jobs";
import { Create } from "./Create";
import { Explorer, type ExploreImage } from "./Explorer";
import { Scene3D } from "./Scene3D";
import { ShoppingList } from "./ShoppingList";

type Tab = "explorer" | "creer" | "3d" | "liste";
const TABS: Array<[Tab, string]> = [["explorer", "Explorer"], ["creer", "Créer"], ["3d", "3D"], ["liste", "Ma liste"]];

/**
 * Studio : un seul parcours, de l'idée à la liste d'achats.
 * Explorer = rendu IA aux meubles cliquables ; Créer = brief, propositions et versions ; 3D = scène manipulable ; Ma liste = budget.
 */
export default function StudioApp() {
  const project = useProject();
  const [tab, setTab] = useState<Tab>("explorer");
  // Arrivée depuis « Commencer un projet » ou une inspiration : directement à l'étape demandée.
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("etape");
    if (e === "creer" || e === "3d" || e === "liste" || e === "explorer") setTimeout(() => setTab(e), 0);
  }, []);
  const [current, setCurrent] = useState<string | null>(null);
  const [cmd, setCmd] = useState("");
  const [intent, setIntent] = useState<Intent | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Projet partagé par lien : chargé une fois, puis l'adresse est nettoyée.
  useEffect(() => {
    const shared = readShared(window.location.hash);
    if (shared) { saveProject(shared); history.replaceState(null, "", window.location.pathname); setTimeout(() => setToast("Projet partagé ouvert sur cet appareil."), 0); }
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);

  // Images explorables : la pièce témoin, puis les versions du projet.
  const images: ExploreImage[] = useMemo(() => [
    ...project.versions.filter((v) => v.imageUrl).map((v) => ({ id: v.id, src: v.imageUrl!, width: v.width ?? 1536, height: v.height ?? 1024, title: v.label, generator: v.kind === "scene" ? "rendu 3D" : v.provider ?? "IA", objects: v.objects ?? [] })),
    ...SHOWCASE.map((s) => ({ id: s.id, src: s.image.src, width: s.image.width, height: s.image.height, title: s.title, generator: s.generator, objects: s.objects })),
  ], [project.versions]);
  const image = images.find((i) => i.id === current) ?? images.find((i) => SHOWCASE.some((s) => s.id === i.id)) ?? images[0] ?? null;

  const inList = useCallback((id: string) => project.list.some((x) => x.productId === id), [project.list]);
  const onAdd = useCallback((p: Product, objectId: string) => {
    const has = project.list.some((x) => x.productId === p.id);
    updateProject((x) => ({ ...x, list: has ? x.list.filter((y) => y.productId !== p.id) : [...x.list, { productId: p.id, qty: 1, forObject: objectId }] }));
    setToast(has ? "Retiré de votre liste." : `Ajouté à votre liste : ${p.name}`);
  }, [project.list]);
  const setObjects = (objects: AiObject[]) => {
    if (!image) return;
    if (project.versions.some((v) => v.id === image.id)) updateProject((p) => ({ ...p, versions: p.versions.map((v) => (v.id === image.id ? { ...v, objects } : v)) }));
    else {
      // Pièce témoin : on en fait une version du projet pour garder les repères ajoutés.
      const s = SHOWCASE.find((x) => x.id === image.id)!;
      const v: Version = { id: uid(), createdAt: new Date().toISOString(), label: s.title, kind: s.generator === "rendu 3D" ? "scene" : "ia", imageUrl: s.image.src, provider: s.generator, width: s.image.width, height: s.image.height, objects };
      updateProject((p) => ({ ...p, versions: [v, ...p.versions] })); setCurrent(v.id);
    }
  };
  const onNewVersion = (job: IaJob, base: ExploreImage, label: string) => {
    const v: Version = { id: uid(), createdAt: new Date().toISOString(), label, kind: "ia", imageUrl: job.imageUrl, jobId: job.id, provider: `${job.provider} · ${job.model}`, width: base.width, height: base.height, objects: base.objects };
    updateProject((p) => ({ ...p, versions: [v, ...p.versions] })); setCurrent(v.id); setToast("Nouvelle version créée : comparez-la dans « Créer ».");
  };
  const onFinal = (dataUrl: string, label: string, scene: StudioScene) => {
    const a = document.createElement("a"); a.href = dataUrl; a.download = `piece-revee-rendu-${Date.now()}.jpg`; a.click();
    const v: Version = { id: uid(), createdAt: new Date().toISOString(), label, kind: "scene", imageUrl: null, scene };
    updateProject((p) => ({ ...p, versions: [v, ...p.versions] }));
    setToast("Rendu final téléchargé.");
  };
  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    const i = parseIntent(cmd);
    if (!i.category) { setToast("Précisez le meuble visé (ex. « la table basse »)."); return; }
    setIntent(i); if (tab !== "3d") setTab("explorer");
  };
  /** N'importe quelle image d'intérieur (par ex. créée avec un autre outil d'IA) devient explorable. */
  const importImage = async (f: File) => {
    const { preparePhoto } = await import("@/lib/photo");
    const r = await preparePhoto(f, 1600);
    if (!r.ok) { setToast(r.message); return; }
    const v: Version = { id: uid(), createdAt: new Date().toISOString(), label: f.name.replace(/\.\w+$/, "").slice(0, 40) || "Image importée", kind: "ia", imageUrl: r.photo.dataUrl, provider: "image importée", width: r.photo.width, height: r.photo.height, objects: [] };
    const saved = updateProject((p) => ({ ...p, versions: [v, ...p.versions] }));
    setCurrent(v.id); setTab("explorer");
    setToast(saved.ok ? "Image ajoutée : touchez « Désigner un meuble » puis le meuble sur l'image." : "Image ouverte, mais la mémoire de l'appareil est pleine : elle ne sera pas conservée.");
  };
  const share = async () => {
    const link = shareLink(project, window.location.origin);
    try { await navigator.clipboard.writeText(link); setToast("Lien de partage copié (sans vos photos personnelles)."); } catch { window.prompt("Lien de partage :", link); }
  };

  return (
    <div className="studio">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-muted">Studio</p>
          <h1 className="mt-1 text-[clamp(28px,4vw,44px)] font-semibold leading-[1.05] tracking-[-0.02em]">Imaginez la pièce. <span className="text-muted">Trouvez chaque meuble.</span></h1>
        </div>
        <button type="button" className="btn !min-h-0 !py-2 text-[13px]" onClick={() => void share()}>Partager le projet</button>
      </header>

      <nav aria-label="Étapes du projet" className="mt-6 flex items-center gap-1 overflow-x-auto rounded-full border border-line bg-white/70 p-1 backdrop-blur sm:w-fit">
        {TABS.map(([id, l]) => (
          <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-medium transition ${tab === id ? "bg-ink text-white" : "text-ink hover:bg-black/5"}`}>
            {l}{id === "liste" && project.list.length ? <span className="ml-1.5 rounded-full bg-[#C9A564] px-1.5 text-[11px] text-ink">{project.list.length}</span> : null}
          </button>
        ))}
      </nav>

      {(tab === "explorer" || tab === "3d") && (
        <form onSubmit={ask} className="mt-4 flex items-center gap-2 rounded-[2px] border border-line bg-white px-3 py-1.5 focus-within:border-ink/50" role="search">
          <span aria-hidden className="text-muted">✦</span>
          <input value={cmd} onChange={(e) => setCmd(e.target.value)} className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] outline-none" placeholder="Ex. « Remplace la table basse par quelque chose de plus sculptural, pour moins de 400 € »" aria-label="Demander une modification ou une recherche" />
          {intent && <button type="button" className="text-[12px] text-muted underline" onClick={() => { setIntent(null); setCmd(""); }}>Effacer</button>}
          <button type="submit" className="btn btn-primary !min-h-0 !px-3 !py-1.5 text-[12.5px]" disabled={!cmd.trim()}>Demander</button>
        </form>
      )}
      {intent && <p className="mt-2 text-[12px] text-muted" aria-live="polite">Compris : {intent.summary.join(" · ") || "—"}</p>}

      <div className="mt-5">
        {tab === "explorer" && (
          <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-muted hover:text-ink">
            <span className="grid size-7 place-items-center rounded-full border border-line bg-white text-[15px]">+</span>Explorer une autre image (rendu, photo, création IA)
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importImage(f); e.target.value = ""; }} />
          </label>
        )}
        {tab === "explorer" && (image ? (<>
          {images.length > 1 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Rendus du projet">
              {images.map((i) => (
                <button key={i.id} type="button" role="option" aria-selected={i.id === image.id} onClick={() => setCurrent(i.id)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-[2px] border-2 ${i.id === image.id ? "border-ink" : "border-transparent opacity-80 hover:opacity-100"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.src} alt={i.title} className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <Explorer key={image.id} image={image} intent={intent} onObjects={setObjects} onNewVersion={onNewVersion} inList={inList} onAdd={onAdd} />
        </>) : (
          <div className="grid place-items-center gap-3 rounded-[2px] border border-dashed border-line bg-white/60 p-10 text-center">
            <p className="text-[15px] font-medium">Aucun rendu à explorer pour l'instant</p>
            <p className="max-w-md text-[13px] text-muted">Créez une pièce dans « Créer », ou ajoutez une image d'intérieur (par exemple une création faite avec un autre outil d'IA) : vous pourrez y désigner chaque meuble et trouver des modèles ressemblants.</p>
            <button type="button" className="btn btn-primary" onClick={() => setTab("creer")}>Créer une pièce</button>
          </div>
        ))}
        {tab === "creer" && <Create project={project} onExplore={(v) => { setCurrent(v.id); setTab("explorer"); }} />}
        {tab === "3d" && (<>
          <p className="mb-3 text-[12.5px] text-muted">Une vraie scène 3D : chaque objet est indépendant, se sélectionne, se déplace, se remplace et change de matière. Les meubles 3D sont des modèles génériques ; les produits proposés sont des alternatives.</p>
          <Scene3D intent={intent} inList={inList} onAdd={onAdd} onFinal={onFinal} />
        </>)}
        {tab === "liste" && <ShoppingList project={project} />}
      </div>
      {toast && <div role="status" className="studio-toast fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[13px] text-white shadow-lg">{toast}</div>}
    </div>
  );
}
