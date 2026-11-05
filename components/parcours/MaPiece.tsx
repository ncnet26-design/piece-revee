"use client";
import Link from "next/link";
import { useProject } from "@/lib/studio/project";
import { ShoppingList } from "./ShoppingList";

/** Liste d'achats du projet en cours (gardée dans le navigateur). */
export function MaPiece() {
  const project = useProject();
  return (
    <>
      <ShoppingList project={project} />
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/transformer/" className="btn btn-primary">Transformer une pièce</Link>
        <Link href="/boutique/" className="btn">Parcourir la boutique</Link>
      </div>
    </>
  );
}
