-- Nouveaux jeux « Chante en continu » et « Lecture continue » (lis-chante, lis-dis) : la base doit accepter leurs scores et leurs matchs.
-- Ce script inclut aussi les jeux précédents : il suffit même si 005 à 011 n'ont pas été exécutés.
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller ce fichier → Run.
-- (Déjà pris en compte dans schema.sql pour une nouvelle base.)

do $$
declare c record;
begin
  -- L'ancienne liste des jeux autorisés est remplacée, dans les scores comme dans les matchs.
  for c in
    select conrelid::regclass as tbl, conname from pg_constraint
    where conrelid in ('public.scores'::regclass, coalesce(to_regclass('public.matches'), 'public.scores'::regclass))
      and contype = 'c' and pg_get_constraintdef(oid) like '%grave-ou-aigu%'
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

alter table public.scores add constraint scores_game_check
  check (game in ('grave-ou-aigu', 'quelle-note', 'accords', 'harmonies', 'lecture-note', 'fais-harmonie', 'tonalite', 'modalite', 'chante-note', 'chante-harmonie', 'quel-rythme', 'joue-rythme', 'garde-tempo', 'trouve-tempo', 'lis-chante', 'lis-dis'));

do $$
begin
  if to_regclass('public.matches') is not null then
    alter table public.matches add constraint matches_game_check
      check (game in ('grave-ou-aigu', 'quelle-note', 'accords', 'harmonies', 'lecture-note', 'fais-harmonie', 'tonalite', 'modalite', 'chante-note', 'chante-harmonie', 'quel-rythme', 'joue-rythme', 'garde-tempo', 'trouve-tempo', 'lis-chante', 'lis-dis'));
  end if;
end $$;
