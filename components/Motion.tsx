"use client";
import { useEffect } from "react";

/** Apparitions au défilement : les éléments marqués data-reveal montent doucement en fondu (désactivé si l'utilisateur limite les animations). */
export function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.9);
    els.forEach((el) => el.classList.add("rv"));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("rv-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

const TEX = ["tx-chene", "m-travertin", "tx-bouclette", "m-terrazzo", "tx-cuir", "m-metro", "tx-laine", "m-tadelakt", "tx-cotele", "m-tomette", "tx-enduit", "m-velours", "tx-bois-fin", "m-brique", "tx-chine", "m-gres", "tx-beton", "m-noyer", "tx-coton", "m-ardoise"];
/** Bandeau de matières photographiées qui défile lentement (décoratif). */
export function MaterialsMarquee() {
  const row = TEX.map((t) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={t} src={`/textures/${t}/diff.webp`} alt="" loading="lazy" width={160} height={160} className="h-[120px] w-[120px] flex-none rounded-[18px] object-cover shadow-[0_10px_24px_-14px_rgba(0,0,0,.45)] sm:h-[150px] sm:w-[150px]" />
  ));
  return (
    <div aria-hidden="true" className="marquee relative -mx-4 mt-16 overflow-hidden py-2 sm:mx-0 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="marquee-track flex w-max gap-4">{row}{row}</div>
    </div>
  );
}
