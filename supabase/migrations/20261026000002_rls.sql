-- Sécurité ligne par ligne (RLS) sur toutes les tables, vues et fonctions exposées au client.

create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin');
$$;
create function public.is_moderator() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role in ('admin', 'moderator'));
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','user_roles','organizations','org_members','subscriptions','purchases','stripe_events','credit_ledger','usage_events',
    'ai_envelope','ai_envelope_movements','ai_calls','homes','projects','project_photos','photo_analyses','study_versions','product_needs','renders','render_edits',
    'job_runs','merchants','feeds','products','need_matches','affiliate_clicks','sponsored_placements','paint_colors','moodboard_items','chat_threads','chat_messages',
    'user_memory','knowledge_chunks','artisans','quote_requests','quote_request_recipients','reports']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Profil : chacun lit et modifie le sien (sauf l'identifiant Stripe, géré par le serveur).
create policy profiles_select on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- Les droits par colonne ne s'ajoutent qu'en l'absence de droit sur toute la table : on retire le droit global, puis on n'accorde que les colonnes modifiables.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, locale, taste_profile, budget_band, tenure, onboarding_done, consent_training, photo_retention_months, last_active_at) on public.profiles to authenticated;

create policy roles_self on public.user_roles for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

create policy org_select on public.organizations for select to authenticated using (exists (select 1 from public.org_members m where m.org_id = id and m.user_id = (select auth.uid())));
create policy org_members_select on public.org_members for select to authenticated using (user_id = (select auth.uid()));

-- Facturation : lecture seule pour l'intéressé ; écritures réservées au serveur (webhooks).
create policy subs_select on public.subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy purchases_select on public.purchases for select to authenticated using (user_id = (select auth.uid()));
create policy credits_select on public.credit_ledger for select to authenticated using (user_id = (select auth.uid()));
create policy usage_select on public.usage_events for select to authenticated using (user_id = (select auth.uid()));
-- stripe_events, ai_envelope, ai_envelope_movements, ai_calls, feeds : aucun accès client (pas de politique = refus), et aucun droit.
revoke all on public.stripe_events, public.ai_envelope, public.ai_envelope_movements, public.ai_calls, public.feeds from anon, authenticated;
revoke insert, update, delete on public.subscriptions, public.purchases, public.credit_ledger, public.usage_events from anon, authenticated;

-- Logement et projets : propriétaire uniquement.
create policy homes_all on public.homes for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy projects_select on public.projects for select to authenticated using (owner_id = (select auth.uid()) and deleted_at is null);
create policy projects_update on public.projects for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy projects_delete on public.projects for delete to authenticated using (owner_id = (select auth.uid()));
-- La création passe par l'Edge Function study-start (contrôle des quotas) : pas d'insert direct.
revoke update, insert on public.projects from authenticated, anon;
grant update (title, home_id, is_public, share_slug, checklist, deleted_at) on public.projects to authenticated;

create policy photos_select on public.project_photos for select to authenticated using (owner_id = (select auth.uid()));
create policy photos_delete on public.project_photos for delete to authenticated using (owner_id = (select auth.uid()));

create policy versions_select on public.study_versions for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));
create policy needs_select on public.product_needs for select to authenticated
  using (exists (select 1 from public.study_versions v join public.projects p on p.id = v.project_id where v.id = study_version_id and p.owner_id = (select auth.uid())));
create policy matches_select on public.need_matches for select to authenticated
  using (exists (select 1 from public.product_needs n join public.study_versions v on v.id = n.study_version_id join public.projects p on p.id = v.project_id where n.id = need_id and p.owner_id = (select auth.uid())));
create policy renders_select on public.renders for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));
create policy edits_select on public.render_edits for select to authenticated using (owner_id = (select auth.uid()));
create policy jobs_select on public.job_runs for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));
create policy analyses_select on public.photo_analyses for select to authenticated
  using (exists (select 1 from public.project_photos ph where ph.id = photo_id and ph.owner_id = (select auth.uid())));

-- Catalogue : lecture publique des produits actifs d'enseignes actives ; écriture serveur.
create policy merchants_read on public.merchants for select to anon, authenticated using (active);
create policy products_read on public.products for select to anon, authenticated
  using (removed_at is null and exists (select 1 from public.merchants m where m.id = merchant_id and m.active));
create policy paints_read on public.paint_colors for select to anon, authenticated using (true);
create policy sponsored_read on public.sponsored_placements for select to anon, authenticated using (now() between starts_at and ends_at);
create policy knowledge_read on public.knowledge_chunks for select to anon, authenticated using (true);
-- affiliate_clicks : insertion par la fonction /go (clé service), lecture admin.
create policy clicks_admin on public.affiliate_clicks for select to authenticated using (public.is_admin());

