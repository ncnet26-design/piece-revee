"use client";
import { openCamille } from "@/lib/camille-bus";

export function AskCamille({ question, label = "Demander à Camille", className = "btn btn-sm" }: { question: string; label?: string; className?: string }) {
  return <button type="button" className={className} onClick={() => openCamille(question)}>{label}</button>;
}
