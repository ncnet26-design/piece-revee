/** Camille, designer d'intérieur virtuelle : portrait illustré (personnage dessiné, pas la photo d'une personne réelle). */
export function CamilleAvatar({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 64 64" className={`flex-none rounded-full ${className}`}>
      <defs><clipPath id="cam-c"><circle cx="32" cy="32" r="32" /></clipPath></defs>
      <g clipPath="url(#cam-c)">
        <rect width="64" height="64" fill="#EADFCF" />
        <circle cx="50" cy="12" r="13" fill="#C0714F" opacity=".35" />
        {/* Cheveux, derrière */}
        <path d="M14 36c-2-14 6-25 18-25s20 11 18 25c-1 6-3 9-5 11H19c-2-2-4-5-5-11z" fill="#3A2A21" />
        {/* Pull col roulé sauge et épaules */}
        <path d="M8 64c1-10 9-16 24-16s23 6 24 16z" fill="#8FA38A" />
        <path d="M25 44h14v7c-2 2-4.5 3-7 3s-5-1-7-3z" fill="#7C9277" />
        {/* Cou et visage */}
        <path d="M27.5 38h9v8c-1.5 1.4-3 2-4.5 2s-3-.6-4.5-2z" fill="#D9A27F" />
        <ellipse cx="32" cy="29" rx="10.5" ry="12.5" fill="#E8B898" />
        {/* Frange et carré */}
        <path d="M21 28c0-9 5-14 11.5-14 6 0 11 4 11 12-4-1-8-4-10-8-2 5-7 9-12.5 10z" fill="#3A2A21" />
        <path d="M21.2 27c-.8 5 .2 10 2.3 13.5l-3.5 1c-2-4-2.3-9-1-14z M42.8 26c.8 5 .3 10.5-2 14.5l3.4.8c2-4 2.4-9.5 1.2-14.8z" fill="#3A2A21" />
        {/* Lunettes fines, yeux, sourire */}
        <g fill="none" stroke="#2A211C" strokeWidth="1.1"><circle cx="27.6" cy="29.4" r="3.3" /><circle cx="36.6" cy="29.4" r="3.3" /><path d="M30.9 29.2h2.4" /></g>
        <circle cx="27.6" cy="29.6" r=".95" fill="#2A211C" /><circle cx="36.6" cy="29.6" r=".95" fill="#2A211C" />
        <path d="M29.3 36.2c1.7 1.3 3.9 1.3 5.6 0" fill="none" stroke="#A65A47" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="25" cy="33.6" r="1.6" fill="#E59E86" opacity=".45" /><circle cx="39.2" cy="33.6" r="1.6" fill="#E59E86" opacity=".45" />
        {/* Boucle d'oreille laiton */}
        <circle cx="42.3" cy="34" r="1.1" fill="#C49A52" />
      </g>
    </svg>
  );
}
