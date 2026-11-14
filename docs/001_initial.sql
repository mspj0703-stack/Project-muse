-- PROJECT MUSE Alpha 0.1 / Supabase PostgreSQL
-- First-run migration. Track IDs are local UUIDs; recording MBIDs are optional external IDs.
-- Run via Supabase SQL editor or migration tooling. Do not put service role secrets in clients.

create extension if not exists pgcrypto;

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 400),
  primary_artist text not null check (char_length(trim(primary_artist)) between 1 and 400),
  musicbrainz_recording_id uuid unique,
  lastfm_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  -- Popularity is source-relative and never a calibrated global rank.
  popularity numeric(5,4) check (popularity between 0 and 1),
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index songs_published_artist_idx on public.songs (primary_artist) where status='published';

create table public.song_aliases (
  song_id uuid not null references public.songs(id) on delete cascade,
  alias text not null check (char_length(trim(alias)) between 1 and 400),
  language text,
  primary key (song_id, alias)
);
create index song_aliases_alias_idx on public.song_aliases (alias);

create table public.song_features (
  song_id uuid primary key references public.songs(id) on delete cascade,
  energy real check (energy between 0 and 1),
  brightness real check (brightness between 0 and 1),
  melancholy real check (melancholy between 0 and 1),
  complexity real check (complexity between 0 and 1),
  acoustic real check (acoustic between 0 and 1),
  electronic real check (electronic between 0 and 1),
  vocal text check (vocal in ('female','male','synthetic','mixed','instrumental')),
  confidence real check (confidence between 0 and 1),
  annotation_source text,
  reviewed_at timestamptz
);

create table public.song_labels (
  song_id uuid not null references public.songs(id) on delete cascade,
  label_type text not null check (label_type in ('domain','genre','tag')),
  label text not null check (char_length(trim(label)) between 1 and 100),
  primary key (song_id, label_type, label)
);
create index song_labels_type_label_idx on public.song_labels(label_type, label);

create table public.song_links (
  song_id uuid not null references public.songs(id) on delete cascade,
  provider text not null check (provider in ('youtube','lastfm','official')),
  url text not null check (char_length(url) <= 2048),
  primary key (song_id, provider, url)
);

create table public.song_similarities (
  source_song_id uuid not null references public.songs(id) on delete cascade,
  target_song_id uuid not null references public.songs(id) on delete cascade,
  source text not null check (source in ('lastfm','curated')),
  strength real not null check (strength between 0 and 1),
  fetched_at timestamptz not null default now(),
  primary key (source_song_id, target_song_id, source),
  check (source_song_id <> target_song_id)
);
create index song_similarities_target_idx on public.song_similarities(target_song_id);

create table public.user_ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  kind text not null check (kind in ('seed','love','like','neutral','dislike','skip')),
  updated_at timestamptz not null default now(),
  primary key (user_id,song_id)
);
create index user_ratings_user_updated_idx on public.user_ratings(user_id,updated_at desc);

-- Optional server-only telemetry. No client grants or client RLS policies.
create table public.recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  recommended_song_ids uuid[] not null,
  algorithm_version text not null,
  created_at timestamptz not null default now()
);
create index recommendation_logs_user_created_idx on public.recommendation_logs(user_id,created_at desc);

-- RLS for all application tables
alter table public.songs enable row level security;
alter table public.song_aliases enable row level security;
alter table public.song_features enable row level security;
alter table public.song_labels enable row level security;
alter table public.song_links enable row level security;
alter table public.song_similarities enable row level security;
alter table public.user_ratings enable row level security;
alter table public.recommendation_logs enable row level security;

-- Explicit client access: read-only published catalog and owner-only ratings.
revoke all on public.songs, public.song_aliases, public.song_features,
  public.song_labels, public.song_links, public.song_similarities,
  public.user_ratings, public.recommendation_logs from anon, authenticated;
grant select on public.songs, public.song_aliases, public.song_features,
  public.song_labels, public.song_links, public.song_similarities to anon, authenticated;
grant select, insert, update, delete on public.user_ratings to authenticated;

create policy songs_read_published on public.songs for select to anon, authenticated
  using (status = 'published');
create policy aliases_read_published on public.song_aliases for select to anon, authenticated
  using (exists(select 1 from public.songs s where s.id = song_id and s.status='published'));
create policy features_read_published on public.song_features for select to anon, authenticated
  using (exists(select 1 from public.songs s where s.id = song_id and s.status='published'));
create policy labels_read_published on public.song_labels for select to anon, authenticated
  using (exists(select 1 from public.songs s where s.id = song_id and s.status='published'));
create policy links_read_published on public.song_links for select to anon, authenticated
  using (exists(select 1 from public.songs s where s.id = song_id and s.status='published'));
create policy similarities_read_published on public.song_similarities for select to anon, authenticated
  using (exists(select 1 from public.songs s where s.id = source_song_id and s.status='published')
    and exists(select 1 from public.songs s where s.id = target_song_id and s.status='published'));

create policy ratings_select_own on public.user_ratings for select to authenticated
  using (user_id = (select auth.uid()));
create policy ratings_insert_own on public.user_ratings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy ratings_update_own on public.user_ratings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy ratings_delete_own on public.user_ratings for delete to authenticated
  using (user_id = (select auth.uid()));
