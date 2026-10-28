import Link from "next/link";

/* eslint-disable @next/next/no-img-element -- illustrations statiques composées à la main */

/** Flèche ronde noire, en bas à droite de chaque carte. */
function Arrow() {
  return (
    <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-full bg-[#111113] text-white transition-transform duration-300 group-hover:translate-x-1">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </span>
  );
}
const Pill = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`absolute z-10 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[12px] font-medium text-[#111113] shadow-[0_8px_24px_-8px_rgba(0,0,0,.35)] ${className}`}>{children}</span>
);
const Cursor = ({ className = "" }: { className?: string }) => (
  <svg aria-hidden="true" className={`absolute z-20 h-6 w-6 drop-shadow ${className}`} viewBox="0 0 24 24"><path d="M4 3l15 7-6.5 1.8L10 18z" fill="#fff" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" /></svg>
);

/** Les trois outils, présentés comme des cartes d'application (illustrations réalisées avec nos propres rendus). */
export function HomeTools() {
  const cards = [
    {
      href: "/transformer/", title: "Transformer une pièce", text: "Envoyez une photo pour changer matières et mobilier",
      art: (
        <div className="relative mx-auto aspect-[4/5] w-[78%]">
          <img src="/visuels/hero-3d.webp" alt="" className="h-full w-full rounded-[18px] object-cover shadow-[0_20px_40px_-20px_rgba(0,0,0,.45)]" loading="lazy" />
          <span className="absolute left-[18%] top-[52%] h-[16%] w-[62%] rounded-[6px] border-2 border-dashed border-white bg-[#8B6CFF]/30" />
          <img src="/textures/m-travertin/diff.webp" alt="" className="absolute -left-[12%] top-[6%] h-[24%] w-[30%] rotate-[-10deg] rounded-[10px] border-4 border-white object-cover shadow-xl" loading="lazy" />
          <Pill className="-left-[16%] top-[34%]">Changer le sol pour cette matière</Pill>
          <Cursor className="left-[26%] top-[46%]" />
          <span className="absolute -right-[10%] bottom-[16%] grid h-[24%] w-[30%] rotate-[6deg] place-items-center rounded-[10px] border-4 border-white bg-[#F2F0EC] shadow-xl"><img src="/models/thumbs/ArmChair_01.webp" alt="" className="h-[86%] w-[86%] object-contain" loading="lazy" /></span>
          <Pill className="-right-[6%] bottom-[4%]">Remplacer par ce fauteuil</Pill>
        </div>
      ),
    },
    {
      href: "/planche/", title: "Créer une planche", text: "Des planches de matières en 3D, avec de vrais produits",
      art: (
        <div className="relative mx-auto w-[84%] overflow-hidden rounded-[16px] bg-white shadow-[0_20px_40px_-20px_rgba(0,0,0,.45)]">
          <div className="flex items-center gap-2 border-b border-[#EEE] px-3 py-2 text-[10px] text-[#5F5F67]"><span className="h-2 w-2 rounded-full bg-[#DDD]" /><span className="h-2 w-2 rounded-full bg-[#DDD]" /><span className="h-2 w-2 rounded-full bg-[#DDD]" /><span className="ml-2">Chêne, lin et travertin</span></div>
          <div className="relative grid grid-cols-[1fr_22%]">
            <div className="relative">
              <img src="/visuels/planche-hero.webp" alt="" className="aspect-[4/3] h-full w-full object-cover" loading="lazy" />
              <span className="absolute left-[34%] top-[38%] h-[30%] w-[30%] border-[1.5px] border-[#8B6CFF]">
                {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map((p) => <span key={p} className={`absolute ${p} h-2 w-2 border border-[#8B6CFF] bg-white`} />)}
              </span>
              <Cursor className="left-[52%] top-[56%]" />
            </div>
            <div className="grid grid-cols-1 gap-1 border-l border-[#EEE] bg-[#FAFAFA] p-1.5">
              {["Chandelier_01", "Lantern_01", "Ottoman_01", "potted_plant_04"].map((id) => <img key={id} src={`/models/thumbs/${id}.webp`} alt="" className="aspect-square w-full rounded-[6px] bg-white object-contain p-1" loading="lazy" />)}
            </div>
          </div>
        </div>
      ),
    },
    {
      href: "/concept/", title: "Générer un concept", text: "Des images éditoriales et leurs matières assorties",
      art: (
        <div className="relative mx-auto w-[88%]">
          <div className="relative z-10 ml-[6%] w-[88%] rounded-[16px] bg-white p-3 text-left shadow-[0_14px_30px_-14px_rgba(0,0,0,.4)]">
            <p className="text-[11.5px] leading-snug text-[#222]">Salon lambrissé de bois, canapé brun et touches de bleu doux.</p>
            <span className="mt-2 inline-block rounded-full bg-[#6542E8] px-3 py-1 text-[11px] font-semibold text-white">Créer le concept</span>
            <Cursor className="right-[18%] bottom-[-14%]" />
          </div>
          <div className="-mt-3 grid grid-cols-[1fr_1.1fr] gap-2 rounded-[16px] bg-white p-3 text-left shadow-[0_20px_40px_-20px_rgba(0,0,0,.45)]">
            <div className="pt-3">
              <b className="block text-[13px] leading-tight text-[#111]">Salon galerie</b>
              <span className="mt-1 block text-[9.5px] leading-snug text-[#5F5F67]">Boiseries chaudes, neutres profonds et contraste bleu doux.</span>
              <span className="mt-2 flex gap-1">{["#7A5236", "#5D6F8C", "#E9E1D4"].map((c) => <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}</span>
            </div>
            <img src="/visuels/visite-3d.webp" alt="" className="aspect-[4/5] w-full rounded-[10px] object-cover" loading="lazy" />
            <span className="col-span-2 grid grid-cols-5 gap-1">
              {["m-travertin", "tx-cuir", "tx-chene", "m-lin", "tx-laine"].map((t) => <img key={t} src={`/textures/${t}/diff.webp`} alt="" className="aspect-square w-full rounded-[5px] object-cover" loading="lazy" />)}
            </span>
          </div>
        </div>
      ),
    },
  ];
  return (
    <ul className="m-0 grid list-none gap-5 p-0 lg:grid-cols-3" aria-label="Les outils">
      {cards.map((c) => (
        <li key={c.href}>
          <Link href={c.href} className="group flex h-full flex-col rounded-[28px] bg-white p-6 text-center text-[#111113] no-underline shadow-[0_1px_2px_rgba(0,0,0,.04),0_24px_48px_-28px_rgba(0,0,0,.18)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(0,0,0,.04),0_30px_60px_-24px_rgba(0,0,0,.28)] sm:p-8">
            <h3 className="text-[clamp(26px,2.4vw,36px)] font-[650] tracking-[-.03em]">{c.title}</h3>
            <p className="mx-auto mt-2 max-w-[30ch] text-[16px] leading-snug text-muted">{c.text}</p>
            <div aria-hidden="true" className="mt-7 flex flex-1 items-center justify-center rounded-[22px] bg-[#F4F4F6] px-4 py-10">{c.art}</div>
            <span className="mt-6 flex justify-end"><Arrow /></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
