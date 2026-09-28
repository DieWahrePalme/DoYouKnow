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

-- Signup checks a username before the account exists (profiles are only
-- readable when signed in). Returns only yes/no - no profile data leaks.
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

grant execute on function public.username_available(text) to anon, authenticated;

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

-- Sending a request: policy "send a friend request" is defined further down,
-- next to the blocks table it depends on.

-- Only the recipient can accept. Removing a friendship is a delete (below).
drop policy if exists "recipient can accept or either side can remove" on public.friendships;
drop policy if exists "only the recipient can accept" on public.friendships;
create policy "only the recipient can accept" on public.friendships
  for update to authenticated
  using ((select auth.uid()) = friend_id)
  with check ((select auth.uid()) = friend_id and status = 'accepted');

drop policy if exists "either side can delete the friendship" on public.friendships;
create policy "either side can delete the friendship" on public.friendships
  for delete to authenticated using ((select auth.uid()) = user_id or (select auth.uid()) = friend_id);

-- True when a and b have an accepted friendship (either direction). Used by
-- the answers/guesses policies. security definer so it can read
-- friendships regardless of the caller's own RLS view of that table.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.user_id = a and f.friend_id = b) or (f.user_id = b and f.friend_id = a))
  );
$$;

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

-- Only you and your accepted friends can read your answers. (It used to be
-- every signed-in account - anyone with the app could pull everyone's raw
-- answers through the API.) Friends still need them for results, streaks
-- and the Match tab; docs/PRD.md tracks tightening this further.
drop policy if exists "answers are readable by anyone signed in" on public.answers;
drop policy if exists "answers are readable by you and your friends" on public.answers;
create policy "answers are readable by you and your friends" on public.answers
  for select to authenticated
  using ((select auth.uid()) = user_id or public.are_friends((select auth.uid()), user_id));

drop policy if exists "insert only your own answers" on public.answers;
create policy "insert only your own answers" on public.answers
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Delete own answers: used by the in-app "Heute zurücksetzen" test button.
drop policy if exists "delete only your own answers" on public.answers;
create policy "delete only your own answers" on public.answers
  for delete to authenticated using ((select auth.uid()) = user_id);

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
  for insert to authenticated
  with check ((select auth.uid()) = guesser_id and public.are_friends(guesser_id, subject_id));

drop policy if exists "only update your own guesses" on public.guesses;
create policy "only update your own guesses" on public.guesses
  for update to authenticated using ((select auth.uid()) = guesser_id);

drop policy if exists "only delete your own guesses" on public.guesses;
create policy "only delete your own guesses" on public.guesses
  for delete to authenticated using ((select auth.uid()) = guesser_id);

-- ---------------------------------------------------------------------------
-- guess_days: append-only log of "guesser guessed subject's card on this
-- Berlin day". `guesses` above is overwritten per group, so it can't say
-- *when* a card was guessed; streaks need exactly that. The app derives
-- every streak from answers + guess_days (src/utils/streak.ts) instead of
-- storing a counter. `day` is the client's Berlin day - trusted, which is
-- fine for a friends-only MVP.
-- ---------------------------------------------------------------------------
create table if not exists public.guess_days (
  guesser_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  group_id text not null,
  created_at timestamptz not null default now(),
  primary key (guesser_id, subject_id, day)
);

alter table public.guess_days enable row level security;

drop policy if exists "see guess days you made or that are about you" on public.guess_days;
create policy "see guess days you made or that are about you" on public.guess_days
  for select to authenticated using ((select auth.uid()) = guesser_id or (select auth.uid()) = subject_id);

drop policy if exists "only log your own guess days" on public.guess_days;
create policy "only log your own guess days" on public.guess_days
  for insert to authenticated
  with check ((select auth.uid()) = guesser_id and public.are_friends(guesser_id, subject_id));

drop policy if exists "only delete your own guess days" on public.guess_days;
create policy "only delete your own guess days" on public.guess_days
  for delete to authenticated using ((select auth.uid()) = guesser_id);

-- ---------------------------------------------------------------------------
-- streaks: removed. Streaks are derived from answers + guess_days in the app
-- (src/utils/streak.ts); the old stored counter drifted and double-counted.
-- ---------------------------------------------------------------------------
drop table if exists public.streaks;

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

-- ---------------------------------------------------------------------------
-- test_clock: removed. It held the shared "+1h / next day" test offset, and
-- any signed-in account could move it for everyone. Replaced in the app by
-- the per-user "Heute zurücksetzen" button.
-- ---------------------------------------------------------------------------
drop table if exists public.test_clock;

-- ---------------------------------------------------------------------------
-- Account deletion (App Store requirement: deletable inside the app).
-- Deleting the auth user cascades through profiles to every table that
-- references it (answers, guesses, guess_days, friendships, favorites,
-- blocks, reports, push_tokens, daily_cards).
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- blocks: "I don't want contact with this person". Blocking ends an existing
-- friendship (trigger below) and stops new friend requests in both
-- directions (friendships insert policy). Only the blocker sees the row.
-- ---------------------------------------------------------------------------
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "see who you blocked" on public.blocks;
create policy "see who you blocked" on public.blocks
  for select to authenticated using ((select auth.uid()) = blocker_id);

