import {
  BOTTLES,
  type BottleId,
} from "@/lib/constants/images";

/**
 * Lookups for `tone` (BottleCollage's back-of-card tint) and `focal`
 * (`object-position` on the next/image) keyed by image URL.
 *
 * The DB stores `image_url` as a plain string (e.g.
 * `/images/bottle-smirnoff.jpeg`). The CMS hero, the kitchen plate row
 * and the bottle polaroid all read tone/focal at render time — and
 * those are not data fields, they are CSS-side metadata about the
 * asset. The cleanest place for that metadata is a lookup keyed by
 * the asset's filename, which is the one identifier that survives the
 * Next.js image-optimization URL transformation.
 *
 * Pre-seeded rows reference files under `/images/...` whose names
 * match the static imports in `lib/constants/images.ts` —
 * `bottle-smirnoff.jpeg`, `dish-chilli-chicken.jpeg`, etc. Admin-
 * uploaded images (Supabase Storage URLs) get `null` tone/focal and
 * fall back to the centred crop.
 *
 * This file deliberately does NOT depend on `Shot.src.src` (which is
 * the optimized Next.js URL, not the original filename) and does NOT
 * import `next/image`'s `StaticImageData` type — that would force
 * this file to be the dependency of a server-only module. We only
 * need the metadata, and the metadata lives in the constants already.
 */

type ShotMeta = {
  /** `object-position` for the next/image. */
  focal: string | null;
  /** Display label printed under the photo. */
  label: string;
  /** Display caption printed under the photo. */
  caption: string;
  /** Alt text. */
  alt: string;
};

/**
 * The seed photos, keyed by filename (`dish-<slug>.jpeg`).
 *
 * The keys here match the file the seed script writes into
 * `food_dishes.image_url` and the static imports in
 * `lib/constants/images.ts`. If you rename a photo, change both
 * `public/images/<file>` and this map.
 */
const DISH_META: Record<string, ShotMeta> = {
  "dish-chilli-chicken.jpeg": {
    label: "Chilli Chicken",
    caption: "Glazed with whole red chilli and spring onion.",
    alt: "Glazed chilli chicken in a dark bowl, tossed with whole dried red chillies and sliced spring onion.",
    focal: null,
  },
  "dish-butter-chicken.jpeg": {
    label: "Butter Chicken",
    caption: "Slow-cooked in a copper handi, with naan.",
    alt: "Butter chicken in a copper handi, its tomato and cream gravy finished with a swirl of cream, with torn naan alongside.",
    focal: null,
  },
  "dish-sesame-chicken.jpeg": {
    label: "Sesame Chicken",
    caption: "Glazed, then scattered with toasted sesame.",
    alt: "Sesame chicken in a dark bowl — glazed pieces scattered with toasted sesame seeds and chopped spring onion.",
    focal: null,
  },
  "dish-fried-rice.jpeg": {
    label: "Fried Rice",
    caption: "Wok-tossed to order, served in the bowl.",
    alt: "Vegetable fried rice in a white bowl on a dark wooden table, with peas, carrot and spring onion through the grains.",
    focal: null,
  },
  "dish-paneer-tikka.jpeg": {
    label: "Paneer Tikka",
    caption: "Yoghurt-marinated, char-grilled to order.",
    alt: "Paneer tikka — cubes of fresh Indian cottage cheese, char-marked from the tandoor, with bell peppers and red onion.",
    focal: null,
  },
  "dish-tandoori-chicken.jpeg": {
    label: "Tandoori Chicken",
    caption: "Charred in the clay oven, finished with lime.",
    alt: "Half a tandoori chicken on a plate, its surface deeply red from the marinade and charred at the tips, finished with a squeeze of lime.",
    focal: null,
  },
  "dish-prawns-tawa.jpeg": {
    label: "Prawns Tawa Fry",
    caption: "Spice-crusted prawns tossed on the tawa.",
    alt: "Prawns tawa fry — whole shell-on prawns tossed with crushed pepper and curry leaves on a flat iron griddle.",
    focal: null,
  },
  "dish-papdi-chaat.jpeg": {
    label: "Papdi Chaat",
    caption: "Crisp wafers, yoghurt, three chutneys.",
    alt: "Papdi chaat — crisp fried wafers layered with yoghurt, tamarind and mint chutney, sev and pomegranate seeds on top.",
    focal: null,
  },
};

const BOTTLE_TONE = Object.fromEntries(
  (Object.values(BOTTLES) as Array<{ id: BottleId; tone: string }>).map(
    (b) => [`bottle-${b.id}.jpeg`, b.tone as "clear" | "amber" | "dark" | "green" | "ruby"],
  ),
) as Record<string, "clear" | "amber" | "dark" | "green" | "ruby">;

const filename = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const m = url.match(/\/([^/?#]+)$/);
  return m ? m[1]! : null;
};

/**
 * `tone` is the bottle's surface tint — "amber" most of the time, but
 * gin reads "clear", red wine reads "ruby". Used by `BottleCollage` to
 * paint the back of the polaroid card.
 *
 * Returns `"amber"` (the most common value) for any URL that doesn't
 * match the registry — Supabase-uploaded bottles included — so the
 * collage never goes without a tint.
 */
export function bottleToneFor(imageUrl: string | null): "clear" | "amber" | "dark" | "green" | "ruby" {
  const f = filename(imageUrl);
  if (!f) return "amber";
  return BOTTLE_TONE[f] ?? "amber";
}

/**
 * `object-position` for the kitchen plate grid. The eight seeded plates
 * share `null` (centred); the field exists so the admin can override
 * per row once the CMS lets them replace an image.
 */
export function dishFocalFor(imageUrl: string | null): string | null {
  const f = filename(imageUrl);
  if (!f) return null;
  return DISH_META[f]?.focal ?? null;
}

/**
 * Look up a dish photo's display metadata (label, caption, alt, focal)
 * by its image URL.
 *
 * The pre-CMS build put this in `lib/constants/images.ts` via static
 * imports — those imports don't survive the CMS boundary because the
 * server-only `queries.ts` cannot import `next/image`'s `StaticImageData`
 * graph. The map here is plain string metadata, server-safe, and keyed
 * by the URL's filename so it works for both static (`/images/...`) and
 * admin-uploaded (`...supabase.co/...`) image URLs.
 *
 * Returns `null` for any URL that doesn't match a known photo —
 * callers fall back to the dish name and note from the DB row.
 */
export function dishMetaFor(imageUrl: string | null): ShotMeta | null {
  const f = filename(imageUrl);
  if (!f) return null;
  return DISH_META[f] ?? null;
}
