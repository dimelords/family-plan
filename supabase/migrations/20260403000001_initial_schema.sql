-- Initial schema migration
-- Captures the existing single-family tables plus multi-tenancy additions

-- Families
create table if not exists families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- Family members (people within a family, linked optionally to an auth user)
create table if not exists family_members (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  color       text not null default '#c8f064',
  role        text not null default 'member' check (role in ('owner', 'member')),
  created_at  timestamptz not null default now()
);

-- Schedule events
create table if not exists schedule_events (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  day         date not null,
  person      text not null,
  title       text not null,
  time_start  time,
  tag         text check (tag in ('SKOLA', 'GYM', 'VILA'))
);

-- Meal plan
create table if not exists meal_plan (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  day         date not null,
  meal_type   text not null check (meal_type in ('F', 'L', 'M')),
  description text not null
);

-- Pantry
create table if not exists pantry (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  item          text not null,
  is_leftover   boolean not null default false,
  expires_date  date,
  added_date    date not null default current_date
);
