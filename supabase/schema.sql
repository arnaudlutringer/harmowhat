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
  game text not null constraint scores_game_check
    check (game in ('grave-ou-aigu', 'quelle-note', 'accords', 'harmonies', 'lecture-note', 'fais-harmonie', 'tonalite', 'modalite', 'chante-note', 'chante-harmonie', 'quel-rythme', 'joue-rythme', 'garde-tempo', 'trouve-tempo', 'lis-chante', 'lis-dis')),
  level text not null check (char_length(level) between 1 and 30),
  questions smallint not null check (questions between 1 and 100),
  name text not null check (char_length(name) between 1 and 10 and name = btrim(name)),
  -- Code pays ISO 3166-1 alpha-2 (FR, BE, CA…).
  country char(2) not null check (country ~ '^[A-Z]{2}$'),
  -- Au plus 10 000 points par question.
  points integer not null constraint scores_points_range check (points > 0 and points <= questions * 10000),
  correct smallint not null check (correct between 0 and questions),
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- Identifiant technique du joueur (profil de l'appareil) : ne change pas avec le nom ou le pays.
  player_id uuid
);
create index if not exists scores_player_idx on public.scores (player_id);

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

-- Matchs à distance (voir 012_matchs.sql).
create table if not exists public.matches (
  id bigint generated always as identity primary key,
  -- Code à donner à un ami, et dans le lien direct (loreille://match/CODE).
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  game text not null check (game in ('grave-ou-aigu', 'quelle-note', 'accords', 'harmonies', 'lecture-note', 'fais-harmonie', 'tonalite', 'modalite', 'chante-note', 'chante-harmonie', 'quel-rythme', 'joue-rythme', 'garde-tempo', 'trouve-tempo', 'lis-chante', 'lis-dis')),
  level text not null check (char_length(level) between 1 and 30),
  questions smallint not null check (questions between 1 and 100),
  seed integer not null check (seed >= 0),
  -- Visible dans les matchs ouverts du monde, ou seulement avec le code (entre amis).
  public boolean not null default true,
  creator_id uuid not null,
  creator_name text not null check (char_length(creator_name) between 1 and 10),
  creator_country char(2) not null check (creator_country ~ '^[A-Z]{2}$'),
  creator_points integer not null check (creator_points >= 0),
  creator_correct smallint not null check (creator_correct >= 0),
  opponent_id uuid,
  opponent_name text check (char_length(opponent_name) between 1 and 10),
  opponent_country char(2) check (opponent_country ~ '^[A-Z]{2}$'),
  opponent_points integer check (opponent_points >= 0),
  opponent_correct smallint check (opponent_correct >= 0),
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  check (opponent_id is null or opponent_id <> creator_id)
);
create index if not exists matches_open_idx on public.matches (created_at desc) where opponent_id is null and public;
create index if not exists matches_creator_idx on public.matches (creator_id);
create index if not exists matches_opponent_idx on public.matches (opponent_id);

alter table public.matches enable row level security;

drop policy if exists "Lecture des matchs par tous" on public.matches;
create policy "Lecture des matchs par tous" on public.matches
  for select to anon, authenticated using (true);

-- Un nouveau match n'a pas encore d'adversaire.
drop policy if exists "Création de matchs par tous" on public.matches;
create policy "Création de matchs par tous" on public.matches
  for insert to anon, authenticated with check (opponent_id is null and finished_at is null);

grant select, insert on public.matches to anon, authenticated;

-- Relever un match : une seule fois, par un autre joueur que celui qui l'a lancé. Pas de modification directe
-- de la table (aucune politique update) : seule cette fonction remplit la partie de l'adversaire.
create or replace function public.join_match(
  p_code text, p_id uuid, p_name text, p_country char(2), p_points integer, p_correct smallint
) returns setof public.matches
language sql security definer set search_path = public as $$
  update public.matches
  set opponent_id = p_id, opponent_name = p_name, opponent_country = p_country,
      opponent_points = p_points, opponent_correct = p_correct, finished_at = now()
  where code = p_code and opponent_id is null and creator_id <> p_id
    and p_points >= 0 and p_points <= questions * 10000 * 10
  returning *;
$$;
grant execute on function public.join_match(text, uuid, text, char, integer, smallint) to anon, authenticated;

-- Classement des matchs : 1 000 au départ, +20 par victoire, 0 par nul, −10 par défaite.
create or replace view public.match_ranking with (security_invoker = true) as
with results as (
  select creator_id as player_id, creator_name as name, creator_country as country, finished_at,
    sign(creator_points - opponent_points) as outcome
  from public.matches where opponent_id is not null
  union all
  select opponent_id, opponent_name, opponent_country, finished_at,
    sign(opponent_points - creator_points)
  from public.matches where opponent_id is not null
)
select player_id,
  (array_agg(name order by finished_at desc))[1] as name,
  (array_agg(country order by finished_at desc))[1] as country,
  greatest(0, 1000 + sum(case outcome when 1 then 20 when -1 then -10 else 0 end))::integer as rating,
  count(*)::integer as played,
  count(*) filter (where outcome = 1)::integer as wins,
  count(*) filter (where outcome = 0)::integer as draws
from results
group by player_id;
grant select on public.match_ranking to anon, authenticated;

-- Mesure d'utilisation (voir 014_evenements.sql).
--
-- L'appli peut seulement ajouter des lignes ; personne ne peut les lire depuis l'appli. Les chiffres se lisent dans
-- le tableau de bord de Supabase (Table Editor ou SQL Editor), avec les vues « stats_… » ci-dessous.

create table if not exists public.evenements (
  id bigint generated always as identity primary key,
  -- Identifiant tiré au hasard sur l'appareil : un envoi répété (réponse perdue) n'est enregistré qu'une fois.
  client_id uuid not null unique,
  -- Identifiant anonyme du joueur, le même que pour les scores (aléatoire, créé sur l'appareil).
  player_id uuid,
  -- Le type d'action : partie_lancee, partie_abandonnee, rejouer, partage… (d'autres pourront s'ajouter).
  type text not null check (char_length(type) between 1 and 40),
  game text check (game is null or char_length(game) <= 40),
  level text check (level is null or char_length(level) <= 40),
  -- Détails libres selon l'action (nombre de questions, essai, type de partage…).
  details jsonb not null default '{}'::jsonb check (octet_length(details::text) <= 2000),
  -- Moment de l'action sur l'appareil (une action faite hors connexion arrive plus tard).
  happened_at timestamptz not null,
  received_at timestamptz not null default now()
);

create index if not exists evenements_type_happened_at on public.evenements (type, happened_at);

alter table public.evenements enable row level security;

drop policy if exists "Ajout d'événements par tous" on public.evenements;
create policy "Ajout d'événements par tous" on public.evenements
  for insert to anon, authenticated with check (true);

-- Pas de politique select, update ni delete : depuis l'appli, on peut seulement ajouter.
revoke all on public.evenements from anon, authenticated;
grant insert on public.evenements to anon, authenticated;

-- Les statistiques, jour par jour (heure de Paris). Les parties d'essai (une question) ne comptent pas.

-- Joueurs et parties par jeu et par jour.
create or replace view public.stats_joueurs_par_jeu with (security_invoker = true) as
select (happened_at at time zone 'Europe/Paris')::date as jour, game,
       count(distinct player_id) as joueurs, count(*) as parties
from public.evenements
where type = 'partie_lancee' and coalesce((details->>'essai')::boolean, false) = false
group by 1, 2
order by 1 desc, 2;

-- Joueurs qui quittent une partie en cours (« Quitter » confirmé pendant les questions).
create or replace view public.stats_abandons with (security_invoker = true) as
select (happened_at at time zone 'Europe/Paris')::date as jour, game,
       count(distinct player_id) as joueurs, count(*) as abandons
from public.evenements
where type = 'partie_abandonnee' and coalesce((details->>'essai')::boolean, false) = false
group by 1, 2
order by 1 desc, 2;

-- Joueurs qui relancent une partie avec « Rejouer » sur l'écran de fin.
create or replace view public.stats_rejouer with (security_invoker = true) as
select (happened_at at time zone 'Europe/Paris')::date as jour, game,
       count(distinct player_id) as joueurs, count(*) as relances
from public.evenements
where type = 'rejouer'
group by 1, 2
order by 1 desc, 2;

-- Partages par type (score, classement, trophée) et par jour.
create or replace view public.stats_partages with (security_invoker = true) as
select (happened_at at time zone 'Europe/Paris')::date as jour, details->>'type' as type_partage,
       count(distinct player_id) as joueurs, count(*) as partages
from public.evenements
where type = 'partage'
group by 1, 2
order by 1 desc, 2;

-- Les vues ne sont lisibles que dans le tableau de bord, pas depuis l'appli.
revoke all on public.stats_joueurs_par_jeu, public.stats_abandons, public.stats_rejouer, public.stats_partages from anon, authenticated;
