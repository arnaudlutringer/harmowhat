-- Matchs à distance : un joueur joue une partie, un autre rejoue exactement la même (mêmes questions,
-- grâce à la graine), et le plus de points gagne. Classement : 1 000 au départ, +20 par victoire,
-- 0 par match nul, −10 par défaite (jamais en dessous de 0).
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller ce fichier → Run.
-- (Déjà pris en compte dans schema.sql pour une nouvelle base.)

create table if not exists public.matches (
  id bigint generated always as identity primary key,
  -- Code à donner à un ami, et dans le lien direct (loreille://match/CODE).
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  game text not null check (game in ('grave-ou-aigu', 'quelle-note', 'accords', 'harmonies', 'lecture-note', 'fais-harmonie', 'tonalite', 'modalite', 'chante-note', 'chante-harmonie', 'quel-rythme', 'joue-rythme', 'garde-tempo', 'trouve-tempo')),
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
