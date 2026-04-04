-- Migrate existing single-family tables to multi-tenant schema
-- 1. Create families + family_members if they don't already exist (idempotent)
-- 2. Add family_id to existing tables
-- 3. Seed a "Familjen" row and backfill existing data

-- families and family_members were created by migration 001
-- Just ensure they exist in case migration 001 ran with errors
create table if not exists families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists family_members (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  color       text not null default '#c8f064',
  role        text not null default 'member' check (role in ('owner', 'member')),
  created_at  timestamptz not null default now()
);

-- Add family_id to existing tables (nullable first so backfill can run)
alter table schedule_events add column if not exists family_id uuid references families(id) on delete cascade;
alter table meal_plan        add column if not exists family_id uuid references families(id) on delete cascade;
alter table pantry           add column if not exists family_id uuid references families(id) on delete cascade;

-- Seed the original family
insert into families (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Familjen')
on conflict (id) do nothing;

-- Seed the four original family members
insert into family_members (family_id, name, color, role) values
  ('00000000-0000-0000-0000-000000000001', 'Fredrik', '#c8f064', 'owner'),
  ('00000000-0000-0000-0000-000000000001', 'Camilla', '#ff9de2', 'member'),
  ('00000000-0000-0000-0000-000000000001', 'Emilia',  '#6fd4ff', 'member'),
  ('00000000-0000-0000-0000-000000000001', 'Celvin',  '#ffb86c', 'member')
on conflict do nothing;

-- Backfill existing rows with the seeded family id
update schedule_events set family_id = '00000000-0000-0000-0000-000000000001' where family_id is null;
update meal_plan        set family_id = '00000000-0000-0000-0000-000000000001' where family_id is null;
update pantry           set family_id = '00000000-0000-0000-0000-000000000001' where family_id is null;

-- Now make family_id not-null
alter table schedule_events alter column family_id set not null;
alter table meal_plan        alter column family_id set not null;
alter table pantry           alter column family_id set not null;
