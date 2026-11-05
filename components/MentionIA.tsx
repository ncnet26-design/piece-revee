/**
 * Mention discrète d'une image créée par IA : petite pastille « IA » dans un coin de l'image (texte complet pour les lecteurs d'écran).
 * Obligatoire (règlement européen sur l'IA, art. 50, et honnêteté envers le client) : on la rend discrète, on ne la retire pas.
 */
export function MentionIA({ className = "bottom-2.5 right-2.5" }: { className?: string }) {
  return (
    <span title="Image générée par IA" className={`pointer-events-none absolute ${className} rounded-full bg-black/30 px-1.5 py-px text-[9px] font-semibold tracking-[.08em] text-white/85 backdrop-blur-sm`}>
      IA<span className="sr-only"> : image générée par intelligence artificielle</span>
    </span>
  );
}
