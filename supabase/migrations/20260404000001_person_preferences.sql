-- Person preferences: one row per family member
-- Drives feature gating, AI personalisation and onboarding state

create table person_preferences (
  id                    uuid primary key default gen_random_uuid(),
  family_id             uuid not null references families(id) on delete cascade,
  family_member_id      uuid not null references family_members(id) on delete cascade,

  -- Demographics (used for feature gating + AI context)
  date_of_birth         date,
  height_cm             numeric(5,1),
  gender                text check (gender in ('male','female','other')),

  -- Goals
  training_goal         text check (training_goal in ('muscle_gain','weight_loss','endurance','general_fitness')),
  meal_goal             text check (meal_goal in ('weight_loss','muscle_gain','maintenance')),
  experience_level      text check (experience_level in ('beginner','intermediate','advanced')),

  -- Preferred training days (0=Mon … 6=Sun)
  preferred_training_days  int[] not null default '{}',

  -- Feature flags (owner can override for minors)
  enable_training       boolean not null default true,
  enable_nutrition_ai   boolean not null default true,
  enable_body_tracking  boolean not null default false,

  onboarding_completed  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (family_member_id)
);

-- Auto-update updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger person_preferences_updated_at
  before update on person_preferences
  for each row execute function touch_updated_at();

-- RLS
alter table person_preferences enable row level security;

create policy "family can read preferences"
  on person_preferences for select
  using (family_id = my_family_id());

create policy "family can insert preferences"
  on person_preferences for insert
  with check (family_id = my_family_id());

create policy "family can update preferences"
  on person_preferences for update
  using (family_id = my_family_id());
