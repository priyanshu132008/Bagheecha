import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";
import {
  BAR,
  FOOD,
  isVegFor,
  type BarCategory,
  type FoodCategory,
  type Price,
} from "@/lib/constants/menu";
import type { Database } from "@/lib/supabase/database.types";
import { bottleToneFor } from "@/lib/menu/imageMeta";

/**
 * Local row shapes for the nested-select responses.
 *
 * The hand-rolled `database.types.ts` doesn't declare Relationships,
 * so PostgREST's response types infer as `never[]` on a nested
 * `select(...)` call. We declare the row shape here, cast the
 * response once, and the reshape downstream is fully typed.
 */
type FoodCategoryRow = Pick<
  Database["public"]["Tables"]["food_categories"]["Row"],
  "id" | "slug" | "name" | "blurb" | "display_order"
> & {
  groups: Array<
    Pick<
      Database["public"]["Tables"]["food_groups"]["Row"],
      "id" | "slug" | "name" | "display_order"
    > & {
      dishes: Array<
        Pick<
          Database["public"]["Tables"]["food_dishes"]["Row"],
          | "id"
          | "name"
          | "price_half"
          | "price_full"
          | "price_single"
          | "note"
          | "on_request"
          | "display_order"
        >
      >;
    }
  >;
};

type BarCategoryRow = Pick<
  Database["public"]["Tables"]["bar_categories"]["Row"],
  "id" | "slug" | "name" | "sizes" | "display_order"
> & {
  pours: Array<
    Pick<
      Database["public"]["Tables"]["bar_pours"]["Row"],
      "id" | "name" | "prices" | "note" | "display_order"
    >
  >;
};

/**
 * Public menu queries.
 *
 * Every function in this module returns a shape that exactly
 * matches the existing TypeScript types in `lib/constants/menu.ts`,
 * so the components consuming them (`MenuClient.tsx`, `Hero.tsx`,
 * `BottleCollage.tsx`) don't need to know the data is now sourced
 * from Supabase — they read the same `FoodCategory`, `BarCategory`,
 * `Dish`, and `Pour` types they always did.
 *
 * FALLBACK. If `SUPABASE_FALLBACK_TO_STATIC === "true"`, every
 * function short-circuits to the hardcoded constants. This is the
 * deploy safety net — if the DB is unreachable during a deploy, the
 * site keeps rendering the menu unchanged.
 *
 * CACHING. None here. Next.js' RSC cache + `revalidatePath()` from
 * the admin's Server Actions handle invalidation. Adding a per-
 * fetch `revalidate = 3600` constant would make the page stale if
 * the admin adds a dish between rebuilds.
 */

const FALLBACK = process.env.SUPABASE_FALLBACK_TO_STATIC === "true";

/* ------------------------------------------------------------------
   Featured dishes — the 8 plates the kitchen card renders.
------------------------------------------------------------------- */

export type FeaturedDish = {
  /** The label printed under the photo (e.g. "Chilli Chicken"). */
  label: string;
  /** A description shown beneath the label, or empty. */
  caption: string;
  /** Alt text for screen readers. */
  alt: string;
  /** Resolved URL — either `/images/...` or a Supabase Storage URL. */
  imageUrl: string;
  /**
   * Base64 blur data URL. Pre-seeded rows have this set by
   * `precompute-blur.ts`; admin-uploaded images have it set at
   * upload time by `plaiceholder`. Pass straight to `<Image
   * placeholder="blur" blurDataURL={...}>`.
   */
  blurDataUrl: string | null;
  /**
   * `object-position` for `<Image>` when the subject sits off-centre.
   * Not stored in the DB — the hero/kitchen reads it from the seed's
   * `images.ts` lookup (`lib/menu/imageMeta.ts`). New admin uploads
   * get `null` and fall back to a centred crop.
   */
  focal: string | null;
};

