-- Rattache les scores de test d'« Arno » (France) à ton identifiant joueur, pour les voir mis en avant
-- dans les classements de ton téléphone.
-- 1. Sur le téléphone : Paramètres › Mon compte › Identifiant joueur › Copier.
-- 2. Remplace ci-dessous VOTRE-IDENTIFIANT par cet identifiant (garde les apostrophes).
-- 3. Supabase : SQL Editor → New query → coller ce fichier → Run.
-- Seuls les scores de test (identifiant client 7e570000-…) sont touchés, pas les vrais scores.

update public.scores
set player_id = 'VOTRE-IDENTIFIANT'
where client_id::text like '7e570000-%' and name = 'Arno' and country = 'FR';
