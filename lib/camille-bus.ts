"use client";
/** Petit bus d'événements pour ouvrir Camille depuis n'importe quel bouton, avec une question préremplie. */
type Handler = (question?: string, context?: { projectId?: string; step?: string }) => void;
let handler: Handler | null = null;
export function registerCamille(h: Handler) { handler = h; return () => { if (handler === h) handler = null; }; }
export function openCamille(question?: string, context?: { projectId?: string; step?: string }) { handler?.(question, context); }