-- Moodboard, Camille, mémoire : propriétaire ; la mémoire est consultable et effaçable.
create policy moodboard_all on public.moodboard_items for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy threads_all on public.chat_threads for select to authenticated using (user_id = (select auth.uid()));
create policy threads_delete on public.chat_threads for delete to authenticated using (user_id = (select auth.uid()));
create policy messages_select on public.chat_messages for select to authenticated using (user_id = (select auth.uid()));
create policy memory_select on public.user_memory for select to authenticated using (user_id = (select auth.uid()));
create policy memory_delete on public.user_memory for delete to authenticated using (user_id = (select auth.uid()));

-- Artisans : annuaire public des profils vérifiés et actifs ; demandes de devis au demandeur.
create policy artisans_read on public.artisans for select to anon, authenticated using (active and verified_at is not null);
create policy quotes_select on public.quote_requests for select to authenticated using (user_id = (select auth.uid()));
create policy quote_recipients_select on public.quote_request_recipients for select to authenticated
  using (exists (select 1 from public.quote_requests q where q.id = request_id and q.user_id = (select auth.uid())));

-- Signalements : tout utilisateur connecté peut signaler un projet public ; modération par l'équipe.
create policy reports_insert on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy reports_moderate on public.reports for select to authenticated using (public.is_moderator());

-- ———————————————————————— Vues pour le client ————————————————————————
-- Projet au format attendu par l'application (lib/projects.ts). security_invoker : la RLS des tables s'applique.
create view public.projects_view with (security_invoker = true) as
select
  p.id, p.title, p.home_id as "homeId", p.brief, p.status, p.error, p.is_public as "isPublic", p.share_slug as "shareSlug", p.checklist, p.created_at as "createdAt", false as demo,
  (select ph.storage_path from public.project_photos ph where ph.project_id = p.id and ph.kind = 'piece' order by ph.created_at limit 1) as "photoPath",
  null::text as "photoUrl",
  coalesce((select jsonb_agg(jsonb_build_object('version', v.version, 'instruction', v.instruction, 'createdAt', v.created_at, 'result', v.result) order by v.version)
            from public.study_versions v where v.project_id = p.id), '[]'::jsonb) as versions,
  coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'url', null, 'path', r.storage_path, 'variant', r.variant, 'width', r.width, 'height', r.height, 'aiGenerated', true, 'watermark', r.watermark) order by r.variant)
            from public.renders r where r.project_id = p.id and r.status = 'pret'), '[]'::jsonb) as renders
from public.projects p
where p.deleted_at is null;

-- Droits et consommation de l'utilisateur courant.
create view public.my_entitlements with (security_invoker = true) as
with me as (select (select auth.uid()) as uid),
sub as (select plan, current_period_end from public.subscriptions s, me where s.user_id = me.uid and s.status in ('active', 'trialing') order by current_period_end desc limit 1),
pass as (select access_until, starts_at from public.purchases pu, me where pu.user_id = me.uid and pu.plan = 'pass' and not pu.refunded and pu.access_until > now() order by access_until desc limit 1),
period_start as (select coalesce((select starts_at from pass), (select current_period_end - interval '1 month' from sub), date_trunc('month', now())) as ts)
select
  coalesce((select plan from sub), case when exists (select 1 from pass) then 'pass' else 'decouverte' end) as plan,
  coalesce((select current_period_end from sub), (select access_until from pass)) as "accessUntil",
  (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (select kind, count(*) as n from public.usage_events u, me where u.user_id = me.uid and u.created_at >= (select ts from period_start) group by kind) x) as usage,
  (select coalesce(sum(delta), 0)::int from public.credit_ledger c, me where c.user_id = me.uid) as "creditBalance";

