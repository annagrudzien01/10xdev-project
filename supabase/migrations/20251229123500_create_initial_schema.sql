-- migration: rytmik mvp initial schema
-- description: creates core tables (levels, sequence, child_profiles, sessions, task_results),
--              indices, triggers, rls policies and helper functions.
-- notes: follows .ai/db-plan.md; all tables have row level security enabled.

-- =====================================
-- extensions
-- =====================================
create extension if not exists "uuid-ossp" with schema public;

-- =====================================
-- helper functions
-- =====================================

-- function: set_updated_at() – updates updated_at timestamp on row modification
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- function: deactivate_last_session() – ensures single active session per child profile
create or replace function public.deactivate_last_session()
returns trigger
language plpgsql
as $$
begin
  update public.sessions
     set is_active = false,
         ended_at   = coalesce(ended_at, now())
   where child_id = new.child_id
     and is_active;
  return new;
end;
$$;

-- function: enforce_child_profile_limit() – max 10 child profiles per parent
create or replace function public.enforce_child_profile_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.child_profiles where parent_id = new.parent_id) >= 10 then
    raise exception 'parent % already has 10 child profiles', new.parent_id;
  end if;
  return new;
end;
$$;

-- =====================================
-- tables
-- =====================================

-- 1. levels – static reference table (publicly readable)
create table public.levels (
  id              smallint    primary key check (id between 1 and 20),
  seq_length      smallint    not null check (seq_length > 0),
  tempo           smallint    not null check (tempo > 0),
  use_black_keys  boolean     not null default false,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

-- 2. sequence – stores generated puzzles (begin & end)
create table public.sequence (
  id                 uuid        primary key default uuid_generate_v4(),
  sequence_beginning varchar(128) not null,
  sequence_end       varchar(32)  not null,
  level_id           smallint     not null references public.levels(id),
  created_at         timestamptz  not null default now(),
  updated_at         timestamptz
);

-- 3. child_profiles – child accounts linked to auth.users
create table public.child_profiles (
  id               uuid         primary key default uuid_generate_v4(),
  parent_id        uuid         not null references auth.users(id) on delete cascade,
  profile_name     varchar(32)  not null check (profile_name ~ '^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\- ]+$'),
  date_of_birth    date         not null,
  current_level_id smallint     not null references public.levels(id),
  last_played_at   timestamptz,
  total_score      integer      not null default 0,
  created_at       timestamptz  not null default now(),
  updated_at       timestamptz,
  unique (parent_id, profile_name)
);

-- 4. sessions – gameplay sessions per child (only one active)
create table public.sessions (
  id          uuid         primary key default uuid_generate_v4(),
  child_id    uuid         not null references public.child_profiles(id) on delete cascade,
  is_active   boolean      not null default true,
  started_at  timestamptz  not null default now(),
  ended_at    timestamptz,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz
);

-- 5. task_results – final results of puzzles
create table public.task_results (
  id             uuid         primary key default uuid_generate_v4(),
  child_id       uuid         not null references public.child_profiles(id) on delete cascade,
  level_id       smallint     not null references public.levels(id),
  sequence_id    uuid         not null references public.sequence(id),
  attempts_used  smallint     not null check (attempts_used between 1 and 3),
  score          smallint     not null check (score between 0 and 10),
  completed_at   timestamptz  not null default now(),
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz,
  unique (child_id, level_id)
);

-- =====================================
-- indices
-- =====================================
create index idx_child_profiles_parent on public.child_profiles(parent_id);
create unique index ux_active_session_per_child on public.sessions(child_id) where is_active;
create index idx_task_completed_at on public.task_results(completed_at);

-- =====================================
-- triggers
-- =====================================

-- audit triggers
create trigger trg_set_updated_at_levels
before update on public.levels
for each row execute function public.set_updated_at();

create trigger trg_set_updated_at_sequence
before update on public.sequence
for each row execute function public.set_updated_at();

create trigger trg_set_updated_at_child_profiles
before update on public.child_profiles
for each row execute function public.set_updated_at();

create trigger trg_set_updated_at_sessions
before update on public.sessions
for each row execute function public.set_updated_at();

create trigger trg_set_updated_at_task_results
before update on public.task_results
for each row execute function public.set_updated_at();

-- business rule triggers
create trigger trg_deactivate_last_session
before insert on public.sessions
for each row execute function public.deactivate_last_session();

create trigger trg_enforce_child_profile_limit
before insert on public.child_profiles
for each row execute function public.enforce_child_profile_limit();

-- =====================================
-- row level security
-- =====================================

-- enable rls on every table
alter table public.levels          enable row level security;
alter table public.sequence        enable row level security;
alter table public.child_profiles  enable row level security;
alter table public.sessions        enable row level security;
alter table public.task_results    enable row level security;

-- ---------- levels policies (public read-only) ----------

-- select policies
create policy levels_select_anon on public.levels
for select to anon
using (true);

create policy levels_select_authenticated on public.levels
for select to authenticated
using (true);

-- deny insert/update/delete for anon & authenticated (no policies -> denied)

-- ---------- sequence policies (access via level – only authenticated) ----------

create policy sequence_select_authenticated on public.sequence
for select to authenticated
using (true);

create policy sequence_insert_authenticated on public.sequence
for insert to authenticated
with check (true);

create policy sequence_update_authenticated on public.sequence
for update to authenticated
using (true)
with check (true);

create policy sequence_delete_authenticated on public.sequence
for delete to authenticated
using (true);

-- deny all for anon
create policy sequence_no_access_anon on public.sequence for all to anon using (false);

-- ---------- child_profiles policies ----------

-- select
create policy child_profiles_select_authenticated on public.child_profiles
for select to authenticated
using (parent_id = auth.uid());

create policy child_profiles_select_anon on public.child_profiles for select to anon using (false);

-- insert
create policy child_profiles_insert_authenticated on public.child_profiles
for insert to authenticated
with check (parent_id = auth.uid());

-- update
create policy child_profiles_update_authenticated on public.child_profiles
for update to authenticated
using (parent_id = auth.uid())
with check (parent_id = auth.uid());

-- delete
create policy child_profiles_delete_authenticated on public.child_profiles
for delete to authenticated
using (parent_id = auth.uid());

-- ---------- sessions policies ----------

create policy sessions_select_authenticated on public.sessions
for select to authenticated
using (exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.parent_id = auth.uid()));

create policy sessions_select_anon on public.sessions for select to anon using (false);

create policy sessions_insert_authenticated on public.sessions
for insert to authenticated
with check (exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.parent_id = auth.uid()));

create policy sessions_update_authenticated on public.sessions
for update to authenticated
using (exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.parent_id = auth.uid()))
with check (exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.parent_id = auth.uid()));

create policy sessions_delete_authenticated on public.sessions
for delete to authenticated
using (exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.parent_id = auth.uid()));

-- ---------- task_results policies ----------

create policy task_results_select_authenticated on public.task_results
for select to authenticated
using (exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.parent_id = auth.uid()));

create policy task_results_select_anon on public.task_results for select to anon using (false);

create policy task_results_insert_authenticated on public.task_results
for insert to authenticated
with check (exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.parent_id = auth.uid()));

create policy task_results_update_authenticated on public.task_results
for update to authenticated
using (exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.parent_id = auth.uid()))
with check (exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.parent_id = auth.uid()));

create policy task_results_delete_authenticated on public.task_results
for delete to authenticated
using (exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.parent_id = auth.uid()));

-- deny everything else implicitly.

-- =====================================
-- grants (for clarity, supabase applies by default)
-- =====================================
grant select on public.levels to anon, authenticated;

-- end of migration

