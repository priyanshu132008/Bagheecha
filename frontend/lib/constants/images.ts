import type { StaticImageData } from "next/image";

import acFineDining from "@/public/images/ac-fine-dining.jpeg";
import atmosAc from "@/public/images/atmos-ac.jpeg";
import atmosRooftop from "@/public/images/atmos-rooftop.jpeg";
import barBackwallWide from "@/public/images/bar-backwall-wide.jpeg";
import barCocktailMixers from "@/public/images/bar-cocktail-mixers.jpeg";
import barJaliBackwall from "@/public/images/bar-jali-backwall.jpeg";
import barSpiritsShelf from "@/public/images/bar-spirits-shelf.jpeg";
import bottleAbsolut from "@/public/images/bottle-absolut.jpeg";
import bottleBacardiBlack from "@/public/images/bottle-bacardi-black.jpeg";
import bottleBacardiLimon from "@/public/images/bottle-bacardi-limon.jpeg";
import bottleBacardiWhite from "@/public/images/bottle-bacardi-white.jpeg";
import bottleBallantines from "@/public/images/bottle-ballantines.jpeg";
import bottleBlendersPride from "@/public/images/bottle-blenders-pride.jpeg";
import bottleBlueRibandGin from "@/public/images/bottle-blue-riband-gin.jpeg";
import bottleBlueRiband from "@/public/images/bottle-blue-riband.jpeg";
import bottleBombaySapphire from "@/public/images/bottle-bombay-sapphire.jpeg";
import bottleBudweiserMagnum from "@/public/images/bottle-budweiser-magnum.jpeg";
import bottleBudweiserMild from "@/public/images/bottle-budweiser-mild.jpeg";
import bottleCarlsbergElephant from "@/public/images/bottle-carlsberg-elephant.jpeg";
import bottleCarlsbergMild from "@/public/images/bottle-carlsberg-mild.jpeg";
import bottleDiaRed from "@/public/images/bottle-dia-red.jpeg";
import bottleDiaWhite from "@/public/images/bottle-dia-white.jpeg";
import bottleGlenwalk from "@/public/images/bottle-glenwalk.jpeg";
import bottleJameson from "@/public/images/bottle-jameson.jpeg";
import bottleKingfisherUltra from "@/public/images/bottle-kingfisher-ultra.jpeg";
import bottleMcdowellNo1 from "@/public/images/bottle-mcdowell-no1.jpeg";
import bottleOaksmith from "@/public/images/bottle-oaksmith.jpeg";
import bottleRomanov from "@/public/images/bottle-romanov.jpeg";
import bottleRoyalStagBarrel from "@/public/images/bottle-royal-stag-barrel.jpeg";
import bottleRoyalStag from "@/public/images/bottle-royal-stag.jpeg";
import bottleSignature from "@/public/images/bottle-signature.jpeg";
import bottleSmirnoff from "@/public/images/bottle-smirnoff.jpeg";
import bottleSulaRed from "@/public/images/bottle-sula-red.jpeg";
import bottleTuborgStrong from "@/public/images/bottle-tuborg-strong.jpeg";
import classicDiningNonAc from "@/public/images/classic-dining-nonac.jpeg";
import dishButterChicken from "@/public/images/dish-butter-chicken.jpeg";
import dishChilliChicken from "@/public/images/dish-chilli-chicken.jpeg";
import dishFriedRice from "@/public/images/dish-fried-rice.jpeg";
import dishPaneerTikka from "@/public/images/dish-paneer-tikka.jpeg";
import dishPapdiChaat from "@/public/images/dish-papdi-chaat.jpeg";
import dishPrawnsTawa from "@/public/images/dish-prawns-tawa.jpeg";
import dishSesameChicken from "@/public/images/dish-sesame-chicken.jpeg";
import dishTandooriChicken from "@/public/images/dish-tandoori-chicken.jpeg";
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
   The kitchen — eight plates off the printed card, the hero now
   crossfading through all of them.

   Four original (chilli chicken, butter chicken, sesame chicken, fried
   rice) plus four new arrivals: paneer tikka, tandoori chicken, prawns
   tawa, and papdi chaat — the second pass of the property's own food
   photography.

   The hero's two-cinematic crossfade uses all eight; the editorial
   band on the kitchen card keeps four to match the book's chapters.
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

