-- Pièce Rêvée : schéma principal.
-- Toutes les tables ont la RLS activée (voir 20261026000002_rls.sql). Les tâches serveur utilisent la clé service.

create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ———————————————————————— Comptes ————————————————————————
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  taste_profile jsonb not null default '{}'::jsonb,
  budget_band text check (budget_band in ('malin', 'confort', 'premium', 'haut_de_gamme')),
  tenure text check (tenure in ('proprietaire', 'locataire')),
  onboarding_done boolean not null default false,
  consent_training boolean not null default false,
  photo_retention_months int not null default 12 check (photo_retention_months between 1 and 36),
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'moderator')),
  primary key (user_id, role)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  vat_number text,
  logo_path text,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.org_members (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  primary key (org_id, user_id)
);

-- ———————————————————————— Facturation ————————————————————————
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('plus_mensuel', 'plus_annuel', 'pro', 'agence')),
  status text not null,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  current_period_end timestamptz not null,
  updated_at timestamptz not null default now()
);
create index on public.subscriptions (user_id);

-- Achats uniques (Pass Projet, Crédits) : droit d'accès daté.
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('pass', 'credits')),
  amount_ttc_cents int not null check (amount_ttc_cents >= 0),
  stripe_event_id text not null unique,
  starts_at timestamptz not null default now(),
  access_until timestamptz not null,
  refunded boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.purchases (user_id, access_until);

-- Idempotence des webhooks Stripe : un événement n'est traité qu'une fois.
create table public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

-- Crédits de rendu : solde = somme des mouvements, jamais modifiable par le client.
create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('achat', 'rendu', 'remboursement', 'geste_commercial', 'expiration')),
  ref text,
  created_at timestamptz not null default now()
);
create index on public.credit_ledger (user_id);

create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('study', 'render', 'edit', 'message', 'pdf')),
  cost_cents int not null default 0,
  payer text not null default 'paid' check (payer in ('paid', 'free')),
  created_at timestamptz not null default now()
);
create index on public.usage_events (user_id, kind, created_at);

