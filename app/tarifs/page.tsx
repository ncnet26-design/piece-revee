import Link from "next/link";
import { Pricing } from "@/components/Pricing";
import { JsonLd } from "@/components/JsonLd";
import { PLANS } from "@core/plans.ts";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Tarifs : une étude offerte, puis Pass ou abonnement", description: "Essayez gratuitement. Pass Projet à 14,90 € sans abonnement, Plus à 9,90 €/mois, offres Pro pour les agents et home stagers.", path: "/tarifs/" });

const FAQ: [string, string][] = [
  ["Puis-je essayer sans payer ?", "Oui. À l'inscription, une étude complète est offerte, avec un rendu de votre pièce. La galerie, le quiz et la bibliothèque sont gratuits et illimités."],
  ["Quelle différence entre le Pass Projet et l'abonnement Plus ?", "Le Pass Projet se paie une fois et dure 30 jours : idéal pour une seule pièce. Plus est un abonnement mensuel ou annuel pour plusieurs pièces et tout le logement, résiliable à tout moment."],
  ["Comment résilier ?", "Depuis votre compte, en un clic, via le portail de facturation sécurisé. L'accès continue jusqu'à la fin de la période payée."],
  ["Puis-je être remboursé ?", "Vous disposez d'un droit de rétractation de 14 jours, sauf si vous avez demandé à utiliser le service immédiatement et renoncé expressément à ce droit (contenu numérique fourni immédiatement). Écrivez-nous en cas de problème : nous cherchons toujours une solution."],
  ["Que veut dire « usage raisonnable » ?", "Chaque offre inclut des quotas mensuels clairs (études, rendus). Un plafond quotidien évite les abus automatisés ; il n'est jamais atteint par un usage normal."],
  ["Comment gagnez-vous de l'argent avec les liens produits ?", "Certains liens vers les enseignes sont des liens affiliés : nous touchons une petite commission si vous achetez, sans surcoût pour vous. Ils sont toujours signalés, et les recommandations ne dépendent pas des commissions."],
];

export default function Page() {
  return (<>
    <div className="vhead"><div><h1>Tarifs</h1><p>Une étude complète offerte pour essayer. Ensuite, un Pass sans abonnement pour une pièce, ou l'abonnement pour tout le logement.</p></div></div>
    <Pricing />
    <p className="notice mt-5">Prix TTC en euros. Paiement sécurisé par Stripe (carte bancaire, Apple Pay, Google Pay). Factures disponibles dans votre compte. Les liens vers les produits peuvent être des <Link href="/legal/affiliation/">liens affiliés</Link>.</p>
    <section className="section max-w-[760px]">
      <h2>Questions fréquentes</h2>
      <div className="mt-4 flex flex-col gap-2">{FAQ.map(([q, a]) => <details key={q} className="panel py-3"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-muted">{a}</p></details>)}</div>
    </section>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "Product", name: "Pièce Rêvée", description: "Études et rendus d'aménagement intérieur et extérieur", offers: PLANS.filter((p) => p.priceTtc > 0).map((p) => ({ "@type": "Offer", name: p.name, price: (p.priceTtc / 100).toFixed(2), priceCurrency: "EUR" })) }} />
  </>);
}
