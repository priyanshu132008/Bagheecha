import type { StaticImageData } from "next/image";

import acFineDining from "@/public/images/ac-fine-dining.jpeg";
import barBackwallWide from "@/public/images/bar-backwall-wide.jpeg";
import barCocktailMixers from "@/public/images/bar-cocktail-mixers.jpeg";
import barJaliBackwall from "@/public/images/bar-jali-backwall.jpeg";
import barSpiritsShelf from "@/public/images/bar-spirits-shelf.jpeg";
import classicDiningNonAc from "@/public/images/classic-dining-nonac.jpeg";
import dishButterChicken from "@/public/images/dish-butter-chicken.jpeg";
import dishChilliChicken from "@/public/images/dish-chilli-chicken.jpeg";
import dishFriedRice from "@/public/images/dish-fried-rice.jpeg";
import dishSesameChicken from "@/public/images/dish-sesame-chicken.jpeg";
import terracePanorama from "@/public/images/terrace-panorama.jpeg";
import terraceUnderRoof from "@/public/images/terrace-under-roof.jpeg";

/**
 * The photographic registry.
 *
 * Every asset is a *static import*, which is what lets `next/image`
 * derive intrinsic width/height and a blur placeholder at build time —
 * that is what keeps CLS at zero without hand-written dimensions.
 *
 * These are the real, unstyled photographs of the property: phone shots,
 * most of them portrait 720x1280. On the cream page they are shown close
 * to as shot — `<PhotoBackdrop>` grades them, but only where type has to
 * survive on top of them; the grid frames are plain `<Image>` and carry
 * no filter at all.
 *
 * `orientation` is recorded because the layout has to know. Two of
 * these are the same room, and the terrace exists as both a wide
 * panorama and a portrait frame — a portrait source cropped to a wide
 * banner loses its subject, so each card picks the frame that already
 * matches its aspect ratio.
 *
 * `focal` overrides the crop's centre when the subject is not centred.
 */

export type ZoneId = "terrace" | "ac" | "nonac" | "bar" | "kitchen";

export type Shot = {
  /** Static import — pass straight to `<Image src>`. */
  src: StaticImageData;
  /** Describes the actual photograph; never decorative filler. */
  alt: string;
  /** Short title for cards and future gallery captions. */
  label: string;
  /** One line of supporting copy. */
  caption: string;
  zone: ZoneId;
  orientation: "portrait" | "landscape";
  /** Optional `object-position` when the subject sits off-centre. */
  focal?: string;
};

const shot = (
  src: StaticImageData,
  rest: Omit<Shot, "src" | "orientation">,
): Shot => ({
  src,
  ...rest,
  orientation: src.width >= src.height ? "landscape" : "portrait",
});

/* ------------------------------------------------------------------
   Bar & drinks — four frames of the back bar. Two read as the room,
   two as the shelf.
------------------------------------------------------------------- */

export const BAR_IMAGES: Shot[] = [
  shot(barJaliBackwall, {
    alt: "Dark wood back-bar shelving lined with spirit bottles, built around a carved white marble jali niche holding a small shrine, with a ceiling fan above.",
    label: "The Back Bar",
    caption: "Dark timber, a marble jali niche, and a wall of bottles.",
    zone: "bar",
  }),
  shot(barBackwallWide, {
    alt: "The full back bar wall, its glass shelves of bottles running the width of the room beneath a dark ceiling and a ceiling fan.",
    label: "The Long Wall",
    caption: "Glass shelving stacked the full height of the room.",
    zone: "bar",
  }),
  shot(barSpiritsShelf, {
    alt: "Glass shelves of whisky, rum and wine, among them Teacher's, Vat 69, Black Dog and Royal Challenge, with boxed bottles on the top shelf.",
    label: "The Shelf",
    caption: "Whisky, rum and wine, poured by the peg or the bottle.",
    zone: "bar",
  }),
  shot(barCocktailMixers, {
    alt: "A back-bar shelf of cocktail glassware, jugs and fruit mixers — mango, strawberry and kiwi syrups — beside bottles of Bacardi, Smirnoff and bitters.",
    label: "Cocktails & Mixers",
    caption: "Glassware, fresh mixers and syrups for the cocktail list.",
    zone: "bar",
  }),
];

/* ------------------------------------------------------------------
   The kitchen — four plates off the printed card.

   These are the only photographs in the project of *food*, as opposed to
   of rooms, and they arrived last: the property shot its own dishes and
   sent them in. Four frames, four real orders, nothing staged.

   WHY FOUR AND NOT TWENTY-TWO. The food card carries 22 printed groups
   and well over three hundred lines. Photographing all of it is a menu
   redesign, not a page change, and illustrating a price list is how a
   restaurant site turns into a delivery app. So these four are the
   *preview*: one plate per chapter of the book, shown once, above it.

   `orientation` here is genuinely mixed (640x960, 736x1308, 736x981,
   736x736) which is what the `shot()` helper derives it for — the
   editorial band crops them to one ratio, so the source ratio only
   matters to whoever reaches for a single frame later.
------------------------------------------------------------------- */

