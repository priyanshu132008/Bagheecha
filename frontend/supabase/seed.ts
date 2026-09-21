/**
 * supabase/seed.ts — seeds the menu tables from `lib/constants/menu.ts`
 * and `lib/constants/images.ts`.
 *
 * Run with:
 *
 *     npx tsx supabase/seed.ts
 *
 * The script is idempotent: it deletes every row from the five menu
 * tables (and the seeded profile rows) and re-inserts everything from
 * the constants. Order of operations matters — child rows before
 * parents would hit FK constraints, so:
 *
 *     1. food_dishes
 *     2. food_groups
 *     3. food_categories
 *     4. bar_pours
 *     5. bar_categories
 *     6. profiles
 *
 * ENVIRONMENT. Reads `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`
 * from `.env.local`. The service-role key bypasses RLS — this script
 * should NEVER run with the anon key, otherwise it would silently
 * fail at the first insert.
 *
 * WHAT THIS SCRIPT DOES NOT DO.
 *
 *   - It does not upload images. The `image_url` field on each seeded
 *     row points at a path under `/images/*` (i.e. `public/images/…`),
 *     so the public page renders identically to before. Day-two
 *     uploads from the admin dashboard go through `uploadImageAction`,
 *     which writes to the `menu-assets` bucket and updates the row's
 *     `image_url` to the bucket URL.
 *
 *   - It does not pre-fill `blur_data_url`. `supabase/scripts/precompute-blur.ts`
 *     runs after this seed to read each `/images/...` file from
 *     `public/`, run `plaiceholder` on it, and write the resulting
 *     base64 string into `blur_data_url`.
 *
 *   - It does not create the `auth.users` row for the admin. The CLI
 *     command `npx supabase auth admin create-user --email <email>`
 *     does that. This script then UPDATEs `profiles` to link the new
 *     user's id with `role = 'admin'`. Until that one-time step is
 *     done, the admin dashboard 401s.
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// `dotenv/config` reads `.env`, but Next.js' convention is `.env.local`.
// Point dotenv at the file Next.js uses so the seed sees the same
// environment the app does.
loadEnv({ path: resolve(__dirname, "..", ".env.local") });

import {
  BAR,
  FOOD,
  type Dish,
  type FoodCategory,
  type BarCategory,
} from "../lib/constants/menu";

/**
 * Why we DON'T import `lib/constants/images.ts` here.
 *
 * The image registry imports each JPEG as a static asset:
 *
 *     import bottleSmirnoff from "@/public/images/bottle-smirnoff.jpeg";
 *
 * Next.js' Webpack pipeline handles that fine at build time, but
 * running this file under `tsx` would try to parse JPEG bytes as
 * TypeScript and crash on the first import. The only data the seed
 * actually needs from `images.ts` is the `BAR_BOTTLES` map (category
 * → three bottle ids) and the convention that every bottle lives
 * at `/images/bottle-<id>.jpeg`. So both are duplicated below — a
 * literal copy of `BAR_BOTTLES` from `images.ts:509`, kept in sync
 * by hand. If you add or rename a bottle, update both places.
 *
 * Keeping the seed free of the static-import chain also means it
 * runs as a standalone Node script with no Next.js build steps.
 */

/**
 * Hand-copy of `BAR_BOTTLES` from `lib/constants/images.ts:509`.
 * Keep this in sync if you rename a bottle.
 */
const BAR_BOTTLES: Record<string, readonly string[]> = {
  vodka: ["smirnoff", "romanov", "absolut"],
  "premium-whisky": ["signature", "blenders-pride", "royal-stag-barrel"],
  scotch: ["glenwalk", "ballantines", "jameson"],
  "regular-whisky": ["oaksmith", "royal-stag", "mcdowell-no1"],
  rum: ["bacardi-limon", "bacardi-white", "bacardi-black"],
  gin: ["blue-riband", "bombay-sapphire"],
  wine: ["dia-red", "sula-red", "dia-white"],
  "mild-beer": ["budweiser-mild", "carlsberg-mild", "kingfisher-ultra"],
  "strong-beer": ["budweiser-magnum", "carlsberg-elephant", "tuborg-strong"],
};

// ------------------------------------------------------------------
// Environment
// ------------------------------------------------------------------

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Set them in .env.local and re-run.",
  );
  process.exit(1);
}

