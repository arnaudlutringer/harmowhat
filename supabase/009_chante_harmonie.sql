-- Nouveau jeu « Chante l'harmonie » (identifiant chante-harmonie) : la base doit accepter ses scores.
-- Ce script inclut aussi les jeux précédents : il suffit même si 005 à 008 n'ont pas été exécutés.
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller ce fichier → Run.
-- (Déjà pris en compte dans schema.sql pour une nouvelle base.)

do $$
declare c record;
begin
  -- L'ancienne liste des jeux autorisés est remplacée.
  for c in
    select conname from pg_constraint
    where conrelid = 'public.scores'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%grave-ou-aigu%'
  loop
    execute format('alter table public.scores drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.scores add constraint scores_game_check
  check (game in ('grave-ou-aigu', 'quelle-note', 'accords', 'harmonies', 'lecture-note', 'fais-harmonie', 'tonalite', 'modalite', 'chante-note', 'chante-harmonie'));
