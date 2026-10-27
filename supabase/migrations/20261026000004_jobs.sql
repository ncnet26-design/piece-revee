-- Tâches planifiées et file d'attente (extensions disponibles sur Supabase, y compris en offre gratuite).
create extension if not exists pg_cron;
create extension if not exists pgmq;
create extension if not exists pg_net;

select pgmq.create('etudes');
select pgmq.create('rendus');

-- Chaque nuit à 3 h 17 (heure de Paris = UTC+1/+2) : purge RGPD et contrôle des liens, via les Edge Functions.
-- L'URL et la clé de service sont lues dans le coffre Vault (à configurer, voir docs/RUNBOOK.md).
select cron.schedule('purge-rgpd', '17 2 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'functions_url') || '/maintenance',
    headers := jsonb_build_object('authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'), 'content-type', 'application/json'),
    body := '{"task":"purge"}'::jsonb);
$$);
select cron.schedule('catalogue-sync', '43 3 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'functions_url') || '/maintenance',
    headers := jsonb_build_object('authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'), 'content-type', 'application/json'),
    body := '{"task":"catalogue"}'::jsonb);
$$);
