"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { isExterior } from "@core/schemas/study.ts";
import { styleById } from "@/content/index";
import { DEMO_EXTERIOR, DEMO_INTERIOR } from "@/lib/demo-studies";
import { deleteLocalProject, fetchRemoteProject, fetchRemoteProjects, getLocalProject, runDemoPipeline, STEP_LABELS, useLocalProjects, type JobStep, type Project } from "@/lib/projects";
import { DEMO_MODE } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import { StudyBoard } from "./StudyBoard";
import { Scene } from "./Visual";

/** Exemples consultables sans rien envoyer. */
export const EXAMPLES: Project[] = [
  { id: "exemple-salon", title: DEMO_INTERIOR.concept.title, homeId: null, brief: { space: "Salon", surfaceM2: 24, wish: "Un salon plus chaleureux et apaisant.", styles: ["Japandi"], budget: "confort", tenure: "proprietaire", keep: "Canapé, parquet", postalCode: null }, photoUrl: null, status: "termine", error: null, versions: [{ version: 1, instruction: null, createdAt: "2026-10-26T10:00:00Z", result: DEMO_INTERIOR }], renders: [], isPublic: false, shareSlug: null, checklist: [], createdAt: "2026-10-26T10:00:00Z", demo: true },
  { id: "exemple-terrasse", title: DEMO_EXTERIOR.concept.title, homeId: null, brief: { space: "Terrasse", surfaceM2: 30, wish: "Une terrasse ombragée pour dîner dehors.", styles: ["Méditerranéen sec"], budget: "confort", tenure: "proprietaire", keep: "Dallage", postalCode: "13100" }, photoUrl: null, status: "termine", error: null, versions: [{ version: 1, instruction: null, createdAt: "2026-10-26T10:00:00Z", result: DEMO_EXTERIOR }], renders: [], isPublic: false, shareSlug: null, checklist: [], createdAt: "2026-10-26T10:00:00Z", demo: true },
];

function Thumb({ p }: { p: Project }) {
  const st = [...styleById.values()].find((s) => s.name === p.brief.styles[0]);
  const palette = p.versions.at(-1)?.result.palette.map((c) => c.hex) ?? st?.palette ?? ["#ECE6DA", "#C9A97E", "#8A8A80", "#3C3A35", "#A8B19A"];
  // eslint-disable-next-line @next/next/no-img-element
  if (p.photoUrl) return <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />;
  return <Scene spec={{ scope: isExterior(p.brief.space) ? "exterieur" : "interieur", space: p.brief.space, palette, seed: p.id.length * 131 }} width={480} height={300} label="" />;
}

export function ProjectList() {
  const local = useLocalProjects();
  const [remote, setRemote] = useState<Project[] | null>(DEMO_MODE ? [] : null);
  useEffect(() => { if (!DEMO_MODE) void fetchRemoteProjects().then(setRemote); }, []);
  const mine = DEMO_MODE ? local : (remote ?? []);
  return (
    <>
      <div className="vhead"><div><h1>Mes projets</h1><p>Chaque pièce ou extérieur devient un projet : étude, rendus, achats, tutos et guide d'étapes.</p></div><Link className="btn btn-primary btn-lg" href="/projet/nouveau/">Nouveau projet</Link></div>
      {remote === null ? <div className="skeleton h-48" /> : mine.length === 0 ? (
        <div className="panel flex flex-col items-start gap-2 border-dashed"><h2 className="text-2xl">Aucun projet pour l'instant</h2><p className="text-muted">Une photo de votre pièce ou de votre jardin suffit pour commencer. La première étude est offerte.</p><Link className="btn btn-primary mt-2" href="/projet/nouveau/">Commencer</Link></div>
      ) : (
        <div className="grid-cards">{mine.map((p) => (
          <article key={p.id} className="card">
            <div className="vis" style={{ aspectRatio: "16 / 10" }}><Thumb p={p} /></div>
            <div className="body">
              <span className="eyebrow">{p.brief.space}</span>
              <h2 className="text-lg"><Link href={`/projet/etude/?id=${p.id}`} className="card-link text-ink no-underline">{p.title}</Link></h2>
              <div className="meta"><span>{p.status === "termine" ? `${p.versions.length} version${p.versions.length > 1 ? "s" : ""}` : "En cours"}</span><span>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</span></div>
              {p.demo && <button type="button" className="btn btn-sm over mt-2 self-start" onClick={() => deleteLocalProject(p.id)}>Supprimer</button>}
            </div>
          </article>
        ))}</div>
      )}
      <section className="section">
        <h2>Exemples d'études</h2>
        <p className="mb-4 mt-1 text-muted">Pour voir à quoi ressemble une étude complète, sans rien envoyer.</p>
        <div className="grid-cards">{EXAMPLES.map((p) => (
          <article key={p.id} className="card"><div className="vis" style={{ aspectRatio: "16 / 10" }}><Thumb p={p} /></div>
            <div className="body"><span className="eyebrow">Exemple · {p.brief.space}</span><h3><Link href={`/projet/etude/?id=${p.id}`} className="card-link text-ink no-underline">{p.title}</Link></h3></div></article>
        ))}</div>
      </section>
    </>
  );
}

