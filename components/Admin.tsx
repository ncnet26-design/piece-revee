"use client";
import { useEffect, useState } from "react";
import { formatEuros } from "@core/money.ts";
import { DEMO_MODE } from "@/lib/site";
import { supabase } from "@/lib/supabase";

interface Kpis { mrr_cents: number; paying_users: number; free_users: number; conversion_rate: number; churn_rate: number; avg_study_cost_cents: number; ai_cost_month_cents: number; affiliate_clicks_month: number; envelope_paid_cents: number; envelope_free_cents: number }
interface Report { id: string; project_id: string; reason: string; created_at: string }

export function Admin() {
  const [allowed, setAllowed] = useState<boolean | null>(DEMO_MODE ? false : null);
  const [k, setK] = useState<Kpis | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  useEffect(() => {
    const sb = supabase(); if (!sb) return;
    void sb.rpc("is_admin").then(({ data }) => {
      setAllowed(Boolean(data)); if (!data) return;
      void sb.from("admin_kpis").select("*").maybeSingle().then(({ data: d }) => setK(d as Kpis | null));
      void sb.from("reports").select("id,project_id,reason,created_at").eq("status", "ouvert").order("created_at", { ascending: false }).limit(50).then(({ data: r }) => setReports((r as Report[]) ?? []));
    });
  }, []);
  const moderate = async (r: Report, action: "masquer" | "ignorer") => {
    const sb = supabase(); if (!sb) return;
    await sb.rpc("moderate_report", { p_report: r.id, p_action: action });
    setReports((x) => x.filter((y) => y.id !== r.id));
  };
  if (allowed === null) return <div className="skeleton h-72" />;
  if (!allowed) return <p className="notice">{DEMO_MODE ? "Le tableau de bord d'administration s'active avec la base de données (rôle administrateur requis)." : "Accès réservé à l'équipe."}</p>;
  const tiles: [string, string][] = k ? [
    ["Revenu mensuel récurrent", formatEuros(k.mrr_cents)], ["Clients payants", String(k.paying_users)], ["Comptes gratuits", String(k.free_users)],
    ["Conversion gratuit → payant", `${(k.conversion_rate * 100).toFixed(1)} %`], ["Résiliation (30 j)", `${(k.churn_rate * 100).toFixed(1)} %`],
    ["Coût IA moyen par étude", formatEuros(k.avg_study_cost_cents, { decimals: true })], ["Coût IA du mois", formatEuros(k.ai_cost_month_cents)],
    ["Clics affiliés du mois", String(k.affiliate_clicks_month)], ["Enveloppe IA payante", formatEuros(k.envelope_paid_cents)], ["Enveloppe IA gratuite", formatEuros(k.envelope_free_cents)],
  ] : [];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{tiles.map(([l, v]) => <div key={l} className="panel"><span className="eyebrow">{l}</span><div className="big mt-1">{v}</div></div>)}</div>
      <section className="section"><h2>Signalements à modérer</h2>
        {reports.length === 0 ? <p className="mt-2 text-muted">Aucun signalement en attente.</p> : <div className="tw mt-3"><table className="tbl"><thead><tr><th>Date</th><th>Projet</th><th>Motif</th><th>Action</th></tr></thead>
          <tbody>{reports.map((r) => <tr key={r.id}><td>{new Date(r.created_at).toLocaleString("fr-FR")}</td><td className="mono">{r.project_id.slice(0, 8)}</td><td>{r.reason}</td><td className="flex gap-1.5"><button type="button" className="btn btn-sm" onClick={() => void moderate(r, "masquer")}>Masquer</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => void moderate(r, "ignorer")}>Ignorer</button></td></tr>)}</tbody></table></div>}
      </section>
    </>
  );
}
