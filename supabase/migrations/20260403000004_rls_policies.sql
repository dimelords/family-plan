-- Row Level Security policies
-- Each family's data is only visible to members of that family

alter table families         enable row level security;
alter table family_members   enable row level security;
alter table schedule_events  enable row level security;
alter table meal_plan        enable row level security;
alter table pantry           enable row level security;

-- Helper: returns the family_id for the currently logged-in user
create or replace function my_family_id()
returns uuid language sql stable security definer as $$
  select family_id from family_members
  where user_id = auth.uid()
  limit 1;
$$;

-- families: members can read their own family
create policy "members can read own family"
  on families for select
  using (id = my_family_id());

-- families: owners can update their family name
create policy "owners can update family"
  on families for update
  using (id = my_family_id());

-- family_members: readable by all members of the same family
create policy "members can read family members"
  on family_members for select
  using (family_id = my_family_id());

-- schedule_events: full CRUD for family members
create policy "family read events"   on schedule_events for select using (family_id = my_family_id());
create policy "family insert events" on schedule_events for insert with check (family_id = my_family_id());
create policy "family delete events" on schedule_events for delete using (family_id = my_family_id());

-- meal_plan: full CRUD for family members
create policy "family read meals"   on meal_plan for select using (family_id = my_family_id());
create policy "family insert meals" on meal_plan for insert with check (family_id = my_family_id());
create policy "family delete meals" on meal_plan for delete using (family_id = my_family_id());

-- pantry: full CRUD for family members
create policy "family read pantry"   on pantry for select using (family_id = my_family_id());
create policy "family insert pantry" on pantry for insert with check (family_id = my_family_id());
create policy "family delete pantry" on pantry for delete using (family_id = my_family_id());