-- Enveloppe IA : l'IA n'est payée qu'avec l'argent encaissé.
create table public.ai_envelope (
  id boolean primary key default true check (id),
  paid_balance_cents bigint not null default 0,
  free_balance_cents bigint not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.ai_envelope (id) values (true);
create table public.ai_envelope_movements (
  id bigint generated always as identity primary key,
  delta_paid_cents bigint not null default 0,
  delta_free_cents bigint not null default 0,
  reason text not null,
  ref text,
  created_at timestamptz not null default now()
);

-- Journal des appels IA : modèle, jetons, coût, latence, validation. Aucun contenu ni donnée personnelle.
create table public.ai_calls (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  project_id uuid,
  feature text not null,
  provider text not null,
  model text not null,
  input_tokens int,
  output_tokens int,
  cost_cents int not null default 0,
  latency_ms int,
  validation_ok boolean,
  created_at timestamptz not null default now()
);
create index on public.ai_calls (created_at);
create index on public.ai_calls (project_id);

-- ———————————————————————— Logement et projets ————————————————————————
create table public.homes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  postal_code text check (postal_code ~ '^\d{5}$'),
  common_thread jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  org_id uuid references public.organizations (id) on delete set null,
  home_id uuid references public.homes (id) on delete set null,
  title text not null default 'Nouveau projet' check (char_length(title) <= 120),
  space text not null,
  brief jsonb not null,
  status text not null default 'upload' check (status in ('upload', 'analyse', 'etude', 'catalogue', 'rendus', 'termine', 'erreur')),
  error text,
  is_public boolean not null default false,
  share_slug text unique check (share_slug ~ '^[a-z0-9-]{8,40}$'),
  moderation_status text not null default 'ok' check (moderation_status in ('ok', 'masque')),
  checklist text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.projects (owner_id, created_at desc);

create table public.project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('piece', 'inspiration')),
  storage_path text not null unique,
  width int, height int,
  quality jsonb not null default '{}'::jsonb,
  exif_stripped boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.photo_analyses (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.project_photos (id) on delete cascade,
  input_hash text not null,
  model text not null,
  prompt_version text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index on public.photo_analyses (input_hash, prompt_version);

create table public.study_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  version int not null,
  parent_id uuid references public.study_versions (id) on delete set null,
  instruction text check (char_length(instruction) <= 500),
  result jsonb not null,
  schema_version int not null default 1,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create table public.product_needs (
  id uuid primary key default gen_random_uuid(),
  study_version_id uuid not null references public.study_versions (id) on delete cascade,
  need_key text not null,
  attributes jsonb not null,
  embedding extensions.vector(384),
  unique (study_version_id, need_key)
);

create table public.renders (
  id uuid primary key default gen_random_uuid(),
  study_version_id uuid not null references public.study_versions (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  variant int not null check (variant between 0 and 9),
  status text not null default 'en_attente' check (status in ('en_attente', 'en_cours', 'pret', 'erreur')),
  provider text, model text, prompt text, negative_prompt text, seed bigint,
  attempts int not null default 0,
  scores jsonb not null default '{}'::jsonb,
  storage_path text,
  width int, height int,
  watermark boolean not null default true,
  c2pa boolean not null default false,
  cost_cents int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.renders (project_id);

create table public.render_edits (
  id uuid primary key default gen_random_uuid(),
  render_id uuid not null references public.renders (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  point jsonb not null,
  instruction text not null check (char_length(instruction) between 3 and 500),
  mask_path text, result_path text,
  status text not null default 'en_attente' check (status in ('en_attente', 'en_cours', 'pret', 'erreur')),
  cost_cents int not null default 0,
  created_at timestamptz not null default now()
);

create table public.job_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null check (kind in ('etude', 'affinage', 'rendus', 'retouche', 'pdf', 'lot')),
  status text not null default 'en_attente' check (status in ('en_attente', 'en_cours', 'termine', 'erreur')),
  step text,
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.job_runs (project_id);

-- ———————————————————————— Catalogue et affiliation ————————————————————————
create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  network text not null check (network in ('awin', 'effiliation', 'kwanko', 'rakuten', 'amazon', 'direct')),
  program_id text,
  commission_note text,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.feeds (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  format text not null check (format in ('csv', 'xml', 'api')),
  secret_name text not null,
  last_sync_at timestamptz,
  last_status text,
  last_row_count int
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  external_id text not null,
  gtin text,
  title text not null,
  brand text,
  category text not null,
  styles text[] not null default '{}',
  materials text[] not null default '{}',
  colors text[] not null default '{}',
  dims_cm jsonb not null default '{"w":null,"d":null,"h":null}'::jsonb,
  price_cents int not null check (price_cents > 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  in_stock boolean not null default true,
  image_url text not null check (image_url ~ '^https://'),
  product_url text not null check (product_url ~ '^https://'),
  affiliate_url text not null check (affiliate_url ~ '^https://'),
  second_hand boolean not null default false,
  feed_seen_at timestamptz not null default now(),
  removed_at timestamptz,
  embedding extensions.vector(384),
  image_embedding extensions.vector(512),
  dedup_group text,
  unique (merchant_id, external_id)
);
create index products_category_idx on public.products (category) where removed_at is null;
create index products_embedding_idx on public.products using hnsw (embedding extensions.vector_cosine_ops);
create index products_image_embedding_idx on public.products using hnsw (image_embedding extensions.vector_cosine_ops);

create table public.need_matches (
  need_id uuid not null references public.product_needs (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  rank text not null check (rank in ('principal', 'accessible', 'premium')),
  score real not null,
  primary key (need_id, rank)
);

create table public.affiliate_clicks (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index on public.affiliate_clicks (created_at);

create table public.sponsored_placements (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  product_id uuid references public.products (id) on delete cascade,
  slot text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  check (ends_at > starts_at)
);

create table public.paint_colors (
  id text primary key,
  brand text not null,
  collection text,
  name text not null,
  code text,
  hex_approx text not null check (hex_approx ~ '^#[0-9A-Fa-f]{6}$'),
  source text not null,
  license_note text not null
);

-- ———————————————————————— Moodboard, Camille, connaissances ————————————————————————
create table public.moodboard_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null check (char_length(item_id) <= 80),
  position int not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.chat_messages (
  id bigint generated always as identity primary key,
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content jsonb not null,
  created_at timestamptz not null default now()
);
create index on public.chat_messages (thread_id, id);
create table public.user_memory (
  user_id uuid primary key references auth.users (id) on delete cascade,
  summary text not null default '' check (char_length(summary) <= 4000),
  updated_at timestamptz not null default now()
);

create table public.knowledge_chunks (
  id text primary key,
  domain text not null,
  title text not null,
  body text not null,
  sources jsonb not null default '[]'::jsonb,
  reviewed boolean not null default false,
  embedding extensions.vector(384)
);
create index knowledge_embedding_idx on public.knowledge_chunks using hnsw (embedding extensions.vector_cosine_ops);

-- ———————————————————————— Artisans ————————————————————————
create table public.artisans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  siret text not null unique check (siret ~ '^\d{14}$'),
  verified_at timestamptz,
  decennale_declared boolean not null default false,
  insurer text,
  departments text[] not null default '{}',
  trades text[] not null default '{}',
  specialties text[] not null default '{}',
  email text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  element text not null check (char_length(element) <= 200),
  details text not null check (char_length(details) <= 2000),
  department text not null check (department ~ '^(\d{2}|2A|2B|97\d)$'),
  status text not null default 'envoyee' check (status in ('envoyee', 'repondue', 'close')),
  created_at timestamptz not null default now()
);
create table public.quote_request_recipients (
  request_id uuid not null references public.quote_requests (id) on delete cascade,
  artisan_id uuid not null references public.artisans (id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (request_id, artisan_id)
);

-- Une demande de devis est transmise à 3 artisans au maximum.
create function public.enforce_max_three_recipients() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.quote_request_recipients where request_id = new.request_id) >= 3 then
    raise exception 'Une demande de devis est transmise à 3 artisans au maximum';
  end if;
  return new;
end $$;
create trigger quote_recipients_max_three before insert on public.quote_request_recipients
  for each row execute function public.enforce_max_three_recipients();

-- ———————————————————————— Modération ————————————————————————
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'ouvert' check (status in ('ouvert', 'traite')),
  created_at timestamptz not null default now()
);

-- ———————————————————————— Automatismes ————————————————————————
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger job_runs_touch before update on public.job_runs for each row execute function public.touch_updated_at();

-- Création automatique du profil à l'inscription.
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
