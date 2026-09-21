-- 0003_storage.sql — the menu-assets bucket and its policies.
--
-- A single public bucket holds every image the admin uploads. Public
-- read is required so the public site (rendering `<Image src=...>`)
-- can fetch them; admin write is required because only authenticated
-- admins can push new images via the dashboard.
--
-- The bucket is intentionally permissive on the read side (any
-- visitor, including unauthenticated) and tight on writes (must be
-- admin). The host's Next.js image pipeline fetches through
-- `next.config.ts`'s `images.remotePatterns`, which scopes to
-- `/storage/v1/object/public/menu-assets/**` — paths outside that
-- never reach the bucket through next/image even if added later.

insert into storage.buckets (id, name, public)
  values ('menu-assets', 'menu-assets', true)
  on conflict (id) do nothing;

-- Anyone can read.
create policy "public read menu-assets" on storage.objects
  for select using (bucket_id = 'menu-assets');

-- Only admins can write/update/delete.
create policy "admin write menu-assets" on storage.objects
  for insert with check (bucket_id = 'menu-assets' and is_admin());
create policy "admin update menu-assets" on storage.objects
  for update using (bucket_id = 'menu-assets' and is_admin());
create policy "admin delete menu-assets" on storage.objects
  for delete using (bucket_id = 'menu-assets' and is_admin());