drop policy if exists "block as yourself" on public.blocks;
create policy "block as yourself" on public.blocks
  for insert to authenticated with check ((select auth.uid()) = blocker_id);

drop policy if exists "unblock as yourself" on public.blocks;
create policy "unblock as yourself" on public.blocks
  for delete to authenticated using ((select auth.uid()) = blocker_id);

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.end_friendship_on_block()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.friendships
  where (user_id = new.blocker_id and friend_id = new.blocked_id)
     or (user_id = new.blocked_id and friend_id = new.blocker_id);
  return null;
end;
$$;

drop trigger if exists blocks_end_friendship on public.blocks;
create trigger blocks_end_friendship
  after insert on public.blocks
  for each row execute function public.end_friendship_on_block();

-- Sending a friend request: always as yourself and always 'pending' -
-- otherwise a sender could insert it straight as 'accepted' and make
-- themselves anyone's friend (which also opens that person's answers, see
-- are_friends). And never across a block, in either direction.
drop policy if exists "send a friend request" on public.friendships;
create policy "send a friend request" on public.friendships
  for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending' and not public.is_blocked_between(user_id, friend_id));

-- ---------------------------------------------------------------------------
-- reports: a user reports another user. Reviewed by hand in the Supabase
-- dashboard (Table Editor -> reports). Reporters only see their own reports.
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('harassment', 'inappropriate_profile', 'spam', 'other')),
  details text check (char_length(details) <= 1000),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

alter table public.reports enable row level security;

drop policy if exists "see your own reports" on public.reports;
create policy "see your own reports" on public.reports
  for select to authenticated using ((select auth.uid()) = reporter_id);

drop policy if exists "report as yourself" on public.reports;
create policy "report as yourself" on public.reports
  for insert to authenticated with check ((select auth.uid()) = reporter_id);

-- ===========================================================================
-- Push notifications (docs/PRD.md: "result ready" + "streak at risk" 22:00)
--
-- Sent straight from Postgres through Expo's push service - no extra server.
-- Needs two Supabase extensions: pg_net (HTTP calls) and pg_cron (the hourly
-- job). Enable both under Database -> Extensions, or run the two lines below.
-- ===========================================================================
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- The current Berlin calendar day - the same day boundary the app uses.
create or replace function public.berlin_today()
returns date
language sql
stable
as $$ select (now() at time zone 'Europe/Berlin')::date $$;

-- Start of the Berlin day after `d`, as an absolute timestamp.
create or replace function public.berlin_day_end(d date)
returns timestamptz
language sql
immutable
as $$ select ((d + 1)::timestamp at time zone 'Europe/Berlin') $$;

-- ---------------------------------------------------------------------------
-- push_tokens: Expo push tokens per device. Registered/unregistered through
-- the two functions below (a token can move between accounts when someone
-- signs out and another person signs in on the same phone).
-- ---------------------------------------------------------------------------
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

drop policy if exists "see your own push tokens" on public.push_tokens;
create policy "see your own push tokens" on public.push_tokens
  for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.register_push_token(p_token text)
returns void
language sql
security definer set search_path = public
as $$
  insert into public.push_tokens (token, user_id, updated_at)
  values (p_token, auth.uid(), now())
  on conflict (token) do update set user_id = excluded.user_id, updated_at = now();
$$;

create or replace function public.unregister_push_token(p_token text)
returns void
language sql
security definer set search_path = public
as $$
  delete from public.push_tokens where token = p_token and user_id = auth.uid();
$$;

