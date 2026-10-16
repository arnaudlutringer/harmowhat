-- Nouveau barème : 10 000 points par question au départ (au lieu de 1000).
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller ce fichier → Run.
-- (Déjà pris en compte dans schema.sql pour une nouvelle base.)

-- 1. Les scores de l'ancien barème ne sont pas comparables : ils sont effacés.
truncate table public.scores;

-- 2. Les points peuvent aller jusqu'à 10 000 par question : l'ancienne limite (1000 par question) est remplacée.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.scores'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%points%'
  loop
    execute format('alter table public.scores drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.scores add constraint scores_points_range check (points > 0 and points <= questions * 10000);
