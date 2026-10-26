"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { DEMO_MODE } from "@/lib/site";
import { supabase } from "@/lib/supabase";

export function SignIn() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/projet/";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const redirect = () => `${window.location.origin}${next.startsWith("/") ? next : "/projet/"}`;

  const magic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setState("error"); setMsg("Vérifiez votre adresse e-mail."); return; }
    const sb = supabase(); if (!sb) { setState("error"); setMsg("La connexion n'est pas encore activée sur ce site de démonstration."); return; }
    setState("sending");
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect() } });
    if (error) { setState("error"); setMsg(error.status === 429 ? "Trop de tentatives : réessayez dans quelques minutes." : "L'e-mail n'a pas pu être envoyé. Réessayez."); return; }
    setState("sent");
  };
  const oauth = async (provider: "google" | "apple") => {
    const sb = supabase(); if (!sb) { setState("error"); setMsg("La connexion n'est pas encore activée sur ce site de démonstration."); return; }
    await sb.auth.signInWithOAuth({ provider, options: { redirectTo: redirect() } });
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="panel flex flex-col gap-4">
        <h1 className="text-3xl">Se connecter</h1>
        <p className="text-muted">Pas de mot de passe : recevez un lien de connexion par e-mail. Votre première étude est offerte.</p>
        {DEMO_MODE && <p className="notice">Mode démonstration : la connexion sera activée avec la base de données. Vous pouvez déjà tout essayer sans compte.</p>}
        {state === "sent" ? <p className="notice" role="status">C'est envoyé. Ouvrez l'e-mail reçu sur <b>{email}</b> et touchez le lien pour vous connecter.</p> : (
          <form onSubmit={magic} className="flex flex-col gap-3" noValidate>
            <div className="field"><label htmlFor="email" className="eyebrow">Adresse e-mail</label><input id="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={state === "sending"}>{state === "sending" ? <span className="spinner" /> : null} Recevoir mon lien de connexion</button>
          </form>
        )}
        <div className="flex items-center gap-3 text-sm text-muted"><span className="h-px flex-1 bg-line" />ou<span className="h-px flex-1 bg-line" /></div>
        <div className="grid gap-2 sm:grid-cols-2"><button type="button" className="btn" onClick={() => void oauth("google")}>Continuer avec Google</button><button type="button" className="btn" onClick={() => void oauth("apple")}>Continuer avec Apple</button></div>
        {state === "error" && <p role="alert" className="notice notice-warn">{msg}</p>}
        <p className="text-[12px] text-muted">En continuant, vous acceptez les <Link href="/legal/cgu/">conditions d'utilisation</Link> et la <Link href="/legal/confidentialite/">politique de confidentialité</Link>.</p>
      </div>
    </div>
  );
}
