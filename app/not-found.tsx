import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 py-16">
      <span className="eyebrow">Erreur 404</span>
      <h1 className="text-4xl">Cette page n'existe pas (ou plus)</h1>
      <p className="text-muted">Le lien est peut-être ancien. Repartez de l'accueil ou explorez la bibliothèque.</p>
      <div className="flex gap-2"><Link className="btn btn-primary" href="/">Accueil</Link><Link className="btn" href="/explorer/">Explorer</Link></div>
    </div>
  );
}
