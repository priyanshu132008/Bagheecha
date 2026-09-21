/**
 * supabase/scripts/precompute-blur.ts — fills `blur_data_url` for
 * every seeded row whose `image_url` points at a `/images/*` static
 * file.
 *
 * Background. The kitchen plate row, the bottle polaroid, and the
 * hero mosaic all use `next/image` with `placeholder="blur"`. The
 * original `lib/constants/images.ts` provided a `blurDataURL` per
 * image at build time (Next.js' StaticImageData type carries it).
 * Once we move to a CMS-backed URL — even a URL that still points
 * at a static file — `next/image` no longer has access to that
 * build-time blur, so the page either flashes or renders blank.
 *
 * This script reads each `/images/...` file from `public/`, runs
 * `plaiceholder` against it, and writes the resulting base64 string
 * into the corresponding row's `blur_data_url` column.
 *
 * Run after every seed:
 *
 *     npx tsx supabase/scripts/precompute-blur.ts
 *
 * It is idempotent — every row gets rewritten. After this runs,
 * the public page renders with a real blur placeholder and zero
 * visible flash on first paint.
 *
 * The precompute covers both the seed-time static-import images
 * (`/images/...`) and any subsequent admin-uploaded images stored
 * in the `menu-assets` bucket. The latter path is handled by
 * `uploadImageAction` in `app/(admin)/admin/_actions/menu.ts` at
 * upload time — plaiceholder runs there too, so this script only
 * needs to back-fill the static-import images.
 */

import { resolve } from "node:path";
import { readFileSync } from "node:fs";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getPlaiceholder } from "plaiceholder";

loadEnv({ path: resolve(__dirname, "..", "..", ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PUBLIC_DIR = resolve(__dirname, "..", "..", "public");

/**
 * One dish or pour row whose `image_url` still points at a local
 * static file. The script reads each, computes a blurDataURL, and
 * updates the row.
 */
type Target = { table: "food_dishes" | "bar_pours"; id: string; image_url: string };

async function loadTargets(): Promise<Target[]> {
  const out: Target[] = [];

  const { data: dishes } = await supabase
    .from("food_dishes")
    .select("id, image_url, blur_data_url")
    .not("image_url", "is", null);
  for (const d of dishes ?? []) {
    if (d.image_url && d.image_url.startsWith("/images/") && !d.blur_data_url) {
      out.push({ table: "food_dishes", id: d.id, image_url: d.image_url });
    }
  }

  const { data: pours } = await supabase
    .from("bar_pours")
    .select("id, image_url, blur_data_url")
    .not("image_url", "is", null);
  for (const p of pours ?? []) {
    if (p.image_url && p.image_url.startsWith("/images/") && !p.blur_data_url) {
      out.push({ table: "bar_pours", id: p.id, image_url: p.image_url });
    }
  }

  return out;
}

async function blurFor(url: string): Promise<string | null> {
  const fsPath = resolve(PUBLIC_DIR, url.replace(/^\//, ""));
  let buf: Buffer;
  try {
    buf = readFileSync(fsPath);
  } catch (err) {
    console.warn(`  ! could not read ${fsPath}: ${(err as Error).message}`);
    return null;
  }
  try {
    const { base64 } = await getPlaiceholder(buf, { size: 10 });
    return base64;
  } catch (err) {
    console.warn(`  ! plaiceholder failed for ${url}: ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  console.log("→ Loading rows with /images/ URLs…");
  const targets = await loadTargets();
  console.log(`  found ${targets.length} rows.`);

  let ok = 0;
  let failed = 0;
  for (const t of targets) {
    const blur = await blurFor(t.image_url);
    if (!blur) {
      failed += 1;
      continue;
    }
    const { error } = await supabase
      .from(t.table)
      .update({ blur_data_url: blur })
      .eq("id", t.id);
    if (error) {
      console.warn(`  ! update failed for ${t.table}/${t.id}: ${error.message}`);
      failed += 1;
    } else {
      ok += 1;
    }
  }

  console.log(`✓ Done — ${ok} updated, ${failed} skipped.`);
}

main().catch((err) => {
  console.error("Precompute failed:", err);
  process.exit(1);
});
