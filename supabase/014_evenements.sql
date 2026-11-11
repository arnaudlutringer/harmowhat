-- Mesure d'utilisation : ce que font les joueurs (parties lancées, abandons, « Rejouer », partages), sans rien de personnel.
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller ce fichier → Run.
-- (Déjà pris en compte dans schema.sql pour une nouvelle base.)
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