export async function getFeaturedDishes(): Promise<FeaturedDish[]> {
  if (FALLBACK) {
    const { FEATURED_DISHES, NEW_DISHES } = await import("@/lib/constants/images");
    return [...FEATURED_DISHES, ...NEW_DISHES].map((d) => ({
      label: d.label,
      caption: d.caption,
      alt: d.alt,
      imageUrl: d.src.src,
      blurDataUrl: d.src.blurDataURL ?? null,
      focal: d.focal ?? null,
    }));
  }

  const { dishMetaFor } = await import("@/lib/menu/imageMeta");
  const sb = await getSupabaseServer();
  const { data, error } = await sb
    .from("food_dishes")
    .select("name, note, image_url, blur_data_url")
    .eq("is_featured", true)
    .order("display_order");
  if (error) throw error;

  /**
   * Match the seeded `image_url` back to its photo's display metadata
   * via `dishMetaFor`. The pre-CMS build carried this metadata in
   * `lib/constants/images.ts` via static imports — the server-only
   * `queries.ts` can't pull `next/image`'s `StaticImageData` graph,
   * so the metadata lives in `lib/menu/imageMeta.ts` as plain
   * strings, keyed by filename.
   *
   * The lookup returns the photo's *editorial* label and caption
   * (e.g. "Chilli Chicken" / "Glazed with whole red chilli and
   * spring onion.") rather than the menu row's `name` (which is
   * "Chicken Chilly" — the kitchen's own spelling, not the one the
   * photograph was shot under).
   *
   * For admin-uploaded images there is no match, and we fall back to
   * the dish name and note from the DB row.
   */
  return (data ?? []).map((d) => {
    const meta = dishMetaFor(d.image_url);
    return {
      label: meta?.label ?? d.name,
      caption: meta?.caption ?? d.note ?? "",
      alt: meta?.alt ?? d.name,
      imageUrl: d.image_url ?? "",
      blurDataUrl: d.blur_data_url,
      focal: meta?.focal ?? null,
    };
  });
}

/* ------------------------------------------------------------------
   Top-shelf bottles — keyed by bar-category slug.

   The bottle polaroid is per-category: vodka shows its three
   (Smirnoff / Romanov / Absolut); gin shows its two. The seed
   stamps `top_shelf_slot = 1|2|3` on each pour row that's part of
   a category's polaroid, and `top_shelf_slot = 0` elsewhere.
------------------------------------------------------------------- */

export type TopShelfBottle = {
  /** Pour id, used as React key. */
  id: string;
  /** Brand as printed on the bottle. */
  brand: string;
  /** Slot 1, 2, or 3 within the polaroid. */
  slot: number;
  /** Static or bucket URL. */
  imageUrl: string;
  /** Optional blur data URL. */
  blurDataUrl: string | null;
  /**
   * `tone` from the original `Bottle` type in `lib/constants/images.ts`.
   * Used to drive the back-of-collage tint on `BottleCollage.tsx`.
   * Defaults to "amber" when missing (the most common value).
   */
  tone: "clear" | "amber" | "dark" | "green" | "ruby";
};

export async function getTopShelfByCategory(): Promise<Record<string, TopShelfBottle[]>> {
  if (FALLBACK) {
    const { BAR_BOTTLES, BOTTLES } = await import("@/lib/constants/images");
    const out: Record<string, TopShelfBottle[]> = {};
    for (const [catSlug, ids] of Object.entries(BAR_BOTTLES)) {
      out[catSlug] = ids.map((id, i) => {
        const b = BOTTLES[id];
        return {
          id,
          brand: b.brand,
          slot: i + 1,
          imageUrl: b.src.src,
          blurDataUrl: b.src.blurDataURL ?? null,
          tone: b.tone,
        };
      });
    }
    return out;
  }

  const sb = await getSupabaseServer();
  const { data: cats } = await sb
    .from("bar_categories")
    .select("id, slug");
  if (!cats) return {};

  const { data: pours, error } = await sb
    .from("bar_pours")
    .select("id, name, image_url, blur_data_url, top_shelf_slot, bar_category_id")
    .eq("is_top_shelf", true)
    .gt("top_shelf_slot", 0)
    .order("top_shelf_slot");
  if (error) throw error;

  const out: Record<string, TopShelfBottle[]> = {};
  for (const cat of cats) out[cat.slug] = [];

  for (const p of pours ?? []) {
    const cat = cats.find((c) => c.id === p.bar_category_id);
    if (!cat) continue;
    out[cat.slug].push({
      id: p.id,
      brand: p.name,
      slot: p.top_shelf_slot,
      imageUrl: p.image_url ?? "",
      blurDataUrl: p.blur_data_url,
      tone: bottleToneFor(p.image_url),
    });
  }

  return out;
}

