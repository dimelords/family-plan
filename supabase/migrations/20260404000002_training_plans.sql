-- Training plans and sessions

create table training_plans (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references families(id) on delete cascade,
  person         text not null,
  start_date     date not null,
  end_date       date not null,
  goal_snapshot  text,   -- AI summary of goals used when generating this plan
  created_at     timestamptz not null default now()
);

create table training_sessions (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references training_plans(id) on delete cascade,
  family_id      uuid not null references families(id) on delete cascade,
  person         text not null,
  scheduled_date date not null,
  workout_type   text not null,   -- e.g. 'Ben & Glutes', 'Rygg & Biceps'
  exercises      jsonb not null default '[]',
  notes          text,
  completed      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- RLS
alter table training_plans    enable row level security;
alter table training_sessions enable row level security;

create policy "family read plans"    on training_plans for select using (family_id = my_family_id());
create policy "family insert plans"  on training_plans for insert with check (family_id = my_family_id());
create policy "family delete plans"  on training_plans for delete using (family_id = my_family_id());

create policy "family read sessions"   on training_sessions for select using (family_id = my_family_id());
create policy "family insert sessions" on training_sessions for insert with check (family_id = my_family_id());
create policy "family update sessions" on training_sessions for update using (family_id = my_family_id());
create policy "family delete sessions" on training_sessions for delete using (family_id = my_family_id());