-- Indicateurs d'administration (lecture admin uniquement via la fonction).
create function public.admin_kpis_data() returns table (
  mrr_cents bigint, paying_users bigint, free_users bigint, conversion_rate numeric, churn_rate numeric,
  avg_study_cost_cents numeric, ai_cost_month_cents bigint, affiliate_clicks_month bigint, envelope_paid_cents bigint, envelope_free_cents bigint
) language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Accès réservé'; end if;
  return query
  with active as (select * from public.subscriptions where status in ('active', 'trialing')),
  payers as (select user_id from active union select user_id from public.purchases where access_until > now() and not refunded)
  select
    coalesce(sum(case a.plan when 'plus_mensuel' then 990 when 'plus_annuel' then 575 when 'pro' then 2900 when 'agence' then 7900 end), 0)::bigint,
    (select count(*) from payers),
    (select count(*) from public.profiles) - (select count(*) from payers),
    case when (select count(*) from public.profiles) = 0 then 0 else round((select count(*) from payers)::numeric / (select count(*) from public.profiles), 4) end,
    case when (select count(*) from public.subscriptions) = 0 then 0 else round((select count(*) from public.subscriptions where status = 'canceled' and updated_at > now() - interval '30 days')::numeric / (select count(*) from public.subscriptions), 4) end,
    coalesce((select avg(total) from (select project_id, sum(cost_cents) as total from public.ai_calls where feature in ('analyse', 'etude', 'rendu', 'controle') and project_id is not null group by project_id) s), 0),
    coalesce((select sum(cost_cents) from public.ai_calls where created_at > date_trunc('month', now())), 0)::bigint,
    (select count(*) from public.affiliate_clicks where created_at > date_trunc('month', now())),
    (select paid_balance_cents from public.ai_envelope),
    (select free_balance_cents from public.ai_envelope)
  from active a;
end $$;
create view public.admin_kpis as select * from public.admin_kpis_data();

-- Projet partagé : seuls les champs publics, et seulement si le propriétaire l'a rendu public.
create function public.get_shared_project(p_slug text) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id, 'title', p.title, 'homeId', null, 'brief', jsonb_build_object('space', p.space, 'styles', p.brief -> 'styles', 'budget', p.brief -> 'budget', 'tenure', p.brief -> 'tenure', 'surfaceM2', null, 'wish', '', 'keep', '', 'postalCode', null),
    'photoUrl', null, 'status', p.status, 'error', null, 'isPublic', true, 'shareSlug', p.share_slug, 'checklist', '[]'::jsonb, 'createdAt', p.created_at, 'demo', false,
    'versions', coalesce((select jsonb_agg(jsonb_build_object('version', v.version, 'instruction', null, 'createdAt', v.created_at, 'result', v.result) order by v.version desc) from (select * from public.study_versions where project_id = p.id order by version desc limit 1) v), '[]'::jsonb),
    'renders', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'url', null, 'path', r.storage_path, 'variant', r.variant, 'width', r.width, 'height', r.height, 'aiGenerated', true, 'watermark', r.watermark)) from public.renders r where r.project_id = p.id and r.status = 'pret'), '[]'::jsonb))
  from public.projects p
  where p.share_slug = p_slug and p.is_public and p.moderation_status = 'ok' and p.deleted_at is null;
$$;

-- Modération : masquer un projet public signalé.
create function public.moderate_report(p_report uuid, p_action text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_moderator() then raise exception 'Accès réservé'; end if;
  if p_action = 'masquer' then
    update public.projects set moderation_status = 'masque', is_public = false where id = (select project_id from public.reports where id = p_report);
  end if;
  update public.reports set status = 'traite' where id = p_report;
end $$;

-- Recherche hybride : similarité sémantique (pgvector) + filtres SQL durs. Exécutée côté serveur.
create function public.match_products(p_embedding extensions.vector(384), p_category text, p_max_price_cents int, p_limit int default 60)
returns table (id uuid, similarity real) language sql stable security definer set search_path = '' as $$
  select pr.id, (1 - (pr.embedding operator(extensions.<=>) p_embedding))::real as similarity
  from public.products pr join public.merchants m on m.id = pr.merchant_id and m.active
  where pr.removed_at is null and pr.in_stock and pr.category = p_category and pr.price_cents <= p_max_price_cents and pr.embedding is not null
  order by pr.embedding operator(extensions.<=>) p_embedding
  limit least(p_limit, 500);
$$;
revoke execute on function public.match_products from public, anon, authenticated;

-- Purge RGPD : photos et projets inactifs au-delà de la durée choisie par l'utilisateur.
create function public.expired_photo_paths() returns table (storage_path text) language sql stable security definer set search_path = '' as $$
  select ph.storage_path from public.project_photos ph join public.profiles pf on pf.id = ph.owner_id
  where ph.created_at < now() - make_interval(months => pf.photo_retention_months) and pf.last_active_at < now() - make_interval(months => pf.photo_retention_months);
$$;
revoke execute on function public.expired_photo_paths from public, anon, authenticated;

grant select on public.projects_view, public.my_entitlements to authenticated;
grant select on public.admin_kpis to authenticated;
