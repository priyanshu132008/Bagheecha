-- 0002_rls.sql — Row-Level Security policies.
--
-- Every menu table is RLS-enabled, which means the *default* is deny.
-- The policies below open up exactly what's safe: public SELECT on
-- every menu table (the public site reads via the anon key), and
-- admin-only writes via the `is_admin()` SQL helper.
--
-- `is_admin()` is `security definer` so it runs with the function
-- owner's privileges — meaning it can read `profiles` even when the
-- calling user doesn't. That's the standard Supabase pattern. The
-- `admin reads all profiles` policy looks redundant alongside it but
-- is kept so the admin dashboard's "list all users" view can run
-- via the anon client (with RLS filtering) rather than elevating.

/* ------------------------------------------------------------------
   The admin gate
------------------------------------------------------------------- */

create or replace function is_admin() returns boolean
  language sql security definer stable as $$
    select exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    );
  $$;

/* ------------------------------------------------------------------
   Enable RLS on every menu table. RLS-off + RLS-on side-by-side is
   the single most common Supabase bug; doing this in the migration
   means a freshly-seeded DB cannot accidentally accept writes from
   the anon client.
------------------------------------------------------------------- */

alter table food_categories enable row level security;
alter table food_groups     enable row level security;
alter table food_dishes     enable row level security;
alter table bar_categories  enable row level security;
alter table bar_pours       enable row level security;
alter table profiles        enable row level security;

/* ------------------------------------------------------------------
   Public read — every menu table is readable by the anon key.

   Without these policies, the public site (which fetches via the
   anon client through Server Components) returns zero rows on every
   query, and the menu page goes blank. The seeded data is not
   sensitive — it's printed on a public menu card — so the gate is
   open.
------------------------------------------------------------------- */

create policy "public read food_categories" on food_categories
  for select using (true);
create policy "public read food_groups" on food_groups
  for select using (true);
create policy "public read food_dishes" on food_dishes
  for select using (true);
create policy "public read bar_categories" on bar_categories
  for select using (true);
create policy "public read bar_pours" on bar_pours
  for select using (true);

/* ------------------------------------------------------------------
   Profiles — a user can read their own row, admins can read all.
------------------------------------------------------------------- */

create policy "own profile read" on profiles
  for select using (auth.uid() = id);

create policy "admin reads all profiles" on profiles
  for select using (is_admin());

/* ------------------------------------------------------------------
   Admin-only writes on every menu table.
------------------------------------------------------------------- */

create policy "admin write food_categories" on food_categories
  for all using (is_admin()) with check (is_admin());
create policy "admin write food_groups" on food_groups
  for all using (is_admin()) with check (is_admin());
create policy "admin write food_dishes" on food_dishes
  for all using (is_admin()) with check (is_admin());
create policy "admin write bar_categories" on bar_categories
  for all using (is_admin()) with check (is_admin());
create policy "admin write bar_pours" on bar_pours
  for all using (is_admin()) with check (is_admin());
