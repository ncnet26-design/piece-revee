"use client";
import Link from "next/link";
import { useEffect } from "react";

/** Redirige vers une autre page en gardant les filtres de l'adresse (site statique : pas de redirection serveur garantie). */
export function Redirection({ vers, ancre }: { vers: string; ancre?: string }) {
  useEffect(() => { location.replace(`${vers}${location.search}${ancre ? `#${ancre}` : ""}`); }, [vers, ancre]);
  return <p className="wrap py-20 text-center text-muted">Cette page a rejoint la <Link href={vers}>boutique</Link>…</p>;
}
