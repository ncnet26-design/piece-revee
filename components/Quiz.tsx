"use client";
import Link from "next/link";
import { useMemo } from "react";
import { STYLES, styleById } from "@/content/index";
import { KEYS } from "@/lib/storage";
import { useHydrated, useLocal } from "@/lib/use-local";
import { Scene } from "./Visual";

/** 16 ambiances (12 intérieures, 4 extérieures) : on garde ou on écarte, le profil de goûts se construit. */
const SPACES = ["Salon", "Chambre", "Cuisine", "Salle de bain", "Bureau", "Entrée"];
const CARDS = [
  ...STYLES.filter((s) => s.scope === "interieur").map((s, i) => ({ styleId: s.id, scope: "interieur" as const, space: SPACES[i % SPACES.length]! })),
  ...STYLES.filter((s) => s.scope === "exterieur").slice(0, 4).map((s, i) => ({ styleId: s.id, scope: "exterieur" as const, space: ["Jardin", "Terrasse", "Balcon", "Jardin"][i]! })),
];

const EMPTY_QUIZ = { answers: {} as Record<number, boolean> };

export interface TasteProfile { styles: { id: string; score: number }[]; palette: string[]; answeredAt: string }

export function computeProfile(answers: Record<number, boolean>): TasteProfile {
  const sc: Record<string, number> = {};
  for (const [i, liked] of Object.entries(answers)) { const c = CARDS[Number(i)]; if (c && liked) sc[c.styleId] = (sc[c.styleId] ?? 0) + 1; }
  const total = Object.values(sc).reduce((a, b) => a + b, 0) || 1;
  const styles = Object.entries(sc).sort((a, b) => b[1] - a[1]).map(([id, v]) => ({ id, score: Math.round((v / total) * 100) }));
  const palette = styles[0] ? [...(styleById.get(styles[0].id)?.palette ?? [])] : [];
  return { styles, palette, answeredAt: new Date().toISOString() };
}

export function Quiz() {
  const [stored, setStored] = useLocal<{ answers: Record<number, boolean>; profile?: TasteProfile }>(KEYS.quiz, EMPTY_QUIZ);
  const ready = useHydrated();
  const answers = stored.answers;
  const i = Object.keys(answers).length;
  const done = i >= CARDS.length;
  const profile = useMemo(() => computeProfile(answers), [answers]);
  const answer = (liked: boolean) => { const next = { ...answers, [i]: liked }; setStored({ answers: next, profile: computeProfile(next) }); };
  const card = CARDS[Math.min(i, CARDS.length - 1)]!;
  const st = styleById.get(card.styleId)!;
  const top = profile.styles[0] ? styleById.get(profile.styles[0].id) : undefined;

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
      <div className="panel overflow-hidden p-0" aria-live="polite">
        {!ready ? <div className="skeleton aspect-[4/3]" /> : done ? (
          <div className="flex flex-col gap-3 p-6">
            <h2 className="text-2xl">Votre profil est prêt</h2>
            <p className="text-muted">Style dominant : <b className="text-ink">{top?.name ?? "à préciser"}</b>{profile.styles[1] ? <>, avec une touche {styleById.get(profile.styles[1].id)?.name.toLowerCase()}</> : null}.</p>
            <div className="flex flex-wrap gap-2"><Link className="btn btn-primary" href={`/projet/nouveau/${top ? `?style=${top.id}` : ""}`}>Lancer mon étude</Link>{top && <Link className="btn" href={`/styles/${top.slug}/`}>Découvrir ce style</Link>}<button type="button" className="btn" onClick={() => setStored(null)}>Recommencer</button></div>
          </div>
        ) : (
          <>
            <div className="bg-soft" style={{ aspectRatio: "4 / 3", maxWidth: "100%" }}>
              <Scene spec={{ scope: card.scope, space: card.space, palette: st.palette, seed: 7000 + i * 131 }} width={640} height={480} label={`Ambiance ${i + 1} sur ${CARDS.length}`} className="h-full w-full" />
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-baseline justify-between"><b>{i + 1} / {CARDS.length}</b><span className="text-[13px] text-muted">{card.space}</span></div>
              <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={CARDS.length} aria-valuenow={i} aria-label="Progression du quiz"><i style={{ width: `${(i / CARDS.length) * 100}%` }} /></div>
              <div className="grid grid-cols-2 gap-2.5"><button type="button" className="btn btn-lg" onClick={() => answer(false)}>Pas pour moi</button><button type="button" className="btn btn-primary btn-lg" onClick={() => answer(true)}>J'aime</button></div>
            </div>
          </>
        )}
      </div>
      <div className="panel">
        <span className="eyebrow">Votre profil de goûts</span>
        <div className="mt-3.5 flex flex-col gap-2.5">
          {profile.styles.length ? profile.styles.slice(0, 6).map((s) => (
            <div key={s.id} className="grid grid-cols-[130px_minmax(0,1fr)_44px] items-center gap-2.5 text-sm"><span>{styleById.get(s.id)?.name}</span><div className="bar"><i style={{ width: `${s.score}%` }} /></div><span className="mono text-right">{s.score} %</span></div>
          )) : <p className="text-muted">Répondez à quelques images pour voir apparaître votre profil.</p>}
        </div>
        {profile.palette.length > 0 && <div className="mt-5"><span className="eyebrow">Palette qui vous ressemble</span><div className="pal lg mt-2">{profile.palette.map((c) => <span key={c} style={{ background: c }} />)}</div></div>}
        <p className="notice mt-5">Votre profil reste sur cet appareil tant que vous n'avez pas de compte. Vous pouvez le modifier ou l'effacer à tout moment.</p>
      </div>
    </div>
  );
}
