-- Supabase Storage setup for Aquabeast WRS
-- Run in Supabase SQL Editor AFTER `supabase/schema.sql`.
--
-- Creates bucket `wrs-assets` and Storage policies for seller uploads.
--
-- Used paths (by app):
-- - Store logo:   <seller_id>/logo/<timestamp>.<ext>
-- - Product img:  <seller_id>/product/<timestamp>.<ext>
-- - Ewallet QR:   <seller_id>/qr/<timestamp>.<ext>

-- 1) Bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wrs-assets',
  'wrs-assets',
  true,
  10485760, -- 10MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 2) Policies (Storage RLS)
-- NOTE: storage.objects uses RLS; policies are required for read/write.

-- Read: allow public read for this bucket (since bucket is public)
drop policy if exists "public read wrs-assets" on storage.objects;
create policy "public read wrs-assets"
on storage.objects for select
using (bucket_id = 'wrs-assets');

-- Insert: only authenticated sellers may upload into their own folder
drop policy if exists "seller upload own wrs-assets" on storage.objects;
create policy "seller upload own wrs-assets"
on storage.objects for insert
with check (
  bucket_id = 'wrs-assets'
  and auth.uid() is not null
  and public.is_seller(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Update: only the owner seller can replace/move their objects
drop policy if exists "seller update own wrs-assets" on storage.objects;
create policy "seller update own wrs-assets"
on storage.objects for update
using (
  bucket_id = 'wrs-assets'
  and auth.uid() is not null
  and public.is_seller(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'wrs-assets'
  and auth.uid() is not null
  and public.is_seller(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete: only the owner seller can delete their objects
drop policy if exists "seller delete own wrs-assets" on storage.objects;
create policy "seller delete own wrs-assets"
on storage.objects for delete
using (
  bucket_id = 'wrs-assets'
  and auth.uid() is not null
  and public.is_seller(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
);

