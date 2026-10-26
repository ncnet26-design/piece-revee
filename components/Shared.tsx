"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StudyBoard } from "./StudyBoard";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/projects";

export function Shared() {
  const slug = useSearchParams().get("s") ?? "";
  const [p, setP] = useState<Project | null | undefined>(() => (supabase() && slug ? undefined : null));
  useEffect(() => {
    const sb = supabase(); if (!sb || !slug) return;
    void sb.rpc("get_shared_project", { p_slug: slug }).then(({ data }) => setP((data as Project | null) ?? null));
  }, [slug]);
  if (p === undefined) return <div className="skeleton h-96" />;
  if (!p) return <div className="panel"><h1 className="text-2xl">Projet non disponible</h1><p className="mt-2 text-muted">Ce lien de partage n'existe pas ou le projet est redevenu privé.</p><Link className="btn btn-primary mt-3" href="/projet/nouveau/">Créer mon propre projet</Link></div>;
  return (<><p className="notice mb-4">Projet partagé par un utilisateur de Pièce Rêvée. <Link href="/projet/nouveau/">Créer le vôtre</Link>.</p><StudyBoard project={{ ...p, demo: false }} /></>);
}
