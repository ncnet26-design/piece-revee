-- Fonctions réservées au serveur (clé service) : limitation de débit, enveloppe IA, usage, clics affiliés.

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Retourne vrai si l'appel est autorisé (fenêtre fixe). Clé : « ip:<hash> » ou « user:<uuid> » suivie de l'action.
create function public.hit_rate_limit(p_key text, p_window_seconds int, p_max int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds); n int;
begin
  insert into public.rate_limits (key, window_start, hits) values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into n;
  return n <= p_max;
end $$;

-- Enveloppe IA : crédit (vente) et débit (appel IA) atomiques. Retourne faux si le solde ne suffit pas.
create function public.envelope_credit(p_paid bigint, p_free bigint, p_reason text, p_ref text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.ai_envelope set paid_balance_cents = paid_balance_cents + p_paid, free_balance_cents = free_balance_cents + p_free, updated_at = now();
  insert into public.ai_envelope_movements (delta_paid_cents, delta_free_cents, reason, ref) values (p_paid, p_free, p_reason, p_ref);
end $$;

create function public.envelope_debit(p_cost bigint, p_payer text, p_ref text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare e public.ai_envelope; from_paid bigint;
begin
  select * into e from public.ai_envelope for update;
  if p_payer = 'free' then
    if e.free_balance_cents < p_cost then return false; end if;
    update public.ai_envelope set free_balance_cents = free_balance_cents - p_cost, updated_at = now();
    insert into public.ai_envelope_movements (delta_free_cents, reason, ref) values (-p_cost, 'ia_gratuit', p_ref);
    return true;
  end if;
  if e.paid_balance_cents + e.free_balance_cents < p_cost then return false; end if;
  from_paid := least(e.paid_balance_cents, p_cost);
  update public.ai_envelope set paid_balance_cents = paid_balance_cents - from_paid, free_balance_cents = free_balance_cents - (p_cost - from_paid), updated_at = now();
  insert into public.ai_envelope_movements (delta_paid_cents, delta_free_cents, reason, ref) values (-from_paid, -(p_cost - from_paid), 'ia_payant', p_ref);
  return true;
end $$;

-- Usage du jour et de la période, pour les quotas (évalués côté serveur avec le module core/quotas).
create function public.usage_snapshot(p_user uuid, p_since timestamptz) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'period', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from public.usage_events where user_id = p_user and created_at >= p_since group by kind) x), '{}'::jsonb),
    'messagesToday', (select count(*) from public.usage_events where user_id = p_user and kind = 'message' and created_at >= date_trunc('day', now())),
    'spendToday', coalesce((select sum(cost_cents) from public.usage_events where user_id = p_user and created_at >= date_trunc('day', now())), 0),
    'creditBalance', coalesce((select sum(delta) from public.credit_ledger where user_id = p_user), 0)
  );
$$;

-- Droit en cours d'un utilisateur (abonnement actif, sinon Pass valide, sinon Découverte).
create function public.entitlement_of(p_user uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  with sub as (select plan, current_period_end from public.subscriptions where user_id = p_user and status in ('active', 'trialing') order by current_period_end desc limit 1),
  pass as (select starts_at, access_until from public.purchases where user_id = p_user and plan = 'pass' and not refunded and access_until > now() order by access_until desc limit 1)
  select jsonb_build_object(
    'plan', coalesce((select plan from sub), case when exists (select 1 from pass) then 'pass' else 'decouverte' end),
    'periodStart', coalesce((select starts_at from pass), (select current_period_end - interval '1 month' from sub), date_trunc('month', now())),
    'accessUntil', coalesce((select current_period_end from sub), (select access_until from pass)),
    'firstStudyDone', exists (select 1 from public.usage_events where user_id = p_user and kind = 'study')
  );
$$;

-- Clic affilié : journalisé sans IP en clair, avec limitation de débit ; renvoie l'URL de destination.
create function public.log_click(p_product uuid, p_ip_hash text, p_project uuid default null) returns text
language plpgsql security definer set search_path = '' as $$
declare url text;
begin
  select pr.affiliate_url into url from public.products pr join public.merchants m on m.id = pr.merchant_id and m.active
  where pr.id = p_product and pr.removed_at is null;
  if url is null then return null; end if;
  if public.hit_rate_limit('click:' || coalesce(p_ip_hash, 'inconnu'), 60, 30) then
    insert into public.affiliate_clicks (product_id, user_id, project_id, ip_hash) values (p_product, (select auth.uid()), p_project, p_ip_hash);
  end if;
  return url;
end $$;
grant execute on function public.log_click(uuid, text, uuid) to anon, authenticated;

revoke execute on function public.hit_rate_limit, public.envelope_credit, public.envelope_debit, public.usage_snapshot, public.entitlement_of from public, anon, authenticated;

-- Suppression de compte : données applicatives (les fichiers sont supprimés par l'Edge Function, les factures restent chez Stripe).
create function public.delete_user_data(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.projects where owner_id = p_user;
  delete from public.homes where owner_id = p_user;
  delete from public.moodboard_items where user_id = p_user;
  delete from public.chat_threads where user_id = p_user;
  delete from public.user_memory where user_id = p_user;
  delete from public.quote_requests where user_id = p_user;
  update public.ai_calls set user_id = null where user_id = p_user;
end $$;
revoke execute on function public.delete_user_data from public, anon, authenticated;

-- Recherche sémantique dans la base de connaissances de Camille.
create function public.match_knowledge(p_embedding extensions.vector(384), p_limit int default 4)
returns table (id text, title text, body text, sources jsonb, similarity real) language sql stable security definer set search_path = '' as $$
  select k.id, k.title, k.body, k.sources, (1 - (k.embedding operator(extensions.<=>) p_embedding))::real
  from public.knowledge_chunks k where k.embedding is not null
  order by k.embedding operator(extensions.<=>) p_embedding limit least(p_limit, 10);
$$;
revoke execute on function public.match_knowledge from public, anon, authenticated;
