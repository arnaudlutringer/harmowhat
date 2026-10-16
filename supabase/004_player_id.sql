-- Identifiant technique du joueur : tiré au hasard une fois sur l'appareil (profil Mon compte), il ne change
-- pas quand le joueur change de nom ou de pays. Il sert à reconnaître ses propres scores dans les classements.
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller ce fichier → Run.
-- (Déjà inclus dans schema.sql pour une nouvelle base.)

alter table public.scores add column if not exists player_id uuid;
create index if not exists scores_player_idx on public.scores (player_id);

-- Les vues des classements renvoient aussi l'identifiant du joueur (colonne ajoutée à la fin).
create or replace view public.top_world with (security_invoker = true) as
select game, level, questions, name, country, points, correct, played_at, player_id
from (
  select s.*, row_number() over (partition by game, level, questions order by points desc, played_at asc) as rk
  from public.scores s
) ranked
where rk <= 10;

create or replace view public.top_country with (security_invoker = true) as
select game, level, questions, name, country, points, correct, played_at, player_id
from (
  select s.*, row_number() over (partition by game, level, questions, country order by points desc, played_at asc) as rk
  from public.scores s
) ranked
where rk <= 10;

grant select on public.top_world, public.top_country to anon, authenticated;