/** The four new food photographs, for the hero's extended rotation. */
export const NEW_DISHES: Shot[] = [
  shot(dishPaneerTikka, {
    alt: "Skewers of paneer tikka on a wooden board, charred at the edges with grilled peppers and red onion, beside a bowl of mint chutney and a lime.",
    label: "Paneer Tikka",
    caption: "Skewered, charred, finished with mint chutney.",
    zone: "kitchen",
  }),
  shot(dishTandooriChicken, {
    alt: "Tandoori chicken pieces in a terracotta bowl, deep red with char marks, served on a banana leaf with sliced onion rings and green chutney.",
    label: "Tandoori Chicken",
    caption: "Clay-oven red, charred at the edges.",
    zone: "kitchen",
  }),
  shot(dishPrawnsTawa, {
    alt: "Spiced prawns tossed with dried red chillies and curry leaves in a black cast-iron pan on a rustic wooden board.",
    label: "Prawns Tawa Fry",
    caption: "Wok-tossed with whole red chilli and curry leaf.",
    zone: "kitchen",
  }),
  shot(dishPapdiChaat, {
    alt: "Papdi chaat on a white oval plate — crisp wafers layered with yoghurt, tamarind and mint chutneys, sev, pomegranate and diced tomato and onion.",
    label: "Papdi Chaat",
    caption: "Crisp wafers, three chutneys, fresh pomegranate.",
    zone: "kitchen",
  }),
];

/**
 * Eight frames for the hero's cinematic crossfade.
 *
 * The first four are the originals and stay `priority`-loaded; the four
 * new plates are `loading="eager"` because the crossfade reaches them
 * inside a few seconds and lazy would mean a blank panel during the
 * first rotation.
 */