const supabase: SupabaseClient = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/**
 * Maps a `Dish.price` to the three numeric columns the schema accepts.
 *
 *   undefined               → all three null
 *   { onRequest: true }     → all three null (handled separately)
 *   number                  → price_single = n
 *   [h, f]                  → price_half = h, price_full = f
 *
 * The CHECK constraint `food_dish_price_shape_chk` enforces the
 * shape on the DB side, so a malformed row would 500 here.
 */
const dishPriceColumns = (
  dish: Dish,
): { price_half: number | null; price_full: number | null; price_single: number | null } => {
  if (dish.onRequest || dish.price === undefined) {
    return { price_half: null, price_full: null, price_single: null };
  }
  if (Array.isArray(dish.price)) {
    return { price_half: dish.price[0], price_full: dish.price[1], price_single: null };
  }
  return { price_half: null, price_full: null, price_single: dish.price };
};

/**
 * Maps `featured` photo labels (from `images.ts`) to the closest
 * `food_dishes` row that should be flagged `is_featured = true` for
 * the kitchen plate row.
 *
 * The labels were set by the photographer, not transcribed from the
 * menu card; some are approximate matches to the printed names. The
 * intent is to flag the closest existing dish for each photo — the
 * admin can later swap them via the dashboard.
 *
 * For "Sesame Chicken" and "Papdi Chaat", which have no reasonable
 * match in the printed menu, the seed inserts new dish rows so the
 * kitchen plate row still has 8 entries and the page renders
 * identical to the pre-CMS version.
 */
type FeaturedMapping = {
  label: string;
  /** The dish's `name` to match. */
  matchName: string;
  /**
   * Group to fall back to if `matchName` isn't found. Used for
   * "Sesame Chicken" / "Papdi Chaat" which the seed inserts as
   * new rows.
   */
  fallbackGroupId?: string;
  imageUrl: string;
};

const FEATURED: FeaturedMapping[] = [
  { label: "Chilli Chicken", matchName: "Chicken Chilly", imageUrl: "/images/dish-chilli-chicken.jpeg" },
  { label: "Butter Chicken", matchName: "Butter Chicken", imageUrl: "/images/dish-butter-chicken.jpeg" },
  { label: "Sesame Chicken", matchName: "__NEW__", fallbackGroupId: "chinese-nonveg-starters", imageUrl: "/images/dish-sesame-chicken.jpeg" },
  { label: "Fried Rice", matchName: "Chicken Fried Rice", imageUrl: "/images/dish-fried-rice.jpeg" },
  { label: "Paneer Tikka", matchName: "Paneer Tikka Masala", imageUrl: "/images/dish-paneer-tikka.jpeg" },
  { label: "Tandoori Chicken", matchName: "Chicken Tandoori", imageUrl: "/images/dish-tandoori-chicken.jpeg" },
  { label: "Prawns Tawa Fry", matchName: "Prawns Tawa Fry", imageUrl: "/images/dish-prawns-tawa.jpeg" },
  { label: "Papdi Chaat", matchName: "__NEW__", fallbackGroupId: "veg-starters", imageUrl: "/images/dish-papdi-chaat.jpeg" },
];

/**
 * Maps `top_shelf` bottles (from `BAR_BOTTLES`) to bar pours.
 *
 * `BAR_BOTTLES[catSlug][slot-1]` is the bottle id; the pour row is
 * the one whose `name` (case-insensitive) matches the bottle's
 * `brand` field in `BOTTLES[id]`.
 *
 * The `categorySlug → expected pour name` mapping handles a couple
 * of small wording mismatches — the menu prints "Bacardi Limón"
 * with an accent, while the bottle registry strips it.
 */
const TOP_SHELF_NAMES: Record<string, string[]> = {
  vodka: ["Smirnoff", "Romanov", "Absolut"],
  "premium-whisky": ["Signature", "Blenders Pride", "Royal Stag Barrel"],
  scotch: ["Glen Walk", "Ballantine", "Jameson"],
  "regular-whisky": ["Oaksmith Silver", "Royal Stag", "MCD No. 1"],
  rum: ["Bacardi Limon", "Bacardi White", "Bacardi Black"],
  gin: ["Blue Riband Plain", "Bombay Sapphire"],
  wine: ["Dia Red Wine", "Sula Red", "Dia White Wine"],
  "mild-beer": ["Budweiser Mild", "Carlsberg Mild", "Kingfisher Ultra"],
  "strong-beer": ["Budweiser Magnum", "Carlsberg Elephant", "Tuborg Strong"],
};

