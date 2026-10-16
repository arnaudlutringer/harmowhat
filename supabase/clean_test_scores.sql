-- Supprime les scores de test (générés pour essayer les classements) et eux seuls :
-- leur identifiant client commence par 7e570000-. Les vrais scores ne sont pas touchés.
-- À exécuter dans Supabase : SQL Editor → New query → coller ce fichier → Run.

delete from public.scores where client_id::text like '7e570000-%';