/* ------------------------------------------------------------------
   Food categories — the full nested tree.

   One Supabase query joins food_categories → food_groups →
   food_dishes via PostgREST's nested selects. The result is reshaped
   to match `FoodCategory[]` from the constants file: array order
   is preserved, `[half, full]` tuples are reconstructed, and
   `note` / `onRequest` round-trip exactly.
------------------------------------------------------------------- */

export async function getFoodCategories(): Promise<FoodCategory[]> {
  if (FALLBACK) return FOOD;

  const sb = await getSupabaseServer();
  const { data, error } = await sb
    .from("food_categories")
    .select(`
      id, slug, name, blurb, display_order,
      groups:food_groups(
        id, slug, name, display_order,
        dishes:food_dishes(
          id, name,
          price_half, price_full, price_single,
          note, on_request,
          display_order
        )
      )
    `)
    .order("display_order");
  if (error) throw error;
  const rows = (data ?? []) as unknown as FoodCategoryRow[];

  return rows.map((c) => ({
    id: c.slug,
    name: c.name,
    blurb: c.blurb,
    groups: (c.groups ?? [])
      .sort((a, b) => a.display_order - b.display_order)
      .map((g) => ({
        id: g.slug,
        name: g.name,
        items: (g.dishes ?? [])
          .sort((a, b) => a.display_order - b.display_order)
          .map((d) => {
            const price: Price | undefined =
              d.price_half != null && d.price_full != null
                ? [Number(d.price_half), Number(d.price_full)]
                : d.price_single != null
                  ? Number(d.price_single)
                  : undefined;
            const out: FoodCategory["groups"][number]["items"][number] = {
              name: d.name,
            };
            if (price !== undefined) out.price = price;
            if (d.note) out.note = d.note;
            if (d.on_request) out.onRequest = true;
            // Turn 7: the food_dishes schema doesn't yet carry an
            // `isVeg` column, so the marker is derived from the dish
            // name via the same heuristic `lib/constants/menu.ts` runs
            // on its own `FOOD` fallback. When the schema lands its
            // own column, this becomes the second-best answer — read
            // the column first, fall through to the name here only if
            // it is null. For now, every row gets one of:
            //   true → green marker, false → brown marker,
            //   undefined → row omits the marker.
            const veg = isVegFor(d.name);
            if (veg !== undefined) out.isVeg = veg;
            return out;
          }),
      })),
  }));
}

/* ------------------------------------------------------------------
   Bar categories — same shape as the kitchen side, but the prices
   field is a JSONB array of `number | null` whose length matches
   the parent category's `sizes` array.
------------------------------------------------------------------- */

export async function getBarCategories(): Promise<BarCategory[]> {
  if (FALLBACK) return BAR;

  const sb = await getSupabaseServer();
  const { data, error } = await sb
    .from("bar_categories")
    .select(`
      id, slug, name, sizes, display_order,
      pours:bar_pours(
        id, name, prices, note, display_order
      )
    `)
    .order("display_order");
  if (error) throw error;
  const rows = (data ?? []) as unknown as BarCategoryRow[];

  return rows.map((c) => ({
    id: c.slug,
    name: c.name,
    sizes: c.sizes as string[],
    items: (c.pours ?? [])
      .sort((a, b) => a.display_order - b.display_order)
      .map((p) => {
        const out: BarCategory["items"][number] = {
          name: p.name,
          prices: p.prices as (number | null)[],
        };
        if (p.note) out.note = p.note;
        return out;
      }),
  }));
}

/* ------------------------------------------------------------------
   Line count — printed in the menu section's lede.

   Two `count: 'exact', head: true` queries, one per table.
   Head-only queries never transfer rows, so this is cheap even
   with 372 menu entries.
------------------------------------------------------------------- */

export async function getMenuLineCount(): Promise<number> {
  if (FALLBACK) {
    return FOOD.reduce(
      (s, c) => s + c.groups.reduce((gs, g) => gs + g.items.length, 0),
      0,
    ) + BAR.reduce((s, c) => s + c.items.length, 0);
  }

  const sb = await getSupabaseServer();
  const [{ count: dishes }, { count: pours }] = await Promise.all([
    sb.from("food_dishes").select("id", { count: "exact", head: true }),
    sb.from("bar_pours").select("id", { count: "exact", head: true }),
  ]);
  return (dishes ?? 0) + (pours ?? 0);
}