export function StudyPage() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const example = EXAMPLES.find((e) => e.id === id);
  const local = useLocalProjects();
  const [remote, setRemote] = useState<Project | null | undefined>(undefined);
  const [step, setStep] = useState<JobStep | null>(null);
  const project = example ?? (DEMO_MODE ? local.find((p) => p.id === id) : remote ?? undefined);

  useEffect(() => {
    if (example || !id) return;
    if (DEMO_MODE) {
      const p = getLocalProject(id);
      if (p && p.status !== "termine") return runDemoPipeline(id, setStep);
      return;
    }
    let stop = false;
    const load = async () => { const p = await fetchRemoteProject(id); if (stop) return; setRemote(p); if (p && p.status !== "termine" && p.status !== "erreur") setTimeout(() => void load(), 2500); };
    void load();
    const sb = supabase();
    const ch = sb?.channel(`job-${id}`).on("postgres_changes", { event: "*", schema: "public", table: "job_runs", filter: `project_id=eq.${id}` }, () => void load()).subscribe();
    return () => { stop = true; if (ch) void sb?.removeChannel(ch); };
  }, [id, example]);

  if (!id) return <div className="panel"><p>Aucun projet sélectionné.</p><Link className="btn mt-3" href="/projet/">Mes projets</Link></div>;
  if (!example && !DEMO_MODE && remote === undefined) return <div className="skeleton h-96" aria-label="Chargement" />;
  if (!project) return <div className="panel"><h1 className="text-2xl">Projet introuvable</h1><p className="mt-2 text-muted">Il a peut-être été supprimé, ou il a été créé sur un autre appareil.</p><Link className="btn mt-3" href="/projet/">Mes projets</Link></div>;

  if (project.status !== "termine" || project.versions.length === 0) {
    const current = (step ?? project.status) as JobStep;
    const order = Object.keys(STEP_LABELS) as (keyof typeof STEP_LABELS)[];
    const idx = order.indexOf(current as keyof typeof STEP_LABELS);
    return (
      <div className="mx-auto max-w-xl">
        <div className="panel flex flex-col gap-4" aria-live="polite">
          <span className="eyebrow">Étude en cours · {project.brief.space}</span>
          <h1 className="text-3xl">Nous préparons votre étude</h1>
          {project.status === "erreur" ? <p className="notice notice-warn">{project.error ?? "L'étude n'a pas pu aboutir. Aucun crédit n'a été décompté."}</p> : (
            <ol className="flex flex-col gap-2.5 p-0" style={{ listStyle: "none" }}>
              {order.map((k, i) => <li key={k} className="flex items-center gap-2.5 text-[15px]">{i < idx ? <span className="font-bold text-good" style={{ color: "var(--good)" }} aria-label="terminé">✓</span> : i === idx ? <span className="spinner text-accent" aria-label="en cours" /> : <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-line" aria-label="à venir" />}<span className={i > idx ? "text-muted" : ""}>{STEP_LABELS[k]}</span></li>)}
            </ol>
          )}
          <p className="text-[13px] text-muted">Comptez une à deux minutes. Vous pouvez quitter la page : l'étude continue et vous la retrouverez dans « Mes projets ».</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <nav className="crumbs" aria-label="Fil d'Ariane"><Link href="/projet/">Mes projets</Link><span aria-hidden="true">/</span><span aria-current="page">{project.title}</span></nav>
      {example && <p className="notice mb-4">Exemple d'étude : <Link href="/projet/nouveau/">lancez la vôtre</Link> sur la photo de votre espace.</p>}
      <StudyBoard project={project} />
    </>
  );
}
