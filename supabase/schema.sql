-- Scores mondiaux de L'oreille.
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller ce fichier → Run.
--
-- L'appli utilise la clé publique (anon) : tout le monde peut lire les scores et en ajouter,
-- personne ne peut les modifier ni les supprimer. Les contraintes ci-dessous refusent les
-- valeurs impossibles (nom vide ou trop long, pays inconnu, points hors limites…).

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  -- Identifiant tiré par l'appareil : un score renvoyé deux fois (connexion coupée) n'est enregistré qu'une fois.
  client_id uuid not null unique,
  game text not null check (game in ('grave-ou-aigu', 'quelle-note', 'accords', 'harmonies', 'lecture-note')),
  level text not null check (char_length(level) between 1 and 30),
  questions smallint not null check (questions between 1 and 100),
  name text not null check (char_length(name) between 1 and 10 and name = btrim(name)),
  -- Code pays ISO 3166-1 alpha-2 (FR, BE, CA…).
  country char(2) not null check (country ~ '^[A-Z]{2}$'),
  -- Au plus 1000 points par question.
  points integer not null check (points > 0 and points <= questions * 1000),
  correct smallint not null check (correct between 0 and questions),
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Classements : un jeu, un niveau, un nombre de questions (et éventuellement un pays), du meilleur au moins bon.
create index if not exists scores_board_idx on public.scores (game, level, questions, points desc);
create index if not exists scores_board_country_idx on public.scores (game, level, questions, country, points desc);
-- Record de chaque jeu (Hall of fame).
create index if not exists scores_game_idx on public.scores (game, points desc);

alter table public.scores enable row level security;

drop policy if exists "Lecture des scores par tous" on public.scores;
create policy "Lecture des scores par tous" on public.scores
  for select to anon, authenticated using (true);

drop policy if exists "Ajout de scores par tous" on public.scores;
create policy "Ajout de scores par tous" on public.scores
  for insert to anon, authenticated with check (true);

-- Pas de politique update ni delete : modifier ou supprimer un score est impossible depuis l'appli.
grant select, insert on public.scores to anon, authenticated;

-- Classements chargés au lancement de l'appli (mis en cache sur l'appareil) : les 10 meilleurs de chaque
-- classement dans le monde, et pays par pays. Les vues respectent les règles d'accès de la table.
create or replace view public.top_world with (security_invoker = true) as
select game, level, questions, name, country, points, correct, played_at
from (
  select s.*, row_number() over (partition by game, level, questions order by points desc, played_at asc) as rk
  from public.scores s
) ranked
where rk <= 10;

create or replace view public.top_country with (security_invoker = true) as
select game, level, questions, name, country, points, correct, played_at
from (
  select s.*, row_number() over (partition by game, level, questions, country order by points desc, played_at asc) as rk
  from public.scores s
) ranked
where rk <= 10;

grant select on public.top_world, public.top_country to anon, authenticated;
