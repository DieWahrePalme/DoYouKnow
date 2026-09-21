-- Do You Know - database schema for Supabase.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.
--
-- RLS policies wrap auth.uid() as (select auth.uid()): Postgres then evaluates
-- it once per statement (as an initPlan) instead of once per row, which matters
-- once these tables have more than a handful of rows. See:
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ---------------------------------------------------------------------------
-- profiles: one row per registered person, mirrors auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar_emoji text not null default '🙂',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by anyone signed in" on public.profiles;
create policy "profiles are readable by anyone signed in" on public.profiles
  for select to authenticated using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id);

-- Auto-create a profile row whenever someone signs up. The username is
-- taken from the signup form (passed as user metadata) and falls back to a
-- generated one so the insert never fails.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_emoji)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'avatar_emoji', '🙂')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- friendships: one row per pair, created by the sender, accepted by the recipient
-- ---------------------------------------------------------------------------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friendships enable row level security;

drop policy if exists "see your own friendships" on public.friendships;
create policy "see your own friendships" on public.friendships
  for select to authenticated using ((select auth.uid()) = user_id or (select auth.uid()) = friend_id);

drop policy if exists "send a friend request" on public.friendships;
create policy "send a friend request" on public.friendships
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "recipient can accept or either side can remove" on public.friendships;
create policy "recipient can accept or either side can remove" on public.friendships
  for update to authenticated using ((select auth.uid()) = user_id or (select auth.uid()) = friend_id);

drop policy if exists "either side can delete the friendship" on public.friendships;
create policy "either side can delete the friendship" on public.friendships
  for delete to authenticated using ((select auth.uid()) = user_id or (select auth.uid()) = friend_id);

-- ---------------------------------------------------------------------------
-- answers: append-only history of every round someone has answered for a
-- topic group - never updated, only inserted, so old answers stay visible.
-- ---------------------------------------------------------------------------
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id text not null,
  question_id text not null,
  value text not null check (value in ('never', 'no', 'leanNo', 'leanYes', 'yes')),
  answered_at timestamptz not null default now()
);

create index if not exists answers_user_group_idx on public.answers (user_id, group_id);

alter table public.answers enable row level security;

drop policy if exists "answers are readable by anyone signed in" on public.answers;
create policy "answers are readable by anyone signed in" on public.answers
  for select to authenticated using (true);

drop policy if exists "insert only your own answers" on public.answers;
create policy "insert only your own answers" on public.answers
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- guesses: what one person guessed another person's latest answer to be.
-- Overwritten (not appended) each time the guesser updates a guess.
-- ---------------------------------------------------------------------------
create table if not exists public.guesses (
  id uuid primary key default gen_random_uuid(),
  guesser_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.profiles (id) on delete cascade,
  group_id text not null,
  question_id text not null,
  value text not null check (value in ('never', 'no', 'leanNo', 'leanYes', 'yes')),
  updated_at timestamptz not null default now(),
  unique (guesser_id, subject_id, group_id, question_id)
);

alter table public.guesses enable row level security;

drop policy if exists "see guesses you made or that are about you" on public.guesses;
create policy "see guesses you made or that are about you" on public.guesses
  for select to authenticated using ((select auth.uid()) = guesser_id or (select auth.uid()) = subject_id);

drop policy if exists "only guess as yourself" on public.guesses;
create policy "only guess as yourself" on public.guesses
  for insert to authenticated with check ((select auth.uid()) = guesser_id);

drop policy if exists "only update your own guesses" on public.guesses;
create policy "only update your own guesses" on public.guesses
  for update to authenticated using ((select auth.uid()) = guesser_id);

-- ---------------------------------------------------------------------------
-- streaks: one row per pair, canonicalized so user_a < user_b (avoids
-- duplicate rows for (a,b) vs (b,a)).
-- ---------------------------------------------------------------------------
create table if not exists public.streaks (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  streak integer not null default 0,
  bumped_on date,
  primary key (user_a, user_b),
  check (user_a < user_b)
);

alter table public.streaks enable row level security;

drop policy if exists "see your own streaks" on public.streaks;
create policy "see your own streaks" on public.streaks
  for select to authenticated using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

drop policy if exists "upsert a streak you're part of" on public.streaks;
create policy "upsert a streak you're part of" on public.streaks
  for insert to authenticated with check ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

drop policy if exists "update a streak you're part of" on public.streaks;
create policy "update a streak you're part of" on public.streaks
  for update to authenticated using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

-- ---------------------------------------------------------------------------
-- favorites: shared answers a person liked, private to them.
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  group_id text not null,
  question_id text not null,
  liked_at timestamptz not null default now(),
  unique (owner_id, friend_id, group_id, question_id)
);

alter table public.favorites enable row level security;

drop policy if exists "manage only your own favorites" on public.favorites;
create policy "manage only your own favorites" on public.favorites
  for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
