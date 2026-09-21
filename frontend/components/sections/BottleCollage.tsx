"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

import type { TopShelfBottle } from "@/lib/menu/queries";

/**
 * BottleCollage — the bar menu's polaroid rail, in two variants.
 *
 * The earlier rail showed one bar photograph per category, switching on
 * focus. The brief this round asked for the *bottles* themselves — the
 * ones the bar actually keeps on its top shelf — in a stacked,
 * overlapping arrangement that slides as the reader moves down the book.
 *
 * Two variants, because the rail has two jobs:
 *
 *  - `rail` (default): the tall portrait stacked polaroid that anchors
 *    the bar book on the left of the list at `lg` and above.
 *  - `mobile`: a horizontally scrolling row of single polaroids, one per
 *    bottle, sized so at least one and a half cards are visible at any
 *    width below `lg`. Cards are `w-[68vw]` with a `max-w-[280px]` ceiling
 *    so a phone shows a clean two-card layout without ballooning on
 *    wider mobile widths; `snap-x snap-mandatory scroll-smooth` makes
 *    swipes land on a card, not between two. The peeking card is the
 *    affordance — there is no visible scrollbar.
 *
 * The composition in `rail`:
 *
 *     ┌──────────────────┐
 *     │                  │
 *     │      [bottle]    │   ← bottle 1, nudges left, slight rotate
 *     │                  │
 *     │      [bottle]    │   ← bottle 2, nudges right, opposite rotate
 *     │                  │
 *     │      [bottle]    │   ← bottle 3, centred, no rotate (the hero)
 *     │                  │
 *     └──────────────────┘
 *
 * Each bottle is set into its own polaroid card (white border, label
 * strip), so the rail reads as real photographs the reader can
 * recognise — not a single stock rectangle. The bottles that the bar
 * actually keeps are the ones shown, so the reader can spot a brand
 * they know from across the room.
 *
 * WHY IT SLIDES ON CATEGORY FOCUS. As the reader moves from Vodka to
 * Premium Whisky the rail swaps each bottle. Each slot crossfades its
 * own bottle (opacity + y-translate), so the silhouette of the column
 * stays put — only the contents change.
 *
 * TWO BOTTLES, NOT THREE, FOR GIN. The printed card lists two gins — Blue
 * Riband and Bombay Sapphire — and the rail honours that. Slots that
 * have no bottle for this category simply do not render: on Gin only the
 * top and middle slots are populated, and the lead frame is the middle
 * slot rather than the bottom one.
 *
 * `pointer-events-none` so a tall frame on the left never steals a
 * click from a list on the right, and `aria-hidden` because the list
 * beside it carries every fact on the card already.
 *
 * DATA-FROM-PROPS. The pre-CMS build looked up bottles by id from
 * `lib/constants/images.ts`. With the CMS the bottles come from
 * Supabase via `lib/menu/queries.ts`. The prop carries the resolved
 * `{ id, brand, slot, imageUrl, blurDataUrl, tone }` shape, and the
 * static lookup is gone. `MenuClient.tsx` always passes the prop, so
 * `trio` defaults are only a fallback for any future caller that
 * mounts `BottleCollage` outside `#menus`.
 */

const EASE_LUXE = [0.32, 0.72, 0, 1] as const;

/** Per-slot positions for the three bottles in the stacked collage. */
const SLOTS = [
  {
    /** The top bottle — nudges left, slight clockwise rotation. */
    z: 20,
    top: "4%",
    left: "0%",
    rotate: -4,
    widthPct: 78,
    heightPct: 28,
    label: "top",
  },
  {
    /** The middle bottle — nudges right, opposite rotation. */
    z: 25,
    top: "32%",
    left: "20%",
    rotate: 5,
    widthPct: 78,
    heightPct: 28,
    label: "middle",
  },
  {
    /** The bottom bottle — centre, no rotation, the lead frame. */
    z: 30,
    top: "60%",
    left: "8%",
    rotate: -2,
    widthPct: 80,
    heightPct: 32,
    label: "bottom",
  },
] as const;

type Variant = "rail" | "mobile";

