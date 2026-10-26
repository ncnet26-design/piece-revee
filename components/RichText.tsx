import Link from "next/link";
import type { ReactNode } from "react";
import { libraryById } from "@/content/index";

/** Rendu sûr d'un texte de Camille : gras, listes, paragraphes et citations [[id]] (uniquement si l'identifiant existe). Aucun HTML injecté. */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[\[([a-z0-9][a-z0-9:_-]{1,79})\]\]/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${keyBase}-b${i++}`}>{m[1]}</strong>);
    else if (m[2]) { const e = libraryById.get(m[2]); if (e) out.push(<Link key={`${keyBase}-l${i++}`} href={e.href} className="ref">{e.name}</Link>); }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, bi) => {
        const lines = b.split("\n");
        const isList = lines.every((l) => /^\s*([-•*]|\d+[.)])\s+/.test(l));
        if (isList) {
          const ordered = /^\s*\d/.test(lines[0] ?? "");
          const items = lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*([-•*]|\d+[.)])\s+/, ""), `${bi}-${li}`)}</li>);
          return ordered ? <ol key={bi}>{items}</ol> : <ul key={bi}>{items}</ul>;
        }
        return <p key={bi}>{lines.flatMap((l, li) => (li ? [<br key={`br${li}`} />, ...inline(l, `${bi}-${li}`)] : inline(l, `${bi}-${li}`)))}</p>;
      })}
    </>
  );
}
