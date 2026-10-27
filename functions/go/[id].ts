/**
 * Redirecteur affilié Cloudflare Pages Function : /go/<id-produit>/
 * Journalise le clic (sans IP en clair) via la fonction SQL log_click, puis redirige vers le lien affilié issu du flux.
 */
interface Env { SUPABASE_URL: string; SUPABASE_ANON_KEY: string; IP_HASH_SALT: string }
interface Ctx { request: Request; env: Env; params: { id: string } }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function hash(ip: string, salt: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet = async ({ request, env, params }: Ctx): Promise<Response> => {
  const id = String(params.id ?? "").replace(/\/$/, "");
  if (!UUID.test(id)) return new Response("Lien invalide", { status: 400 });
  const ip = request.headers.get("cf-connecting-ip") ?? "inconnu";
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/log_click`, {
    method: "POST",
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ p_product: id, p_ip_hash: await hash(ip, env.IP_HASH_SALT ?? "sel") }),
  });
  const url = r.ok ? ((await r.json()) as string | null) : null;
  if (!url || !/^https:\/\//.test(url)) return Response.redirect(new URL("/?produit=indisponible", request.url).toString(), 302);
  return new Response(null, { status: 302, headers: { location: url, "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer-when-downgrade" } });
};