export function BottleCollage({
  categoryId,
  categoryName,
  variant = "rail",
  topShelf,
}: {
  categoryId: string;
  categoryName: string;
  variant?: Variant;
  /** Resolved top-shelf bottles for this category, from the CMS. */
  topShelf?: TopShelfBottle[];
}) {
  const trio = topShelf ?? [];
  // `trio.length` is 2 (gin) or 3 (everything else). The slots are
  // zipped to whichever bottles exist, so a 2-bottle category simply
  // drops the bottom slot rather than padding the trio.
  const populated = SLOTS.slice(0, trio.length).map((slot, i) => ({
    slot,
    bottle: trio[i]!,
  }));

  if (variant === "mobile") {
    return (
      <MobileBottleRail
        categoryId={categoryId}
        bottles={trio}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none sticky top-28"
    >
      {/* The collage's outer plate. */}
      <div className="relative aspect-[3/5] overflow-hidden rounded-2xl bg-plum-sunk">
        {/* A faint wash at the top so the dark plane reads as a back bar,
            not a sheet of plum. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,transparent_50%,rgba(0,0,0,0.18)_100%)]"
        />

        {/* The bottles, each in its slot. AnimatePresence inside each
            slot so swapping one bottle crossfades just that slot — the
            silhouette stays still, only the contents change. */}
        {populated.map(({ slot, bottle }) => (
          <BottleSlot
            key={`${categoryId}-${slot.label}`}
            bottle={bottle}
            slot={slot}
          />
        ))}

        {/* The category label, set in the same micro-uppercase as the
            bar's marks — sits in the collage's foot, like a card the
            bottles have been glued onto. */}
        <div className="absolute inset-x-0 bottom-0 z-40 flex items-end justify-between gap-3 px-4 pb-4">
          <span className="text-[9px] uppercase tracking-[0.32em] text-cream/70">
            Top shelf
          </span>
          <span className="font-display text-base leading-tight text-cream md:text-lg">
            {categoryName}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Mobile rail — a single horizontal scroll row of one polaroid per
   bottle. Sized so ~1.5 cards peek at 412px, hinting that the row
   scrolls. Hidden at `lg` because the desktop rail takes over.
------------------------------------------------------------------- */

function MobileBottleRail({
  categoryId,
  bottles,
}: {
  categoryId: string;
  bottles: TopShelfBottle[];
}) {
  return (
    <div
      aria-hidden="true"
      /*
       * The rail MUST stay inside the viewport on mobile, or its
       * `w-[44vw]` cards expand the document width and produce the
       * blank-void-to-the-right of the screen. `max-w-[100vw]` is the
       * hard ceiling and `overflow-x-hidden` is the failsafe; the
       * actual scrolling happens on the inner row below.
       */
      className="mb-8 w-full max-w-[100vw] overflow-x-hidden"
    >
      <div className="no-scrollbar flex w-full max-w-[100vw] snap-x snap-mandatory flex-nowrap gap-3 overflow-x-auto scroll-smooth px-6 pb-1 md:gap-4 md:px-10">
        {bottles.map((bottle) => (
          <div
            key={`${categoryId}-${bottle.id}`}
            className="relative w-[68vw] max-w-[280px] shrink-0 snap-center md:w-[42vw]"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={bottle.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.42, ease: EASE_LUXE },
                }}
                exit={{
                  opacity: 0,
                  y: -6,
                  transition: { duration: 0.28, ease: EASE_LUXE },
                }}
                className="relative flex aspect-[3/4] flex-col items-stretch bg-cream p-2 shadow-[0_14px_28px_-18px_rgba(0,0,0,0.55)]"
              >
                <div className="relative min-h-0 flex-1 overflow-hidden bg-cream-sunk">
                  <Image
                    src={bottle.imageUrl}
                    alt={`${bottle.brand} bottle`}
                    fill
                    sizes="(min-width: 768px) 42vw, 68vw"
                    {...(bottle.blurDataUrl
                      ? { placeholder: "blur" as const, blurDataURL: bottle.blurDataUrl }
                      : { placeholder: "empty" as const })}
                    className="object-contain"
                    priority={false}
                  />
                </div>
                <p className="mt-2 truncate text-center text-[8px] uppercase tracking-[0.2em] text-plum/80">
                  {bottle.brand}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   One slot — one bottle in the collage. The slot's CSS positions it;
   AnimatePresence swaps the bottle inside without moving the slot.
------------------------------------------------------------------- */

function BottleSlot({
  bottle,
  slot,
}: {
  bottle: TopShelfBottle;
  slot: (typeof SLOTS)[number];
}) {
  return (
    <div
      className="absolute"
      style={{
        top: slot.top,
        left: slot.left,
        width: `${slot.widthPct}%`,
        height: `${slot.heightPct}%`,
        zIndex: slot.z,
        transform: `rotate(${slot.rotate}deg)`,
      }}
      data-slot={slot.label}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={bottle.id}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.55, ease: EASE_LUXE },
          }}
          exit={{
            opacity: 0,
            y: -8,
            transition: { duration: 0.32, ease: EASE_LUXE },
          }}
          /* The polaroid card. A pale border, the bottle sized to the
             image's intrinsic aspect, and a labelled strip under it
             with the brand name. */
          className="relative flex h-full w-full flex-col items-stretch bg-cream p-2 shadow-[0_18px_38px_-22px_rgba(0,0,0,0.55)]"
        >
          <div className="relative min-h-0 flex-1 overflow-hidden bg-cream-sunk">
            <Image
              src={bottle.imageUrl}
              alt={`${bottle.brand} bottle`}
              fill
              sizes="(min-width: 1024px) 22vw, 0px"
              {...(bottle.blurDataUrl
                ? { placeholder: "blur" as const, blurDataURL: bottle.blurDataUrl }
                : { placeholder: "empty" as const })}
              className="object-contain"
              priority={false}
            />
          </div>
          {/* The polaroid label strip — the brand name set in the same
              micro-uppercase as the bar's marks. */}
          <p className="mt-2 truncate text-center text-[9px] uppercase tracking-[0.22em] text-plum/80">
            {bottle.brand}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