export const FEATURED_DISHES: Shot[] = [
  shot(dishChilliChicken, {
    alt: "Glazed chilli chicken in a dark bowl, tossed with whole dried red chillies and sliced spring onion.",
    label: "Chilli Chicken",
    caption: "Glazed with whole red chilli and spring onion.",
    zone: "kitchen",
  }),
  shot(dishButterChicken, {
    alt: "Butter chicken in a copper handi, its tomato and cream gravy finished with a swirl of cream, with torn naan alongside.",
    label: "Butter Chicken",
    caption: "Slow-cooked in a copper handi, with naan.",
    zone: "kitchen",
  }),
  shot(dishSesameChicken, {
    alt: "Sesame chicken in a dark bowl — glazed pieces scattered with toasted sesame seeds and chopped spring onion.",
    label: "Sesame Chicken",
    caption: "Glazed, then scattered with toasted sesame.",
    zone: "kitchen",
  }),
  shot(dishFriedRice, {
    alt: "Vegetable fried rice in a white bowl on a dark wooden table, with peas, carrot and spring onion through the grains.",
    label: "Fried Rice",
    caption: "Wok-tossed to order, served in the bowl.",
    zone: "kitchen",
  }),
];

/* ------------------------------------------------------------------
   The three seating zones.
------------------------------------------------------------------- */

export const TERRACE_IMAGES: Shot[] = [
  shot(terracePanorama, {
    alt: "The open-air terrace under a terracotta-tiled roof, tables and wicker-backed chairs set along the railing, with coconut palms filling the view beyond.",
    label: "The Terrace",
    caption: "Open sky, palm groves, and the last table to empty.",
    zone: "terrace",
    focal: "50% 60%",
  }),
  shot(terraceUnderRoof, {
    alt: "Beneath the terrace roof: timber beams, ceiling fans and yellow-topped tables, with palm groves visible through the open sides.",
    label: "Under the Roof",
    caption: "Covered, fan-cooled, and open on every side.",
    zone: "terrace",
    focal: "50% 45%",
  }),
];

export const AC_DINING_IMAGES: Shot[] = [
  shot(acFineDining, {
    alt: "The air-conditioned fine dining room: brown banquette booths beside a grilled window, a wall-mounted air conditioner, ceiling fans and dark laminate tables.",
    label: "AC Fine Dining",
    caption: "Cool air, deep booths, and room for the whole family.",
    zone: "ac",
    focal: "50% 55%",
  }),
];

export const NON_AC_IMAGES: Shot[] = [
  shot(classicDiningNonAc, {
    alt: "The classic non-air-conditioned dining room: brown booth seating on a marble floor, cream walls with red butterfly decals, and ceiling fans overhead.",
    label: "Classic Dining",
    caption: "The everyday room — quick lunches and big groups.",
    zone: "nonac",
    focal: "50% 60%",
  }),
];

/* ------------------------------------------------------------------
   Composed collections, in the order the page consumes them.
------------------------------------------------------------------- */

/**
 * Three portrait frames of three different rooms.
 *
 * No longer rendered — the hero's preview cards were cut in the
 * Obsidian & Editorial overhaul in favour of a single full-bleed image,
 * and the terrace panorama below took over as the hero backdrop. Kept
 * because it is the obvious shortlist for the Phase 3 menu and gallery
 * sections, and because the *reason* for the selection still holds:
 * portrait sources for portrait slots, one room each, terrace first.
 */
export const HERO_TEASER_IMAGES: Shot[] = [
  TERRACE_IMAGES[1],
  AC_DINING_IMAGES[0],
  BAR_IMAGES[3],
];

/**
 * One representative frame per seating zone, keyed by zone id.
 *
 * The terrace is the landscape panorama: it is the only frame shot wide,
 * so it is the only one that fills a viewport without being cropped to
 * its middle — which is why it is the hero backdrop.
 *
 * The full-screen switcher this was originally built for is gone
 * ("Atmospheres" is an editorial grid now, and picks the portrait
 * `terrace-under-roof` for its tall frame), so nothing reads this today.
 * Kept as the zone→frame lookup the gallery and the reservation form
 * will both want: "which photograph is the terrace" is a question with
 * exactly one right answer per zone, and it should not be re-derived at
 * each call site.
 */
export const ATMOSPHERE_IMAGES: Record<"terrace" | "ac" | "nonac", Shot> = {
  terrace: TERRACE_IMAGES[0],
  ac: AC_DINING_IMAGES[0],
  nonac: NON_AC_IMAGES[0],
};

/** Every frame of the bar, for the bar-menu half of the page. */
export const BAR_FEATURE_IMAGES: Shot[] = BAR_IMAGES;

/** Everything, in one list — for a future gallery or lightbox. */
export const ALL_IMAGES: Shot[] = [
  ...TERRACE_IMAGES,
  ...AC_DINING_IMAGES,
  ...NON_AC_IMAGES,
  ...BAR_IMAGES,
  ...FEATURED_DISHES,
];
