-- 0001_init_schema.sql — the menu schema.
--
-- Five tables (food_categories, food_groups, food_dishes, bar_categories,
-- bar_pours), one profiles table for the admin role, the updated_at
-- triggers, and the hot-path indexes.
--
-- Created 2026-09-20. The schema was designed to mirror
-- `lib/constants/menu.ts` exactly: every name, every qualifier, every
-- `[half, full]` tuple, every meaningful `null` in the bar price matrix
-- survives the round-trip. See the project's plan at
-- `/Users/priyanshusawant13/.claude/plans/distributed-scribbling-reef.md`
-- for the field-by-field mapping.

create extension if not exists pgcrypto;

/* ------------------------------------------------------------------
   Food categories — the four chapters of the green menu card.
   `slug` is stable across renames; `display_order` is the page order.
------------------------------------------------------------------- */

create table food_categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  blurb         text not null,
  display_order int  not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

/* ------------------------------------------------------------------
   Food groups — the printed "page" within a chapter (e.g. "Non-Veg
   Starters", "Tandoor — Veg"). The page-turn UX in MenuClient.tsx
   keys on `slug`, not on display_order, so a group can be re-ordered
   without breaking navigation state.
------------------------------------------------------------------- */

create table food_groups (
  id               uuid primary key default gen_random_uuid(),
  food_category_id uuid not null references food_categories(id) on delete cascade,
  slug             text not null,
  name             text not null,
  display_order    int  not null,
  unique (food_category_id, slug)
);

/* ------------------------------------------------------------------
   Food dishes — the rows.

   PRICE SHAPE. The source data carries three pricing shapes:
     - `onRequest: true` — the seafood section prints "APS" and asks
       the server.  No price.
     - `[h, f]`          — Half / Full tuples.  Two columns.
     - `number`          — single figure (starters, most mains).
   The check constraint enforces that exactly one shape applies per
   row, so a future admin UI that fills `price_half` without
   `price_full` (or vice versa) is rejected at the DB rather than
   rendering as garbage on the public page.
------------------------------------------------------------------- */

create table food_dishes (
  id            uuid primary key default gen_random_uuid(),
  food_group_id uuid not null references food_groups(id) on delete cascade,
  name          text not null,
  price_half    numeric(10,2) null,
  price_full    numeric(10,2) null,
  price_single  numeric(10,2) null,
  note          text null,
  on_request    boolean not null default false,
  is_featured   boolean not null default false,
  image_url     text null,
  blur_data_url text null,
  display_order int  not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint food_dish_price_shape_chk check (
    (on_request = true
       and price_half is null and price_full is null and price_single is null)
    or (price_half is not null and price_full is not null and price_single is null)
    or (price_single is not null and price_half is null and price_full is null)
  )
);

/* ------------------------------------------------------------------
   Bar categories — the nine lists (vodka, premium-whisky, …, wine,
   mild-beer, strong-beer). `sizes` is the column header row, stored
   as JSONB because the measure set is per-category (5 for spirits,
   3 for wine, 2 for beer) and varies in length.

   Adding a category is a single insert; adding a column would mean
   altering every pour. JSONB is the right shape here.
------------------------------------------------------------------- */

create table bar_categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  sizes         jsonb not null,
  display_order int  not null
);

/* ------------------------------------------------------------------
   Bar pours — the rows. `prices` is a JSONB array aligned
   positionally with the parent category's `sizes`; `null` positions
   are *meaningful absences* (Bombay Sapphire has no 750ml, Corona
   has no 500ml tin) and round-trip through JSONB cleanly.

   `top_shelf_slot` is the position of this pour in the bottle polaroid
   for its category: 1, 2, or 3.  0 means "not on the shelf rail".
   A `check` constraint enforces the 0–3 range; gin has only 2 by
   design (the card lists 2 gins), wine has 3 (Dia Red, Sula Red,
   Dia White).
------------------------------------------------------------------- */

create table bar_pours (
  id              uuid primary key default gen_random_uuid(),
  bar_category_id uuid not null references bar_categories(id) on delete cascade,
  name            text not null,
  prices          jsonb not null,
  note            text null,
  is_top_shelf    boolean not null default false,
  top_shelf_slot  smallint not null default 0 check (top_shelf_slot between 0 and 3),
  image_url       text null,
  blur_data_url   text null,
  display_order   int  not null
);

/* ------------------------------------------------------------------
   Profiles — the role table for authenticated users.

   Every Supabase auth.users row may have zero or one matching
   profiles row. A profile's `role` is 'viewer' by default; the seed
   flips the owner's row to 'admin'. The `is_admin()` helper in
   `0002_rls.sql` reads this table to gate writes.
------------------------------------------------------------------- */

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'viewer',
  updated_at timestamptz not null default now()
);

/* ------------------------------------------------------------------
   updated_at maintenance
------------------------------------------------------------------- */

create or replace function touch_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_food_categories_uat
  before update on food_categories
  for each row execute function touch_updated_at();

create trigger trg_food_dishes_uat
  before update on food_dishes
  for each row execute function touch_updated_at();

create trigger trg_profiles_uat
  before update on profiles
  for each row execute function touch_updated_at();

/* ------------------------------------------------------------------
   Hot-path indexes

   Most queries are scoped to one category and ordered by
   display_order; the (parent_id, display_order) composite covers
   both the filter and the sort in a single index walk. The
   partial indexes on the boolean flags only carry the small
   minority of rows that are flagged, so they stay tiny.
------------------------------------------------------------------- */

create index food_groups_category_idx on food_groups (food_category_id, display_order);
create index food_dishes_group_idx    on food_dishes (food_group_id, display_order);
create index food_dishes_featured_idx on food_dishes (is_featured) where is_featured = true;
create index bar_pours_category_idx   on bar_pours (bar_category_id, display_order);
create index bar_pours_top_shelf_idx  on bar_pours (bar_category_id, top_shelf_slot)
  where is_top_shelf = true;