/**
 * Inverse map from `BottleId` (e.g. `"smirnoff"`) to its
 * `/images/bottle-<id>.jpeg` static URL. Used so each `is_top_shelf`
 * row has an `image_url` that resolves through Next.js' image
 * pipeline on day one, before any admin upload.
 */
const bottleImageUrl = (id: string) => `/images/bottle-${id}.jpeg`;

/**
 * Some featured photo labels don't match any existing dish exactly.
 * The seed inserts a new row in the listed group so the kitchen
 * plate row still has 8 entries. Names are written verbatim — the
 * caption printed next to the photo (in `images.ts`) is shown as
 * `note` on the page.
 */
const NEW_DISH_FOR_LABEL: Record<string, { name: string; note: string }> = {
  "Sesame Chicken": {
    name: "Sesame Chicken",
    note: "Glazed, then scattered with toasted sesame.",
  },
  "Papdi Chaat": {
    name: "Papdi Chaat",
    note: "Crisp wafers, three chutneys, fresh pomegranate.",
  },
};

// ------------------------------------------------------------------
// Wipe + reinsert
// ------------------------------------------------------------------

async function wipe() {
  // Child rows first.
  await supabase.from("bar_pours").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("bar_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("food_dishes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("food_groups").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("food_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  // Don't delete every profile — the admin user might already exist
  // and is mapped to one of these rows. We delete only viewer roles
  // and any admin whose email doesn't match the seed owner.
  await supabase.from("profiles").delete().eq("role", "viewer");
}

async function insertFood() {
  // Build a flat list of (groupSlug, dish, group) so we can resolve
  // featured-dish matches later.
  const allDishes: {
    categorySlug: string;
    groupSlug: string;
    groupName: string;
    dish: Dish;
    displayOrder: number;
  }[] = [];

  for (let ci = 0; ci < FOOD.length; ci++) {
    const cat: FoodCategory = FOOD[ci];
    await supabase.from("food_categories").insert({
      slug: cat.id,
      name: cat.name,
      blurb: cat.blurb,
      display_order: ci,
    });

    for (let gi = 0; gi < cat.groups.length; gi++) {
      const grp = cat.groups[gi];
      await supabase.from("food_groups").insert({
        food_category_id: (
          await supabase
            .from("food_categories")
            .select("id")
            .eq("slug", cat.id)
            .single()
        ).data!.id,
        slug: grp.id,
        name: grp.name,
        display_order: gi,
      });

      for (let di = 0; di < grp.items.length; di++) {
        allDishes.push({
          categorySlug: cat.id,
          groupSlug: grp.id,
          groupName: grp.name,
          dish: grp.items[di],
          displayOrder: di,
        });
      }
    }
  }

  // Insert dishes in chunks (Supabase allows up to ~1000 rows).
  const dishRows = [];
  for (const d of allDishes) {
    const groupId = (
      await supabase
        .from("food_groups")
        .select("id")
        .eq("slug", d.groupSlug)
        .single()
    ).data!.id;
    const priceCols = dishPriceColumns(d.dish);
    dishRows.push({
      food_group_id: groupId,
      name: d.dish.name,
      price_half: priceCols.price_half,
      price_full: priceCols.price_full,
      price_single: priceCols.price_single,
      note: d.dish.note ?? null,
      on_request: d.dish.onRequest ?? false,
      is_featured: false,
      image_url: null,
      display_order: d.displayOrder,
    });
  }

  // Insert in chunks of 100.
  for (let i = 0; i < dishRows.length; i += 100) {
    const { error } = await supabase.from("food_dishes").insert(dishRows.slice(i, i + 100));
    if (error) throw new Error(`food_dishes insert at ${i}: ${error.message}`);
  }

  // Now flag the 8 featured dishes. For each FEATURED entry:
  //   - if matchName is a real menu row → update by name + category
  //     guess (best effort — first match wins; ambiguity is logged)
  //   - if matchName is "__NEW__" → insert a new row in fallbackGroupId
  for (const f of FEATURED) {
    if (f.matchName === "__NEW__") {
      const groupId = (
        await supabase
          .from("food_groups")
          .select("id")
          .eq("slug", f.fallbackGroupId!)
          .single()
      ).data?.id;
      if (!groupId) {
        console.warn(`Skipping ${f.label}: fallback group ${f.fallbackGroupId} not found.`);
        continue;
      }
      const spec = NEW_DISH_FOR_LABEL[f.label];
      const { error } = await supabase.from("food_dishes").insert({
        food_group_id: groupId,
        name: spec.name,
        price_half: null,
        price_full: null,
        price_single: null,
        note: spec.note,
        on_request: true,
        is_featured: true,
        image_url: f.imageUrl,
        display_order: 999,
      });
      if (error) console.warn(`Featured insert ${f.label} failed: ${error.message}`);
    } else {
      // Find the row.
      const { data: matches } = await supabase
        .from("food_dishes")
        .select("id, name, food_group_id")
        .ilike("name", f.matchName);
      if (!matches || matches.length === 0) {
        console.warn(`Featured match not found: ${f.label} (looking for "${f.matchName}")`);
        continue;
      }
      // Pick the first match.
      const match = matches[0];
      const { error } = await supabase
        .from("food_dishes")
        .update({ is_featured: true, image_url: f.imageUrl })
        .eq("id", match.id);
      if (error) console.warn(`Featured update ${f.label} failed: ${error.message}`);
    }
  }
}

async function insertBar() {
  for (let ci = 0; ci < BAR.length; ci++) {
    const cat: BarCategory = BAR[ci];
    await supabase.from("bar_categories").insert({
      slug: cat.id,
      name: cat.name,
      sizes: cat.sizes,
      display_order: ci,
    });

    const catId = (
      await supabase
        .from("bar_categories")
        .select("id")
        .eq("slug", cat.id)
        .single()
    ).data!.id;

    // Pre-compute top-shelf mapping for this category.
    const topShelfNames = TOP_SHELF_NAMES[cat.id] ?? [];
    const bottleIds = BAR_BOTTLES[cat.id] ?? [];

    const pourRows = cat.items.map((item, idx) => {
      const tsIdx = topShelfNames.findIndex(
        (n) => n.toLowerCase() === item.name.toLowerCase(),
      );
      const isTopShelf = tsIdx >= 0;
      const bottleId = bottleIds[tsIdx];
      return {
        bar_category_id: catId,
        name: item.name,
        prices: item.prices,
        note: item.note ?? null,
        is_top_shelf: isTopShelf,
        top_shelf_slot: isTopShelf ? tsIdx + 1 : 0,
        image_url: isTopShelf && bottleId ? bottleImageUrl(bottleId) : null,
        display_order: idx,
      };
    });

    const { error } = await supabase.from("bar_pours").insert(pourRows);
    if (error) throw new Error(`bar_pours insert for ${cat.id}: ${error.message}`);
  }
}

async function insertProfiles() {
  // The admin's auth.users row is created via the CLI:
  //
  //     npx supabase auth admin create-user --email <email> --password <password>
  //
  // That command returns a user id. The seed then UPDATEs (or
  // INSERTs if missing) the profiles row for that id with
  // role = 'admin'.
  //
  // Until that one-time step is done this is a no-op — the admin
  // dashboard will simply 401.
  //
  // For local dev with `npx supabase start`, the dashboard URL
  // shows the seeded admin email; update here if you change it.
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@bagheecha.local";
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.warn(`auth.admin.listUsers failed: ${error.message} — skipping profile seed.`);
    return;
  }
  const admin = users.users.find((u) => u.email === adminEmail);
  if (!admin) {
    console.warn(
      `No auth.users row with email ${adminEmail}. Run ` +
        `\`npx supabase auth admin create-user --email ${adminEmail}\` and re-run the seed.`,
    );
    return;
  }
  const { error: upsertErr } = await supabase
    .from("profiles")
    .upsert({ id: admin.id, role: "admin" });
  if (upsertErr) {
    console.warn(`Profile upsert failed: ${upsertErr.message}`);
  }
}

async function main() {
  console.log("→ Wiping existing rows…");
  await wipe();
  console.log("→ Inserting food categories, groups, dishes…");
  await insertFood();
  console.log("→ Inserting bar categories, pours…");
  await insertBar();
  console.log("→ Linking admin profile…");
  await insertProfiles();
  console.log("✓ Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
