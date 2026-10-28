"use client";
import { useEffect, useRef, useState } from "react";
import { askCamille, type ChatTurn } from "@/lib/camille";
import { KEYS } from "@/lib/storage";
import { useLocal } from "@/lib/use-local";
import { DEMO_MODE } from "@/lib/site";
import { RichText } from "./RichText";
import { IconClose, IconSend } from "./icons";
import { CamilleAvatar } from "./CamilleAvatar";
import { guideByKey } from "@/lib/camille-guide";

const NO_TURNS: ChatTurn[] = [];

const SUGGESTIONS = [
  "Quelle couleur de mur avec un parquet en chêne ?",
  "Comment agrandir visuellement une petite chambre ?",
  "À quelle distance du voisin puis-je planter une haie ?",
  "Comment bien éclairer un salon le soir ?",
  "Aménager un petit balcon venté",
  "Quand planter un jardin sec ?",
];

export interface CamilleRequest { id: number; question?: string; context?: { projectId?: string; step?: string } }

export default function CamilleDrawer({ open, onClose, request }: { open: boolean; onClose: () => void; request: CamilleRequest | null }) {
  const setOpen = (v: boolean) => { if (!v) onClose(); };
  const [turns, setTurnsStored] = useLocal<ChatTurn[]>(KEYS.chat, NO_TURNS);
  const setTurns = (t: ChatTurn[]) => setTurnsStored(t.slice(-30));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState("");
  const ctxRef = useRef<{ projectId?: string; step?: string }>({});
  const [stepKey, setStepKey] = useState<string | undefined>(undefined);
  const step = guideByKey(stepKey);
  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight }); }, [turns, streaming, open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = async (text: string) => {
    const q = text.trim(); if (!q || busy) return;
    const history = [...turns, { role: "user" as const, content: q }];
    setTurns(history); setDraft(""); setBusy(true); setStreaming("");
    abortRef.current = new AbortController();
    try {
      const answer = await askCamille(turns, q, ctxRef.current, setStreaming, abortRef.current.signal);
      setTurns([...history, answer]);
    } catch {
      setTurns([...history, { role: "assistant", content: "La connexion a été interrompue. Reposez votre question dans un instant.", offline: true }]);
    } finally { setBusy(false); setStreaming(""); }
  };

  const handled = useRef(0);
  useEffect(() => {
    if (!request || handled.current === request.id) return;
    handled.current = request.id;
    ctxRef.current = request.context ?? {};
    setStepKey(request.context?.step);
    setTimeout(() => inputRef.current?.focus(), 250);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- envoi déclenché par une demande externe (bouton « Demander à Camille »)
    if (request.question) void send(request.question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  return (
    <>
      <div className={`fixed inset-0 z-35 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} style={{ background: "var(--scrim)" }} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside aria-label="Camille, designer d'intérieur virtuelle" aria-hidden={!open} inert={!open}
        className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[460px] flex-col border-l border-line bg-surface transition-transform duration-300 ${open ? "translate-x-0 shadow-2xl" : "translate-x-full"}`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingRight: "env(safe-area-inset-right, 0px)" }}>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <CamilleAvatar size={42} />
          <div className="min-w-0 flex-1"><b className="block font-display text-[17px]">Camille</b><small className="text-[12.5px] text-muted">Designer d'intérieur virtuelle · IA</small></div>
          {turns.length > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setTurns([])}>Effacer</button>}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(false)} aria-label="Fermer Camille"><IconClose width={16} height={16} /></button>
        </div>
        <div ref={msgsRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
          <div className="msg-a">
            <p>Bonjour, je suis <strong>Camille</strong>, votre designer d'intérieur virtuelle. Couleurs, matières, meubles, plantes, éclairage, ordre des travaux : je vous accompagne à chaque étape du site.</p>
            {step && <p>{step.tip}</p>}
            <p className="text-[12.5px] text-muted">Je suis une intelligence artificielle : je cite mes sources et je vous oriente vers un professionnel pour la structure, l'électricité, le gaz ou l'urbanisme.</p>
            {DEMO_MODE && <p className="text-[12px] text-muted">Mode démonstration : mes réponses viennent de notre base de connaissances sourcée.</p>}
          </div>
          {turns.map((t, i) => t.role === "user"
            ? <div key={i} className="msg-u">{t.content}</div>
            : <div key={i} className="msg-a"><RichText text={t.content} />{t.sources && t.sources.length > 0 && <p className="msg-src">Sources : {t.sources.map((s, j) => <span key={j}>{j ? " · " : ""}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></span>)}</p>}</div>)}
          {busy && <div className="msg-a">{streaming ? <RichText text={streaming} /> : <span className="typing" aria-label="Camille écrit"><i /><i /><i /></span>}</div>}
        </div>
        {turns.length === 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2.5">
            {(step?.questions ?? SUGGESTIONS).map((s) => <button key={s} type="button" className="chip text-left text-[12.5px]" onClick={() => void send(s)}>{s}</button>)}
          </div>
        )}
        <form className="flex items-end gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); void send(draft); }}>
          <label htmlFor="camille-input" className="sr-only">Votre message</label>
          <textarea id="camille-input" ref={inputRef} rows={1} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(draft); } }}
            placeholder="Une question sur votre intérieur ou votre jardin…" className="input max-h-36 min-h-11 rounded-[22px]" />
          <button type="submit" className="btn btn-primary h-11 w-11 flex-none rounded-full p-0" aria-label="Envoyer" disabled={busy || !draft.trim()}><IconSend width={18} height={18} /></button>
        </form>
      </aside>
    </>
  );
}
