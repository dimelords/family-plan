-- Body measurements log
-- Tracks weight, circumference measurements, and estimated body fat %
-- Uses the US Navy method for BF% estimation (calculated client-side, stored here)

create table body_log (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  member_name   text not null,
  logged_at     date not null default current_date,

  -- Weight
  weight_kg     numeric(5,2),

  -- Circumference measurements (cm)
  waist_cm      numeric(5,1),
  hip_cm        numeric(5,1),   -- women only (used in Navy BF% formula)
  neck_cm       numeric(5,1),
  chest_cm      numeric(5,1),
  arm_cm        numeric(5,1),   -- flexed, dominant arm
  thigh_cm      numeric(5,1),

  -- Estimated body fat % (US Navy method, computed client-side)
  estimated_bf_pct numeric(4,1),

  notes         text,
  created_at    timestamptz not null default now(),

  -- One entry per person per day
  unique (family_id, member_name, logged_at)
);

-- RLS
alter table body_log enable row level security;

create policy "family members can manage their body_log"
  on body_log for all
  using (family_id = my_family_id())
  with check (family_id = my_family_id());

-- Index for trend queries
create index body_log_member_date_idx on body_log (family_id, member_name, logged_at desc);
