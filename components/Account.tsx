"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocal } from "@/lib/use-local";
import type { User } from "@supabase/supabase-js";
import { getPlan, type PlanId } from "@core/plans.ts";
import { styleById } from "@/content/lookup";
import { openBillingPortal } from "@/lib/billing";
import { DEMO_MODE } from "@/lib/site";
import { KEYS, local } from "@/lib/storage";
import { callFunction, supabase } from "@/lib/supabase";

interface Entitlements { plan: PlanId; accessUntil: string | null; usage: Record<string, number>; creditBalance: number }
interface Prefs { retentionMonths: number; trainingConsent: boolean }
const DEFAULT_PREFS: Prefs = { retentionMonths: 12, trainingConsent: false };
const NO_QUIZ = {};

function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function Account() {
  const [user, setUser] = useState<User | null | undefined>(DEMO_MODE ? null : undefined);
  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [prefs, setPrefsStored] = useLocal<Prefs>("pr_prefs", DEFAULT_PREFS);
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [quiz, setQuiz] = useLocal<{ profile?: { styles: { id: string; score: number }[] } }>(KEYS.quiz, NO_QUIZ);
  const router = useRouter();

  useEffect(() => {
    const sb = supabase(); if (!sb) return;
    void sb.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    void sb.from("my_entitlements").select("*").maybeSingle().then(({ data }) => setEnt((data as Entitlements | null) ?? null));
  }, []);

  const savePrefs = async (p: Prefs) => {
    setPrefsStored(p);
    const sb = supabase(); if (sb && user) await sb.from("profiles").update({ photo_retention_months: p.retentionMonths, consent_training: p.trainingConsent }).eq("id", user.id);
  };
  const exportData = async () => {
    if (DEMO_MODE) { download("piece-revee-donnees.json", Object.fromEntries(Object.values(KEYS).map((k) => [k, local.get(k, null)]))); return; }
    try { download("piece-revee-donnees.json", await callFunction("account-export", {})); } catch { setMsg("L'export a échoué. Réessayez."); }
  };
  const deleteAll = async () => {
    if (confirm.trim().toUpperCase() !== "SUPPRIMER") { setMsg("Tapez SUPPRIMER pour confirmer."); return; }
    if (DEMO_MODE) { Object.values(KEYS).forEach((k) => local.remove(k)); local.remove("pr_prefs"); local.remove("pr_moodboard_uploads"); setMsg("Toutes les données de cet appareil ont été effacées."); setConfirm(""); return; }
    try { await callFunction("account-delete", { confirm: "SUPPRIMER" }); await supabase()?.auth.signOut(); router.push("/?compte=supprime"); }
    catch { setMsg("La suppression a échoué. Écrivez-nous si le problème continue."); }
  };
  const portal = async () => { const r = await openBillingPortal(); if (!r.ok) setMsg(r.message); };

  if (user === undefined) return <div className="skeleton h-72" />;
  const plan = getPlan(ent?.plan ?? "decouverte");
  const top = quiz.profile?.styles.slice(0, 3) ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="panel flex flex-col gap-3" aria-labelledby="acc-id">
        <h2 id="acc-id" className="text-xl">Mon compte</h2>
        {DEMO_MODE ? <p className="text-muted">Mode démonstration : vos données (projets, moodboard, profil de goûts, conversation) restent sur cet appareil.</p>
          : user ? <><p>Connecté avec <b>{user.email}</b></p><button type="button" className="btn btn-sm self-start" onClick={() => void supabase()?.auth.signOut().then(() => router.push("/"))}>Se déconnecter</button></>
          : <><p className="text-muted">Connectez-vous pour retrouver vos projets sur tous vos appareils.</p><Link className="btn btn-primary self-start" href="/connexion/">Se connecter</Link></>}
      </section>

      <section className="panel flex flex-col gap-3" aria-labelledby="acc-plan">
        <h2 id="acc-plan" className="text-xl">Mon offre : {plan.name}</h2>
        {ent ? <ul className="dots text-sm">
          {(["study", "render", "edit"] as const).map((k) => { const lim = plan.quotas[k]; const used = ent.usage[k] ?? 0; return <li key={k}>{({ study: "Études", render: "Rendus", edit: "Retouches" })[k]} : {used} utilisé{used > 1 ? "s" : ""}{lim === null ? " (usage raisonnable)" : ` sur ${lim}`}</li>; })}
          {ent.creditBalance > 0 && <li>Crédits de rendu : {ent.creditBalance}</li>}
          {ent.accessUntil && <li>Accès jusqu'au {new Date(ent.accessUntil).toLocaleDateString("fr-FR")}</li>}
        </ul> : <p className="text-sm text-muted">{plan.features.join(" · ")}</p>}
        <div className="flex flex-wrap gap-2"><Link className="btn btn-primary btn-sm" href="/tarifs/">Changer d'offre</Link><button type="button" className="btn btn-sm" onClick={() => void portal()}>Factures et résiliation</button></div>
      </section>

      <section className="panel flex flex-col gap-3" aria-labelledby="acc-taste">
        <h2 id="acc-taste" className="text-xl">Mon profil de goûts</h2>
        {top.length ? <ul className="dots">{top.map((s) => <li key={s.id}>{styleById.get(s.id)?.name} : {s.score} %</li>)}</ul> : <p className="text-muted">Pas encore de profil.</p>}
        <div className="flex gap-2"><Link className="btn btn-sm" href="/quiz/">{top.length ? "Refaire le quiz" : "Faire le quiz"}</Link>{top.length > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setQuiz(null)}>Effacer</button>}</div>
        <h3 className="mt-2 text-lg">Mémoire de Camille</h3>
        <p className="text-sm text-muted">Camille se souvient de votre conversation pour mieux vous conseiller. Vous pouvez l'effacer à tout moment.</p>
        <button type="button" className="btn btn-sm self-start" onClick={() => { local.remove(KEYS.chat); setMsg("La conversation avec Camille a été effacée. Rechargez la page pour vider la fenêtre."); void supabase()?.from("user_memory").delete().eq("user_id", user?.id ?? ""); }}>Effacer la mémoire de Camille</button>
      </section>

      <section className="panel flex flex-col gap-3" aria-labelledby="acc-privacy">
        <h2 id="acc-privacy" className="text-xl">Mes données</h2>
        <div className="field"><label className="eyebrow" htmlFor="ret">Supprimer automatiquement mes photos après</label>
          <select id="ret" className="input" value={prefs.retentionMonths} onChange={(e) => void savePrefs({ ...prefs, retentionMonths: Number(e.target.value) })}>{[3, 6, 12, 24].map((m) => <option key={m} value={m}>{m} mois sans activité</option>)}</select></div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={prefs.trainingConsent} onChange={(e) => void savePrefs({ ...prefs, trainingConsent: e.target.checked })} /><span>J'accepte que mes photos servent à améliorer les modèles de Pièce Rêvée. <span className="text-muted">Facultatif, désactivé par défaut, révocable à tout moment.</span></span></label>
        <button type="button" className="btn btn-sm self-start" onClick={() => void exportData()}>Exporter toutes mes données</button>
        <div className="mt-2 rounded-[var(--r-s)] border border-line p-3">
          <h3 className="text-base">Supprimer mon compte et mes données</h3>
          <p className="mt-1 text-sm text-muted">Projets, photos, rendus, moodboard et conversation sont supprimés définitivement. Les factures sont conservées 10 ans (obligation légale).</p>
          <label htmlFor="confirm-del" className="mt-2 block text-sm">Tapez <b>SUPPRIMER</b> pour confirmer</label>
          <div className="mt-1 flex gap-2"><input id="confirm-del" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" /><button type="button" className="btn" style={{ borderColor: "var(--danger)", color: "var(--danger)" }} onClick={() => void deleteAll()}>Supprimer</button></div>
        </div>
      </section>
      {msg && <p role="status" className="notice lg:col-span-2">{msg}</p>}
    </div>
  );
}
