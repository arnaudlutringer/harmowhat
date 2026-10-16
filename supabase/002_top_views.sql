-- Classements prêts à charger au lancement de l'appli (mise en cache sur l'appareil).
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller ce fichier → Run.
-- (Déjà inclus dans schema.sql pour une nouvelle base.)

-- Les 10 meilleurs de chaque classement (jeu, niveau, nombre de questions), dans le monde.
create or replace view public.top_world with (security_invoker = true) as
select game, level, questions, name, country, points, correct, played_at
from (
  select s.*, row_number() over (partition by game, level, questions order by points desc, played_at asc) as rk
  from public.scores s
) ranked
where rk <= 10;

-- Les 10 meilleurs de chaque classement, pays par pays (l'appli ne lit que le pays du joueur).
create or replace view public.top_country with (security_invoker = true) as
select game, level, questions, name, country, points, correct, played_at
from (
  select s.*, row_number() over (partition by game, level, questions, country order by points desc, played_at asc) as rk
  from public.scores s
) ranked
where rk <= 10;

grant select on public.top_world, public.top_country to anon, authenticated;
