-- Progress photos
-- Photos are stored in Supabase Storage bucket "progress-photos"
-- This table keeps metadata and links them to a family member + date.

create table progress_photos (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references families(id) on delete cascade,
  member_name  text not null,
  taken_at     date not null default current_date,
  storage_path text not null,           -- path inside the bucket
  label        text,                    -- e.g. 'front', 'side', 'back'
  notes        text,
  ai_analysis  text,                    -- Claude Vision comparison result
  created_at   timestamptz not null default now()
);

alter table progress_photos enable row level security;

create policy "family members can manage their progress_photos"
  on progress_photos for all
  using (family_id = my_family_id())
  with check (family_id = my_family_id());

create index progress_photos_member_date_idx
  on progress_photos (family_id, member_name, taken_at desc);

-- Storage bucket (created via Supabase dashboard or CLI, not SQL)
-- Bucket name: "progress-photos"
-- We create a storage policy here so the family can read/write their own photos.

-- Storage RLS: insert
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- Allow authenticated family members to manage their own objects
-- Objects are stored as: {family_id}/{member_name}/{filename}
create policy "family upload progress photos"
  on storage.objects for insert
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = my_family_id()::text
  );

create policy "family read progress photos"
  on storage.objects for select
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = my_family_id()::text
  );

create policy "family delete progress photos"
  on storage.objects for delete
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = my_family_id()::text
  );
