-- migration: create rytmik mvp schema
-- description: initial schema including levels, child_profiles, sessions, task_results,
--              indices, triggers, rls policies.
-- affected objects: tables levels, child_profiles, sessions, task_results; functions set_updated_at(),
--                   deactivate_last_session(), enforce_child_profile_limit(); policies for anon/authenticated roles.
-- notes: all objects created with row level security enabled.

-- =====================================
--  extensions & helpers
-- =====================================
create extension if not exists "uuid-ossp" with schema public;

-- =====================================
--  helper functions
-- =====================================

-- automatically update the updated_at column on modification
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- ensure only one active session per child profile
create or replace function public.deactivate_last_session()
returns trigger
language plpgsql
as $$
begin
  -- set previous active sessions to false
  update public.sessions
     set is_active = false,
         ended_at   = coalesce(ended_at, now())
   where child_id = new.child_id
     and is_active = true;
  return new;
end
$$;

-- enforce max 10 profiles per parent
create or replace function public.enforce_child_profile_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.child_profiles where parent_id = new.parent_id) >= 10 then
    raise exception 'parent % already has 10 child profiles', new.parent_id;
  end if;
  return new;
end
$$;

-- =====================================
--  tables
-- =====================================

-- 1. levels
create table if not exists public.levels (
  id              smallint primary key check (id between 1 and 20),
  seq_length      smallint not null check (seq_length > 0),
  tempo           smallint not null check (tempo > 0),
  use_black_keys  boolean  not null default false,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

-- 2. child_profiles
create table if not exists public.child_profiles (
  id               uuid        primary key default uuid_generate_v4(),
  parent_id        uuid        not null references auth.users(id) on delete cascade,
  profile_name     varchar(32) not null check (profile_name ~ '^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\- ]+$'),
  date_of_birth    date        not null,
  current_level_id smallint    not null references public.levels(id),
  last_played_at   timestamptz,
  total_score      integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz,
  unique (parent_id, profile_name)
);

-- 3. sessions
create table if not exists public.sessions (
  id          uuid        primary key default uuid_generate_v4(),
  child_id    uuid        not null references public.child_profiles(id) on delete cascade,
  is_active   boolean     not null default true,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

-- 4. task_results
create table if not exists public.task_results (
  id                uuid        primary key default uuid_generate_v4(),
  child_id          uuid        not null references public.child_profiles(id) on delete cascade,
  level_id          smallint    not null references public.levels(id),
  generator_seed    bigint      not null,
  generator_version smallint    not null default 1,
  attempts_used     smallint    not null check (attempts_used between 1 and 3),
  score             smallint    not null check (score between 0 and 10),
  completed_at      timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,
  unique (child_id, generator_seed)
);

-- =====================================
--  indices
-- =====================================
create index if not exists idx_child_profiles_parent on public.child_profiles(parent_id);
create unique index if not exists ux_active_session_per_child on public.sessions(child_id) where is_active;
create index if not exists idx_task_completed_at on public.task_results(completed_at);

-- =====================================
--  triggers
-- =====================================

-- audit triggers (set updated_at)
create trigger set_updated_at_levels
before update on public.levels
for each row
execute function public.set_updated_at();

create trigger set_updated_at_child_profiles
before update on public.child_profiles
for each row
execute function public.set_updated_at();

create trigger set_updated_at_sessions
before update on public.sessions
for each row
execute function public.set_updated_at();

create trigger set_updated_at_task_results
before update on public.task_results
for each row
execute function public.set_updated_at();

-- enforce single active session
create trigger deactivate_last_session
before insert on public.sessions
for each row
execute function public.deactivate_last_session();

-- enforce max 10 child profiles per parent
create trigger enforce_child_profile_limit
before insert on public.child_profiles
for each row
execute function public.enforce_child_profile_limit();

-- =====================================
--  row level security
-- =====================================

-- enable rls
alter table public.levels        enable row level security;
alter table public.child_profiles enable row level security;
alter table public.sessions       enable row level security;
alter table public.task_results   enable row level security;

-- levels – public read-only access (levels are non-sensitive)
-- separate policies per role and command as requested

-- select
create policy levels_select_anon on public.levels
for select to anon
using (true);

create policy levels_select_authenticated on public.levels
for select to authenticated
using (true);

-- child_profiles – owned by parent

create policy child_profiles_select_authenticated on public.child_profiles
for select to authenticated
using (parent_id = auth.uid());

create policy child_profiles_insert_authenticated on public.child_profiles
for insert to authenticated
with check (parent_id = auth.uid());

create policy child_profiles_update_authenticated on public.child_profiles
for update to authenticated
using (parent_id = auth.uid())
with check (parent_id = auth.uid());

create policy child_profiles_delete_authenticated on public.child_profiles
for delete to authenticated
using (parent_id = auth.uid());

-- sessions – access via owned child profile

create policy sessions_select_authenticated on public.sessions
for select to authenticated
using (exists (
  select 1 from public.child_profiles cp
  where cp.id = child_id and cp.parent_id = auth.uid()
));

create policy sessions_insert_authenticated on public.sessions
for insert to authenticated
with check (exists (
  select 1 from public.child_profiles cp
  where cp.id = child_id and cp.parent_id = auth.uid()
));

create policy sessions_update_authenticated on public.sessions
for update to authenticated
using (exists (
  select 1 from public.child_profiles cp
  where cp.id = child_id and cp.parent_id = auth.uid()
))
with check (exists (
  select 1 from public.child_profiles cp
  where cp.id = child_id and cp.parent_id = auth.uid()
));

create policy sessions_delete_authenticated on public.sessions
for delete to authenticated
using (exists (
  select 1 from public.child_profiles cp
  where cp.id = child_id and cp.parent_id = auth.uid()
));

-- task_results – access via owned child profile

create policy task_results_select_authenticated on public.task_results
for select to authenticated
using (exists (
  select 1 from public.child_profiles cp
  where cp.id = child_id and cp.parent_id = auth.uid()
));

create policy task_results_insert_authenticated on public.task_results
for insert to authenticated
with check (exists (
  select 1 from public.child_profiles cp
  where cp.id = child_id and cp.parent_id = auth.uid()
));

create policy task_results_update_authenticated on public.task_results
for update to authenticated
using (exists (
  select 1 from public.child_profiles cp
  where cp.id = child_id and cp.parent_id = auth.uid()
))
with check (exists (
  select 1 from public.child_profiles cp
  where cp.id = child_id and cp.parent_id = auth.uid()
));

create policy task_results_delete_authenticated on public.task_results
for delete to authenticated
using (exists (
  select 1 from public.child_profiles cp
  where cp.id = child_id and cp.parent_id = auth.uid()
));

-- no access for anon to child data

create policy child_profiles_no_access_anon on public.child_profiles for all to anon using (false);
create policy sessions_no_access_anon       on public.sessions       for all to anon using (false);
create policy task_results_no_access_anon   on public.task_results   for all to anon using (false);

-- =====================================
--  grants (supabase handles by default, but added for clarity)
-- =====================================

grant select on public.levels to anon, authenticated;

-- end of migration

