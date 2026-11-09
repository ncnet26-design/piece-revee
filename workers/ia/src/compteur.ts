/**
 * Compteur strict des plafonds (Durable Object Cloudflare, inclus dans l'offre gratuite) :
 * une seule instance traite les demandes une par une, donc « vérifier puis compter » ne peut pas être contourné
 * en envoyant beaucoup de demandes en même temps. Les valeurs sont recopiées dans KV pour l'affichage (/v2/usage).
 */
import type { Env, KVNamespace } from "./config";

export type Op = { cle: string; ajout: number; max?: number; ttl: number };
type Valeur = { v: number; exp: number };
const arrondi = (x: number) => Math.round(x * 10000) / 10000;

/** Applique toutes les opérations si aucune ne dépasse son plafond ; sinon n'en applique aucune. */
export function appliquer(actuel: Array<number>, ops: Op[]): number[] | null {
  if (ops.some((o, i) => o.max !== undefined && o.ajout > 0 && actuel[i]! + o.ajout > o.max + 1e-9)) return null;
  return ops.map((o, i) => arrondi(actuel[i]! + o.ajout));
}

interface Stockage { get<T>(cles: string[]): Promise<Map<string, T>>; put<T>(entrees: Record<string, T>): Promise<void>; delete(cles: string[]): Promise<number>; list<T>(o?: { limit?: number }): Promise<Map<string, T>> }
export class Compteur {
  private stockage: Stockage; private kv?: KVNamespace;
  constructor(state: { storage: Stockage }, env: Env) { this.stockage = state.storage; this.kv = env.QUOTA; }
  async fetch(request: Request): Promise<Response> {
    const ops = (await request.json().catch(() => [])) as Op[];
    if (!Array.isArray(ops) || !ops.length || ops.length > 12) return Response.json({ ok: false });
    const now = Date.now();
    // Lecture et écriture du stockage sans autre attente entre les deux : aucune autre demande ne s'intercale.
    const lu = await this.stockage.get<Valeur>(ops.map((o) => o.cle));
    const actuel = ops.map((o) => { const x = lu.get(o.cle); return x && x.exp > now ? x.v : 0; });
    const nouveau = appliquer(actuel, ops);
    if (!nouveau) return Response.json({ ok: false });
    const entrees: Record<string, Valeur> = {};
    ops.forEach((o, i) => { entrees[o.cle] = { v: nouveau[i]!, exp: now + o.ttl * 1000 }; });
    await this.stockage.put(entrees);
    // Copie pour l'affichage, sans attendre ; et ménage de temps en temps des compteurs expirés.
    ops.forEach((o, i) => { void this.kv?.put(o.cle, String(nouveau[i]), { expirationTtl: o.ttl }).catch(() => {}); });
    if (Math.random() < 0.02) void this.menage(now);
    return Response.json({ ok: true });
  }
  private async menage(now: number) {
    const tout = await this.stockage.list<Valeur>({ limit: 1000 });
    const vieux = [...tout].filter(([, x]) => x.exp <= now).map(([k]) => k);
    if (vieux.length) await this.stockage.delete(vieux.slice(0, 128));
  }
}