export const HERO_CROSSFADE_DISHES: Shot[] = [
  ...FEATURED_DISHES,
  ...NEW_DISHES,
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
  shot(atmosRooftop, {
    /*
     * The Atmospheres lead shot for the terrace — a tighter, more
     * editorial crop of the same roof, swapped in 2026-09-20 for the
     * older `terraceUnderRoof` frame. Replaces the source the pinned
     * caption in `Atmospheres.tsx` reads; the older file stays in the
     * registry because the kitchen book still carries it.
     */
    alt: "The terrace under a timber roof at last light: yellow-topped tables, ceiling fans, and the canopy of palms beyond the railing.",
    label: "Under the Roof",
    caption: "Covered, fan-cooled, and open on every side.",
    zone: "terrace",
    focal: "50% 45%",
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
  shot(atmosAc, {
    /*
     * The Atmospheres lead shot for the AC room — a tighter editorial
     * crop of the booth wall, swapped in 2026-09-20 for the older
     * `acFineDining` frame. `acFineDining` stays in the registry for
     * any other consumer that referenced it.
     */
    alt: "The air-conditioned fine dining room: a long banquette in brown leather set against grilled windows, soft warm light from pendant lamps above each table.",
    label: "AC Fine Dining",
    caption: "Cool air, deep booths, and room for the whole family.",
    zone: "ac",
    focal: "50% 55%",
  }),
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
   The bar's "top three" bottles — the polaroid collage on the bar
   menu's left rail.

   Each list gets three photographs, chosen by the menu as its leading
   names: the bottles whose presence on the back bar is the visual proof
   that this list is *that* list. Vodka gets Smirnoff, Romanov and
   Absolut; whisky gets its own trio per tier — the page reads
   category-by-category and the collage slides with it.
------------------------------------------------------------------- */

export type BottleId =
  | "smirnoff"
  | "romanov"
  | "absolut"
  | "signature"
  | "blenders-pride"
  | "royal-stag-barrel"
  | "glenwalk"
  | "ballantines"
  | "jameson"
  | "oaksmith"
  | "royal-stag"
  | "mcdowell-no1"
  | "bacardi-limon"
  | "bacardi-white"
  | "bacardi-black"
  | "blue-riband"
  | "bombay-sapphire"
  | "dia-red"
  | "sula-red"
  | "dia-white"
  | "budweiser-mild"
  | "carlsberg-mild"
  | "kingfisher-ultra"
  | "budweiser-magnum"
  | "carlsberg-elephant"
  | "tuborg-strong";

export type Bottle = {
  /** Stable id, used as the React key. */
  id: BottleId;
  src: StaticImageData;
  /** Brand name as printed on the bottle — the only label that matters. */
  brand: string;
  /** The liquid's surface tone, for the back-of-collage tint. */
  tone: "clear" | "amber" | "dark" | "green" | "ruby";
};

/**
 * The full registry of bottles. The bar's `BAR_BOTTLES` map keys into
 * this — `BAR_BOTTLES.vodka[0]` is the first of the three the polaroid
 * collage shows on the vodka section, and so on. Re-using the same
 * source across categories (e.g. the strong-beer trio is the only beer
 * photography the property sent) is honest about the source material:
 * it is what was actually shot, and a category that the bar keeps
 * without its own portrait frame should not be invented one.
 */
export const BOTTLES: Record<BottleId, Bottle> = {
  smirnoff: {
    id: "smirnoff",
    src: bottleSmirnoff,
    brand: "Smirnoff",
    tone: "clear",
  },
  romanov: {
    id: "romanov",
    src: bottleRomanov,
    brand: "Romanov",
    tone: "clear",
  },
  absolut: {
    id: "absolut",
    src: bottleAbsolut,
    brand: "Absolut",
    tone: "clear",
  },
  signature: {
    id: "signature",
    src: bottleSignature,
    brand: "Signature",
    tone: "green",
  },
  "blenders-pride": {
    id: "blenders-pride",
    src: bottleBlendersPride,
    brand: "Blenders Pride",
    tone: "amber",
  },
  "royal-stag-barrel": {
    id: "royal-stag-barrel",
    src: bottleRoyalStagBarrel,
    brand: "Royal Stag Barrel",
    tone: "amber",
  },
  glenwalk: {
    id: "glenwalk",
    src: bottleGlenwalk,
    brand: "Glenwalk",
    tone: "amber",
  },
  ballantines: {
    id: "ballantines",
    src: bottleBallantines,
    brand: "Ballantines",
    tone: "amber",
  },
  jameson: {
    id: "jameson",
    src: bottleJameson,
    brand: "Jameson",
    tone: "amber",
  },
  oaksmith: {
    id: "oaksmith",
    src: bottleOaksmith,
    brand: "Oaksmith Silver",
    tone: "amber",
  },
  "royal-stag": {
    id: "royal-stag",
    src: bottleRoyalStag,
    brand: "Royal Stag",
    tone: "amber",
  },
  "mcdowell-no1": {
    id: "mcdowell-no1",
    src: bottleMcdowellNo1,
    brand: "McDowell No.1",
    tone: "amber",
  },
  "bacardi-limon": {
    id: "bacardi-limon",
    src: bottleBacardiLimon,
    brand: "Bacardi Limón",
    tone: "clear",
  },
  "bacardi-white": {
    id: "bacardi-white",
    src: bottleBacardiWhite,
    brand: "Bacardi White",
    tone: "clear",
  },
  "bacardi-black": {
    id: "bacardi-black",
    src: bottleBacardiBlack,
    brand: "Bacardi Black",
    tone: "dark",
  },
  "blue-riband": {
    id: "blue-riband",
    src: bottleBlueRiband,
    brand: "Blue Riband",
    tone: "clear",
  },
  "bombay-sapphire": {
    id: "bombay-sapphire",
    src: bottleBombaySapphire,
    brand: "Bombay Sapphire",
    tone: "clear",
  },
  "dia-red": {
    id: "dia-red",
    src: bottleDiaRed,
    brand: "Dia Red",
    tone: "ruby",
  },
  "sula-red": {
    id: "sula-red",
    src: bottleSulaRed,
    brand: "Sula Red",
    tone: "ruby",
  },
  "dia-white": {
    id: "dia-white",
    src: bottleDiaWhite,
    brand: "Dia White",
    tone: "clear",
  },
  "budweiser-mild": {
    id: "budweiser-mild",
    src: bottleBudweiserMild,
    brand: "Budweiser Mild",
    tone: "amber",
  },
  "carlsberg-mild": {
    id: "carlsberg-mild",
    src: bottleCarlsbergMild,
    brand: "Carlsberg Mild",
    tone: "green",
  },
  "kingfisher-ultra": {
    id: "kingfisher-ultra",
    src: bottleKingfisherUltra,
    brand: "Kingfisher Ultra",
    tone: "green",
  },
  "budweiser-magnum": {
    id: "budweiser-magnum",
    src: bottleBudweiserMagnum,
    brand: "Budweiser Magnum",
    tone: "amber",
  },
  "carlsberg-elephant": {
    id: "carlsberg-elephant",
    src: bottleCarlsbergElephant,
    brand: "Carlsberg Elephant",
    tone: "green",
  },
  "tuborg-strong": {
    id: "tuborg-strong",
    src: bottleTuborgStrong,
    brand: "Tuborg Strong",
    tone: "green",
  },
} as const;

/**
 * The two or three bottles the polaroid collage shows per bar category.
 *
 * Keyed by `BarCategory["id"]`. Most categories carry three — the names
 * the user explicitly chose from the photographed shelf — and the key
 * list is the same list `BAR` iterates in, so the rail slides in the
 * same order as the lists do. Gin carries only two because the printed
 * card lists only two: padding the trio would be a phantom bottle that
 * does not exist on the page.
 */
export type BarBottleTrio =
  | readonly [BottleId, BottleId, BottleId]
  | readonly [BottleId, BottleId];

export const BAR_BOTTLES: Record<string, BarBottleTrio> = {
  vodka: ["smirnoff", "romanov", "absolut"],
  "premium-whisky": ["signature", "blenders-pride", "royal-stag-barrel"],
  scotch: ["glenwalk", "ballantines", "jameson"],
  "regular-whisky": ["oaksmith", "royal-stag", "mcdowell-no1"],
  rum: ["bacardi-limon", "bacardi-white", "bacardi-black"],
  gin: ["blue-riband", "bombay-sapphire"],
  wine: ["dia-red", "sula-red", "dia-white"],
  "mild-beer": ["budweiser-mild", "carlsberg-mild", "kingfisher-ultra"],
  "strong-beer": ["budweiser-magnum", "carlsberg-elephant", "tuborg-strong"],
} as const;

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
  ...NEW_DISHES,
];