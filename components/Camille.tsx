"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { registerCamille } from "@/lib/camille-bus";
import type { CamilleRequest } from "./CamilleDrawer";
import { IconChat } from "./icons";

/** Le tiroir de Camille (et la bibliothèque qu'il utilise) n'est chargé qu'à la première ouverture. */
const CamilleDrawer = dynamic(() => import("./CamilleDrawer"), { ssr: false });

export function Camille() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [request, setRequest] = useState<CamilleRequest | null>(null);
  useEffect(() => registerCamille((question, context) => {
    setLoaded(true); setOpen(true);
    setRequest({ id: Date.now(), question, context });
  }), []);
  return (
    <>
      <button type="button" className="btn btn-primary fixed z-26 hidden shadow-[0_10px_30px_rgba(20,30,80,.28)] lg:inline-flex" style={{ right: "max(20px, calc(env(safe-area-inset-right, 0px) + 20px))", bottom: "calc(24px + env(safe-area-inset-bottom, 0px))", padding: "13px 20px 13px 14px" }}
        onClick={() => { setLoaded(true); setOpen(true); setRequest({ id: Date.now() }); }} onMouseEnter={() => setLoaded(true)} onFocus={() => setLoaded(true)}>
        <IconChat width={20} height={20} /> Demander à Camille
      </button>
      {loaded && <CamilleDrawer open={open} onClose={() => setOpen(false)} request={request} />}
    </>
  );
}