revoke execute on function public.register_push_token(text) from public, anon;
revoke execute on function public.unregister_push_token(text) from public, anon;
grant execute on function public.register_push_token(text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

-- ---------------------------------------------------------------------------
-- daily_cards: which card each person got on which Berlin day. The draw only
-- runs in the app (src/utils/dailyCard.ts), so the app records it here - the
-- 22:00 reminder needs to know whether someone answered *their* card today.
-- ---------------------------------------------------------------------------
create table if not exists public.daily_cards (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  group_id text not null,
  primary key (user_id, day)
);

alter table public.daily_cards enable row level security;

drop policy if exists "see your own daily cards" on public.daily_cards;
create policy "see your own daily cards" on public.daily_cards
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "record your own daily card" on public.daily_cards;
create policy "record your own daily card" on public.daily_cards
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- send_push: one Expo push per token of the given users. Server-only - not
-- callable from the app, or anyone could spam anyone.
-- ---------------------------------------------------------------------------
create or replace function public.send_push(p_user_ids uuid[], p_title text, p_body text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  messages jsonb;
begin
  select jsonb_agg(jsonb_build_object('to', t.token, 'title', p_title, 'body', p_body, 'sound', 'default'))
    into messages
    from public.push_tokens t
    where t.user_id = any (p_user_ids);
  if messages is null then
    return;
  end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := messages,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
end;
$$;

revoke execute on function public.send_push(uuid[], text, text) from public, anon, authenticated;

-- "Result ready": I just answered my card -> everyone who guessed that card
-- of mine today can now see how well they know me.
create or replace function public.notify_result_ready()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  r record;
  subject_name text;
begin
  for r in select distinct n.user_id, n.group_id from new_rows n loop
    subject_name := (select username from public.profiles where id = r.user_id);
    perform public.send_push(
      array(
        select gd.guesser_id from public.guess_days gd
        where gd.subject_id = r.user_id and gd.group_id = r.group_id and gd.day = public.berlin_today()
      ),
      '🎉 ' || subject_name || ' hat geantwortet',
      'Deine Auflösung ist da – schau, wie gut du ' || subject_name || ' kennst!'
    );
  end loop;
  return null;
end;
$$;

drop trigger if exists answers_notify_result_ready on public.answers;
create trigger answers_notify_result_ready
  after insert on public.answers
  referencing new table as new_rows
  for each statement execute function public.notify_result_ready();

-- "Someone guessed you": a friend just guessed my card for today.
create or replace function public.notify_guessed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  guesser_name text := (select username from public.profiles where id = new.guesser_id);
begin
  perform public.send_push(
    array[new.subject_id],
    '👀 ' || guesser_name || ' hat deine Karte getippt',
    case
      when exists (select 1 from public.answers a where a.user_id = new.subject_id and a.group_id = new.group_id)
        then 'Schau dir an, wie gut ' || guesser_name || ' dich kennt.'
      else 'Beantworte deine Karte, dann seht ihr beide die Auflösung.'
    end
  );
  return null;
end;
$$;

drop trigger if exists guess_days_notify_guessed on public.guess_days;
create trigger guess_days_notify_guessed
  after insert on public.guess_days
  for each row execute function public.notify_guessed();

-- ---------------------------------------------------------------------------
-- Streak at risk, 22:00 Berlin. Mirrors src/utils/streak.ts: a day counts
-- when both guessed each other's card that day and both had their own card
-- (the one the other guessed) answered by the end of that day.
-- ---------------------------------------------------------------------------
create or replace function public.pair_day_complete(a uuid, b uuid, d date)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.guess_days ab
    join public.guess_days ba on ba.guesser_id = b and ba.subject_id = a and ba.day = d
    where ab.guesser_id = a and ab.subject_id = b and ab.day = d
      and exists (select 1 from public.answers x
                  where x.user_id = a and x.group_id = ba.group_id and x.answered_at < public.berlin_day_end(d))
      and exists (select 1 from public.answers x
                  where x.user_id = b and x.group_id = ab.group_id and x.answered_at < public.berlin_day_end(d))
  );
$$;

-- Is `u` still missing their own part with `other` today? (Guessed the
-- other's card, and answered their own card - known via daily_cards.
-- No daily_cards row = u hasn't opened the app today = certainly missing.)
create or replace function public.part_missing(u uuid, other uuid, d date)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select not exists (select 1 from public.guess_days g where g.guesser_id = u and g.subject_id = other and g.day = d)
      or not exists (
        select 1 from public.daily_cards c
        join public.answers x on x.user_id = c.user_id and x.group_id = c.group_id
        where c.user_id = u and c.day = d and x.answered_at < public.berlin_day_end(d)
      );
$$;

-- p_force skips the 22:00 check - for testing from the SQL editor:
--   select public.send_streak_reminders(true);
create or replace function public.send_streak_reminders(p_force boolean default false)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  today date := public.berlin_today();
  r record;
  sent integer := 0;
begin
  if not p_force and extract(hour from now() at time zone 'Europe/Berlin') <> 22 then
    return 0;
  end if;
  for r in
    with pairs as (
      select f.user_id as a, f.friend_id as b from public.friendships f where f.status = 'accepted'
    ),
    sides as (
      select a as u, b as o from pairs union all select b, a from pairs
    ),
    at_risk as (
      select s.u, s.o from sides s
      where public.pair_day_complete(s.u, s.o, today - 1)
        and not public.pair_day_complete(s.u, s.o, today)
        and public.part_missing(s.u, s.o, today)
    )
    select ar.u, string_agg(p.username, ', ' order by p.username) as names
    from at_risk ar join public.profiles p on p.id = ar.o
    group by ar.u
  loop
    perform public.send_push(array[r.u], '🔥 Nur noch 2 Stunden', 'Halte deine Flamme mit ' || r.names || ' am Leben!');
    sent := sent + 1;
  end loop;
  return sent;
end;
$$;

revoke execute on function public.send_streak_reminders(boolean) from public, anon, authenticated;

-- Hourly; the function itself only acts at 22:00 Berlin (this also covers
-- the summer/winter time switch, which a fixed UTC cron time wouldn't).
select cron.schedule('streak-reminders', '0 * * * *', $$select public.send_streak_reminders()$$);
