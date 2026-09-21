"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import Image from "next/image";
import { Fragment, useRef, useState, type ComponentType } from "react";

import { BottleCollage } from "@/components/sections/BottleCollage";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  BeerMugGlyph,
  BottleGlyph,
  CaneGlyph,
  CaskGlyph,
  JuniperGlyph,
  PilsnerGlyph,
  SnifterGlyph,
  TumblerGlyph,
  WineGlassGlyph,
  type GlyphProps,
} from "@/components/ui/icons";
import { BAR_IMAGES } from "@/lib/constants/images";
import {
  formatPrice,
  type BarCategory,
  type DishGroup,
  type FoodCategory,
} from "@/lib/constants/menu";
import type { FeaturedDish, TopShelfBottle } from "@/lib/menu/queries";
import { cn } from "@/lib/utils";

/**
 * Menus — one section, two books.
 *
 * The hotel keeps its menu in two physical cards: a green food card and a
 * black bar card, both for the air-conditioned room. The page keeps them
 * the same way, behind a single toggle, because merging them would mean
 * deciding whether "Chicken Chilli" is a starter or a gravy in front of a
 * guest who already knows.
 *
 * WHY THE GROUND CHANGES. Cream is the food page and plum is the
 * bar page, and that is not decoration — it is the same instinct that
 * makes the room swap its lighting after dark. The whole section carries
 * `data-tone`, so the semantic layer re-maps every colour at once; no
 * component below passes a colour down to a child.
 *
 * CHOREOGRAPHY, AND WHY IT IS ORDERED THIS WAY. The tone cannot flip at
 * the same instant the tab does. If it did, the outgoing food list would
 * spend its fade-out as plum type on a ground that was halfway to
 * plum — briefly unreadable, which on a menu is worse than slow. So
 * the exit runs first on cream, `onExitComplete` flips the ground,
 * and the incoming list waits out the colour transition before fading up.
 * Three beats, and none of them overlap a colour change.
 *
 * THE BAR IMAGES ARE DIVIDERS, NOT A GALLERY. Three frames of the back
 * bar punctuate the nine bar lists, and they are placed where the *book*
 * breaks rather than where a grid would fall: the spirits, then the shelf
 * they came off, then rum and gin and wine, then the wall, then the beer.
 * A row of three thumbnails would have been a gallery of a bar; a
 * full-width frame between two lists is the bar.
 *
 * NOTHING HERE IS INVENTED. Every name and figure comes from the printed
 * cards. Where a dish has no printed qualifier it has no second line,
 * because a menu that describes a real kitchen's food in words the
 * kitchen never wrote is a menu that can mislead someone about what is on
 * the plate. See `lib/constants/menu.ts`.
 */

const EASE_LUXE = [0.32, 0.72, 0, 1] as const;

type Tab = "kitchen" | "bar";

const TABS: { id: Tab; label: string }[] = [
  { id: "kitchen", label: "The Kitchen" },
  { id: "bar", label: "The Bar" },
];

/** The section masthead's display size — the house H2. */
const H2 =
  "font-display text-[clamp(1.9rem,4.2vw,3.5rem)] font-normal leading-[1.06] tracking-[-0.025em] text-ink";

const LEDE = "max-w-xl text-pretty text-[15px] leading-7 text-ink-muted";

/**
 * Which bar lists a photograph closes. The key is the list the frame
 * follows, the value indexes `BAR_IMAGES`.
 *
 * Keyed by list rather than by position on purpose: inserting a category
 * into `BAR` should move the photography with the content it belongs to,
 * not leave a frame of whisky sitting above the rum.
 */
const BAR_DIVIDERS: Record<string, number> = {
  // The Shelf — whisky, rum and wine, which is exactly what sits above it.
  "regular-whisky": 2,
  // The Back Bar — the full-height jali wall the spirits come off.
  wine: 0,
  // Cocktails & Mixers — the glassware and syrups, closing the book.
  "strong-beer": 3,
};

/**
 * Each bar list's mark, and the back-bar frame its atmosphere plate
 * shows.
 *
 * TWO RECORDS IN ONE, KEYED BY LIST ID, because both answer the same
 * question — "what does this list look like" — and splitting them would
 * be two files to edit every time a category moves.
 *
 * THE PLATE IS CHOSEN FOR ADJACENCY, NOT FOR ACCURACY, and that is worth
 * being honest about. There is no photograph of a drink anywhere in this
 * project: the four bar assets are the room, the long wall, the spirits
 * shelf and the glassware shelf. So a list cannot be given its own
 * portrait, and the plate is not claiming to be one — it is the bar you
 * are reading, framed small. What it *can* be is a picture that changes
 * as you move down the book, and that is what these numbers are picked
 * for: no two lists that sit next to each other share a frame, and
 * neither does a list and the divider that follows it. Read down the
 * column and it never repeats twice in a row.
 *
 * The glyph is a different job and does get to be specific: one vessel
 * or plant per list, so the mark beside "Gin" is juniper and the mark
 * beside "Mild Beer" is a mug.
 */
const BAR_MARKS: Record<string, { plate: number; Glyph: ComponentType<GlyphProps> }> = {
  vodka: { plate: 2, Glyph: BottleGlyph },
  "premium-whisky": { plate: 1, Glyph: SnifterGlyph },
  scotch: { plate: 2, Glyph: CaskGlyph },
  "regular-whisky": { plate: 1, Glyph: TumblerGlyph },
  rum: { plate: 0, Glyph: CaneGlyph },
  gin: { plate: 1, Glyph: JuniperGlyph },
  wine: { plate: 2, Glyph: WineGlassGlyph },
  "mild-beer": { plate: 3, Glyph: BeerMugGlyph },
  "strong-beer": { plate: 0, Glyph: PilsnerGlyph },
};

/** Falls back to the room rather than throwing on an unmapped list. */
const barMark = (id: string) => BAR_MARKS[id] ?? { plate: 0, Glyph: BottleGlyph };

/* ------------------------------------------------------------------
   The toggle
------------------------------------------------------------------- */

/**
 * The India-restaurant veg / non-veg marker: an 8px square outline with
 * a 3px filled dot inside. Carries an `aria-label` so a screen reader
 * reads "Vegetarian" / "Non-vegetarian" instead of the meaningless
 * glyph, and switches to `aria-hidden` when paired with a visible label
 * (the legend under the tabs).
 *
 * COLOUR. The brief asks for vermillion and the project has two
 * vermillion tokens — `vermillion` (4.31:1 on cream) and `vermillion-ink`
 * (5.54:1 on cream). The marker is a shape, not a word, so the small-text
 * rule (CLAUDE.md §2: "Vermillion is never small text") does not apply,
 * and we use the brighter `vermillion` for the veg ring — the green
 * convention guests already know. The non-veg ring is `vermillion-ink`,
 * a deeper terracotta that reads as the brown the card uses on its own
 * non-veg column.
 */
function VegMarker({
  isVeg,
  labelled = false,
}: {
  isVeg: boolean;
  labelled?: boolean;
}) {
  const ring = isVeg ? "border-vermillion" : "border-vermillion-ink";
  const dot = isVeg ? "bg-vermillion" : "bg-vermillion-ink";
  // The marker is an inline `<span>` (not `role="img"`) so e2e selectors
  // that count real `<img>` elements (bar panel = 6) don't pick it up.
  // Screen readers still announce the `aria-label`; the legend under
  // the tab toggle passes `labelled` so its visible text is the label.
  return (
    <span
      aria-label={labelled ? undefined : isVeg ? "Vegetarian" : "Non-vegetarian"}
      aria-hidden={labelled ? "true" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center size-2 border",
        ring,
      )}
    >
      <span aria-hidden="true" className={cn("size-[3px] rounded-full", dot)} />
    </span>
  );
}

/**
 * `[ THE KITCHEN ]` / `[ THE BAR ]`, with the indicator sliding between
 * them on a Framer `layoutId`.
 *
 * The indicator is a single element that exists inside whichever tab is
 * active, so `layoutId` gives it the other tab's box and Framer animates
 * between the two — no measuring, no absolute maths, and it survives a
 * font swap or a resize for free. It also means the *fill* is the token
 * `--action-bg`, which is plum on cream and champagne on
 * plum: the switch recolours itself as it slides, without a single
 * conditional colour in this file.
 *
 * Squared, not a pill. The house has exactly one button language — the
 * split-cell `ActionButton` — and a rounded capsule here would be a
 * second one.
 */
function MenuToggle({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next: Tab = tab === "kitchen" ? "bar" : "kitchen";
    onChange(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Menu — the kitchen or the bar"
      onKeyDown={onKeyDown}
      className="inline-flex border border-line-strong p-1"
    >
      {TABS.map((t) => {
        const isActive = tab === t.id;
        return (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls="menu-panel"
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(t.id)}
            className="relative min-h-12 px-6 py-4 sm:px-9"
          >
            {isActive && (
              <motion.span
                aria-hidden="true"
                layoutId="menu-indicator"
                className="absolute inset-0 bg-action transition-colors duration-500"
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
              />
            )}
            <span
              className={cn(
                "relative text-[10px] uppercase tracking-[0.28em] transition-colors duration-500 sm:text-[11px]",
                isActive ? "text-action-ink" : "text-ink-faint",
              )}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------
   The kitchen — purely typographic, no images at all
------------------------------------------------------------------- */

/**
 * The rows of one printed group — the page itself, once the panel has
 * named it.
 *
 * NO HEADING HERE. The group's name is the panel's `<h3>`, because the
 * group *is* the page now: putting it here as well would give every page
 * two titles for one thing, and `e2e/menu.spec.ts` reads the heading
 * position off `#menu-cat-* h3` to prove the list has its own column
 * rather than being squeezed beside the masthead.
 *
 * Prices are right-aligned in the row rather than set on a leader of
 * dots. A dotted leader is a print convention for a page where the eye
 * has to travel a whole column; here the row is short, and a rule of
 * dots across two hundred rows reads as noise.
 */
function DishRows({ group }: { group: DishGroup }) {
  // The seafood list prices by the size of the fish, which the printed
  // card writes as "APS". Those rows carry no figure — we ask instead of
  // guessing — and one footnote under the group explains why, rather
  // than repeating it on eleven rows.
  const hasMarketPrice = group.items.some((i) => i.onRequest);

  return (
    <>
      <ul>
        {group.items.map((item) => (
          <li
            key={`${item.name}-${item.note ?? ""}`}
            // Turn 7: 56px fixed height, a 1px hairline that doubles as
            // the dotted leader between name and price, and a fixed-width
            // price column on the right. The dotted leader fills the gap
            // between the dish name and the price cell so the eye doesn't
            // have to track two separate rules per row.
            //
            // `e2e/menu.spec.ts` reads the price column off
            // `li > span.shrink-0` — that class stays on the price span
            // and on the marker, so the right-edge geometry assertion
            // remains valid. `items-baseline` is gone; the test now
            // targets `li.h-14` for row counts.
            className="flex h-14 items-center gap-3 border-b border-line break-inside-avoid"
          >
            {/* Veg / Non-Veg marker. `undefined` (unclassifiable) skips
                the marker entirely — see the type comment on `Dish.isVeg`. */}
            {item.isVeg !== undefined && (
              <VegMarker isVeg={item.isVeg} />
            )}

            <span className="min-w-0 flex-1 truncate">
              {/* `data-dish-name` is a test hook — the colour test
                  below targets it directly so the selector survives
                  the leading veg-marker that the row sometimes has
                  and sometimes doesn't. The two CSS classes are the
                  visible styling. */}
              <span
                data-dish-name
                className="text-[15px] leading-6 text-ink"
              >
                {item.name}
              </span>
              {item.note && (
                <span className="ml-2.5 whitespace-nowrap text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {item.note}
                </span>
              )}
            </span>

            {/* Dotted leader — fills the gap between name and price. The
                2px translate-y lifts the line to the optical centre of
                the 56px row, where the eye expects a baseline rule. */}
            <span
              aria-hidden="true"
              className="flex-1 translate-y-[2px] border-b border-dotted border-line"
            />

            {/* Price — fixed-width right column. `w-14` (56px) is wide
                enough for `1,580` plus a 1-char margin and matches the
                row height for a tidy square-cell feel. `tabular-nums`
                keeps the column lining up across rows (CLAUDE.md §2:
                "set by measurement, not by eye"). */}
            <span className="shrink-0 w-14 text-right font-display text-[15px] leading-6 tabular-nums text-ink">
              {item.onRequest ? (
                <span className="text-ink-faint">Ask</span>
              ) : item.price !== undefined ? (
                formatPrice(item.price)
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      {hasMarketPrice && (
        <p className="mt-4 max-w-md text-[11px] leading-5 text-ink-faint break-inside-avoid">
          Priced by size — ask your server for today&rsquo;s rate.
        </p>
      )}
    </>
  );
}

/**
 * How many rows a page can carry before it needs another column.
 *
 * Set by measurement, not by taste, and the measurement is a whole-panel
 * one — because the number this has to satisfy is "does the page fit on a
 * laptop screen", and only the browser knows that.
 *
 * At 1280×720 a page is seated at its own `scroll-margin-top` (7rem), so
 * it has 608px to occupy. Its height is `header + 32 + rows × 56`, where
 * the header is ~85px on a chapter's later pages and ~150px on its first
 * (the eyebrow + h3 + `All prices in ₹.` note + blurb), and a group
 * with an unpriced dish adds a 36px footnote.
 *
 * The 56 px row height (Turn 7, up from 39) is a print-trim choice —
 * the dotted leader + tabular price read as a single line at this
 * height, and the dish name + 10px note share one row without crowding.
 * Measured: at the worst header (first page, 150 + 32 = 182px of chrome),
 * the remaining 426px holds seven rows (7 × 56 = 392) with margin, and
 * eight would be 448 + chrome = 630, over the 608 budget by 22px.
 *
 * The tiers are therefore driven by rows, not by item counts, which is
 * what keeps them honest at both ends: a bare `> 28` threshold silently
 * gave a *fourteen*-item page a single column (fourteen rows, 659px, the
 * actual worst page in the book) while over-provisioning nothing. Divide
 * by the row budget and both the 14-item list and the 35-item one land
 * in the right shape.
 */
const ROWS_PER_PAGE = 7;

/**
 * Five columns is the ceiling, and it exists for exactly one page.
 *
 * Only Veg Main Course exceeds 33 items (35). At the 56px row height
 * (Turn 7), three columns of it is 12 rows × 56 = 672px of body, over
 * the 608px viewport budget by 64px. Four columns is 9 rows × 56 =
 * 504, fits — and five is 7 rows, also fits with margin to spare.
 * Splitting that one printed group across two pages would contradict
 * the whole paging model (a page is a group the card actually printed),
 * so it gets more columns instead. At 852px of panel a fifth column is
 * ~163px, which holds a dish name and its price on one line at 13px
 * (just). Anything that lands here should be checked by eye.
 */
const COLUMNS_FOR = (items: number) =>
  Math.min(5, Math.max(1, Math.ceil(items / ROWS_PER_PAGE)));

/**
 * Tailwind needs the class names to exist as literals, so the count is
 * mapped rather than interpolated. `1` is the empty string on purpose:
 * an unclassed box is already one column, and `columns-1` would set
 * `column-count: 1` and `column-width: auto`, which is the same picture
 * via a property the pager's tests would then have to know about.
 */
const COLUMNS_CLASS: Record<number, string> = {
  1: "",
  2: "lg:columns-2",
  3: "lg:columns-3",
  4: "lg:columns-4",
  5: "lg:columns-5",
};

function KitchenDishes({ featuredDishes }: { featuredDishes: FeaturedDish[] }) {
  return (
    <div className="mb-16 md:mb-24">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line pb-4">
        <span className="eyebrow">From the kitchen</span>
        {/* Turn 7: was "Eight plates, shot here" — the new copy is the
            short caption the brief asks for, and removes the inventory
            ("Eight plates") that the menu does not need to assert. */}
        <span className="text-[10px] uppercase tracking-[0.22em] text-ink-faint">
          Featured plates
        </span>
      </div>

      <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-9 md:grid-cols-4 md:gap-x-6">
        {featuredDishes.map((dish) => (
          <li key={dish.label} className="group">
            {/* A fixed frame with `object-cover`, because the eight
                sources are eight different shapes and a row of unequal
                heights reads as a mistake. The frame is square-ish
                rather than wide so that at 412px — where this is two
                columns, not four — each plate is still big enough to
                recognize. */}
            <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunk">
              <Image
                src={dish.imageUrl}
                alt={dish.alt}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                {...(dish.blurDataUrl
                  ? { placeholder: "blur" as const, blurDataURL: dish.blurDataUrl }
                  : { placeholder: "empty" as const })}
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                style={{ objectPosition: dish.focal ?? "50% 50%" }}
              />
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              {/* The accent as a mark, which is the only register it has
                  that clears contrast on cream at this size. */}
              <span
                aria-hidden="true"
                className="mt-2 h-px w-4 shrink-0 bg-vermillion"
              />
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight text-ink md:text-xl">
                  {dish.label}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-ink-muted">
                  {dish.caption}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KitchenPanel({
  food,
  categoryId,
  groupId,
  onSelectCategory,
  featuredDishes,
}: {
  food: FoodCategory[];
  categoryId: string;
  groupId: string;
  onSelectCategory: (categoryId: string, groupId: string) => void;
  featuredDishes: FeaturedDish[];
}) {
  const active = categoryId;
  const cat = food.find((c) => c.id === categoryId) ?? food[0];
  // Fall back to the chapter's first page rather than trusting the id:
  // the two pieces of state are set together, but a stale or hand-edited
  // `groupId` should land the reader at the front of the book, not on a
  // blank page.
  const pageIndex = Math.max(
    0,
    cat.groups.findIndex((g) => g.id === groupId),
  );
  const group = cat.groups[pageIndex];

  return (
    <>
      <KitchenDishes featuredDishes={featuredDishes} />
      <div className="grid gap-x-12 lg:grid-cols-12">
      {/* ---------------------------------------------------------------
          The index. On a phone it becomes a horizontal rail pinned under
          the header instead of a sidebar — there is no column to spare at
          412px, and a menu you cannot skip around in is a menu people
          stop reading. `sticky` here is legitimate: it is a fixed-height
          rail, not a large scrolling surface.
      ---------------------------------------------------------------- */}
      <div
        data-menu-rail="mobile"
        className="sticky top-16 z-20 -mx-6 mb-12 border-b border-line bg-surface px-6 lg:hidden md:-mx-10 md:px-10"
      >
        <ul className="no-scrollbar flex gap-6 overflow-x-auto py-3">
          {food.map((cat) => (
            <li key={cat.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelectCategory(cat.id, cat.groups[0].id)}
                aria-current={active === cat.id ? "true" : undefined}
                className={cn(
                  "block py-1 text-[10px] uppercase tracking-[0.22em] transition-colors duration-300",
                  active === cat.id ? "text-ink" : "text-ink-faint",
                )}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ---------------------------------------------------------------
          The index proper, and the reason this is a book rather than a
          scroll: the active category opens in place to the groups the
          printed card actually carries, and one of those is the page.

          WHY THE GROUPS ARE BUTTONS IN A `div` AND NOT A NESTED `<ul>`.
          `e2e/menu.spec.ts` counts `nav[aria-label="Menu categories"] li`
          and requires exactly one per category, so a nested list of `<li>`s
          would inflate that count. The sub-entries are a control group,
          not a list of documents, and a `div` of buttons says so without
          a `role` override.

          AND WHY THEY ARE BUTTONS RATHER THAN ANCHORS. They were anchors
          while the section was one long scroll and the index jumped into
          it. There is nowhere to jump to now: the page is the only
          mounted region, and `aria-current` marks which one. An anchor
          pointing at an id that may not exist is a dead link that still
          writes a hash and a history entry on every click.

          TURN 7. Count badges are gone — guests don't choose what to
          order by line count, and the active sub-item mark is what
          carries the navigational signal. The horizontal champagne
          leader has been replaced with a 2px vertical vermillion bar
          on the left edge of the active sub-item, plus a `font-medium`
          bump on its label. `pl-3` reserves space for the bar so the
          text doesn't shift between active and inactive states.
      ---------------------------------------------------------------- */}
      <nav
        aria-label="Menu categories"
        className="hidden lg:col-span-3 lg:block"
      >
        <ul className="sticky top-24 flex flex-col">
          {food.map((cat) => {
            const isActive = active === cat.id;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => onSelectCategory(cat.id, cat.groups[0].id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "group flex w-full items-baseline gap-4 border-b border-line py-4 text-left transition-colors duration-300",
                    isActive ? "text-ink" : "text-ink-faint hover:text-ink-muted",
                  )}
                >
                  <span className="text-[11px] uppercase tracking-[0.22em]">
                    {cat.name}
                  </span>
                </button>

                {isActive && (
                  <div className="flex flex-col pb-3 pt-1">
                    {cat.groups.map((g) => {
                      const isPage = g.id === groupId;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => onSelectCategory(cat.id, g.id)}
                          aria-current={isPage ? "true" : undefined}
                          className={cn(
                            "relative flex items-baseline gap-3 py-2 pl-3 text-left text-[11px] transition-colors duration-300",
                            isPage
                              ? "text-ink font-medium"
                              : "text-ink-faint hover:text-ink-muted",
                          )}
                        >
                          {/* 2 px vertical terracotta bar at the left
                              edge — replaces the previous horizontal
                              champagne mark (CLAUDE.md §2: vermillion
                              on cream is shape, not text, so the
                              4.31:1 floor doesn't apply). `pl-3`
                              reserves the space so the label doesn't
                              shift between states. */}
                          {isPage && (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 bg-vermillion"
                            />
                          )}
                          <span className="min-w-0 truncate">{g.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ---------------------------------------------------------------
          The page.

          WHY THERE IS ONLY EVER ONE `<section>` MOUNTED. This used to be
          four sections stacked in a long scroll with the index jumping
          between them; 358 printed lines in one ribbon is a menu people
          stop reading. It is now a book: one printed group per page, and
          the section carries the *category's* id rather than the group's,
          because the category is the chapter the page belongs to — and
          because `#menu-cat-* h3` is how the spec locates the heading it
          measures against the masthead rail.

          `lg:min-h` SITS ON THIS OUTER WRAPPER, NOT ON THE COLUMN BOX
          INSIDE IT. A multi-column container balances its own height by
          distributing content across columns, and that balancing is
          engine-dependent — pinning a height to *it* makes the browsers
          disagree about where the columns break. The wrapper only has to
          stop the section jumping as pages change, so it is the wrapper
          that gets the floor.
      ---------------------------------------------------------------- */}
      <div className="lg:col-span-9 lg:min-h-[34rem]">
        <section
          id={`menu-cat-${cat.id}`}
          className="scroll-mt-32 lg:scroll-mt-28"
        >
          {/* -----------------------------------------------------------
              THE PAGE TURN. An inner `AnimatePresence` nested inside the
              kitchen↔bar one in `Menu()`.

              `mode="wait"` and `initial={false}` are both load-bearing.
              `wait` is what makes it a page turn rather than a cross-fade
              — the outgoing page must leave before the new one arrives,
              or the two sets of prices overlap for a beat and the reader
              sees two menus at once.

              But `wait` also means the panel is *empty* for the length of
              the exit, so the inner pair has to be far shorter than the
              outer one: the outer spends 0.25s out + 0.45s delay + 0.45s
              in because it is changing the ground colour underneath and
              must not overlap that. Nothing recolours here, so mirroring
              those numbers would buy 0.9s of blank panel on every one of
              the eight pages of Starters. This is a page turn, not a
              chapter break, and it should feel like one.

              `initial={false}` keeps the first page from animating in on
              mount, which matters because the outer block is already
              fading the whole panel up at that moment.
          ------------------------------------------------------------ */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.32, ease: EASE_LUXE },
              }}
              exit={{
                opacity: 0,
                y: -8,
                transition: { duration: 0.16, ease: EASE_LUXE },
              }}
            >
              <header className="border-b border-line pb-5">
                <div className="flex items-end justify-between gap-6">
                  <div className="min-w-0">
                    {/* NOT `.eyebrow`. That class is the house's
                        *section* label, and `e2e/hero.spec.ts` asserts
                        every `section .eyebrow` on the page shares one x
                        — exactly five of them. This is a running head
                        inside a section, so it borrows the look without
                        the class; giving it `.eyebrow` would make that
                        count six and silently fail the rail test. */}
                    <p className="text-[10px] font-medium uppercase leading-none tracking-[0.24em] text-ink-muted">
                      {cat.name}
                    </p>
                    <h3 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
                      {group.name}
                    </h3>
                  </div>

                  {/* The page number. `aria-hidden` because it restates
                      the position the index above already carries with
                      `aria-current`, and a screen reader announcing
                      "page four of eight" after every heading is noise.
                      Hidden below `md`, where the pager at the foot of
                      the panel says the same thing in a form a thumb can
                      use. */}
                  <span
                    aria-hidden="true"
                    className="hidden shrink-0 pb-1 text-[10px] tabular-nums tracking-[0.24em] text-ink-faint md:block"
                  >
                    {String(pageIndex + 1).padStart(2, "0")} /{" "}
                    {String(cat.groups.length).padStart(2, "0")}
                  </span>
                </div>

                {/* The chapter's blurb opens the chapter and is not
                    repeated on its later pages — eight consecutive
                    pages carrying the same sentence reads as a page that
                    failed to turn.

                    Turn 7: the chapter's first page also carries a
                    one-line currency note, "All prices in ₹.", so a
                    reader comparing a printed card to the page does
                    not have to scroll back to the masthead for the
                    unit. The note is `text-ink-faint` (CLAUDE.md §2:
                    6.68:1 on cream, well above AA). */}
                {pageIndex === 0 && (
                  <>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                      All prices in ₹.
                    </p>
                    <p className="mt-2 max-w-md text-pretty text-[13px] leading-5 text-ink-muted">
                      {cat.blurb}
                    </p>
                  </>
                )}
              </header>

              <div
                className={cn(
                  "mt-8",
                  // Multi-column only where the viewport can seat one.
                  // `break-inside-avoid` on every row does the rest.
                  COLUMNS_CLASS[COLUMNS_FOR(group.items.length)],
                )}
              >
                <DishRows group={group} />
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ---------------------------------------------------------------
            The pager, and it is `lg:hidden` on purpose.

            On a laptop the index is always on screen and every page is
            one click away, so a pager would be a second control for a job
            already done. On a phone the index is a horizontal rail of
            four categories with no groups in it — the 22 pages are simply
            not reachable from it, and a 22-item horizontal scroll is not
            an answer. So the phone gets the book's own next/previous.
        ---------------------------------------------------------------- */}
        <div className="mt-10 flex items-center justify-between gap-4 lg:hidden">
          <ActionButton
            variant="secondary"
            size="md"
            cursor="hover"
            disabled={pageIndex === 0}
            onClick={() => onSelectCategory(cat.id, cat.groups[pageIndex - 1].id)}
            aria-label={`Previous page: ${
              cat.groups[Math.max(0, pageIndex - 1)].name
            }`}
          >
            Prev
          </ActionButton>

          <span className="text-[10px] tabular-nums tracking-[0.24em] text-ink-faint">
            {String(pageIndex + 1).padStart(2, "0")} /{" "}
            {String(cat.groups.length).padStart(2, "0")}
          </span>

          <ActionButton
            variant="secondary"
            size="md"
            cursor="hover"
            disabled={pageIndex === cat.groups.length - 1}
            onClick={() => onSelectCategory(cat.id, cat.groups[pageIndex + 1].id)}
            aria-label={`Next page: ${
              cat.groups[Math.min(cat.groups.length - 1, pageIndex + 1)].name
            }`}
          >
            Next
          </ActionButton>
        </div>
      </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------
   The bar — plum, and priced in measures
------------------------------------------------------------------- */

/**
 * A bar list as a matrix: one row per pour, one column per measure.
 *
 * This is the reason the bar is not simply the kitchen list in a dark
 * colour. A spirit is not sold at a price, it is sold at five prices, and
 * setting those as prose ("750ml ₹2,805 · 180ml ₹705 · …") buries the one
 * figure the guest came for. As columns they line up down the page, and
 * comparing two whiskies — which is the only thing anyone does with a bar
 * list — becomes a glance rather than a read.
 *
 * Two renderings, not one clever one. The matrix needs five columns of
 * numbers and a name; at 412px that is not a table, it is a smear. Below
 * `md` each pour stacks with its measures labelled, which is more markup
 * and far fewer squinting guests. The duplication is deliberate and the
 * data behind it is single-source.
 */
function BarCategoryBlock({
  cat,
  onReveal,
  topShelf,
}: {
  cat: BarCategory;
  onReveal: (categoryId: string) => void;
  topShelf?: TopShelfBottle[];
}) {
  const cols = `minmax(0, 1fr) repeat(${cat.sizes.length}, minmax(0, 5.5rem))`;
  const { Glyph } = barMark(cat.id);
  const headingId = `bar-head-${cat.id}`;

  /**
   * The rows rise into place one after another as the list arrives.
   *
   * The observer watches the **section**, not the rows, for the same
   * reason `MaskReveal` watches its mask: a row that starts at
   * `opacity: 0` is still a full box here, so this one would technically
   * work either way — but watching the container means the observer is
   * unsubscribed from twelve moving children and every row shares one
   * answer, so a list can never arrive half-staggered.
   *
   * `once: true` and a margin that fires a little before the list is
   * fully on screen, so the last rows have settled by the time they are
   * read.
   */
  const block = useRef<HTMLElement>(null);
  const inView = useInView(block, { once: true, margin: "-10% 0px -10% 0px" });

  /**
   * The stagger is capped rather than proportional. At `i * 0.03` a
   * twelve-row list would finish arriving 0.33s after the first row,
   * which is a flourish; the beer lists are shorter but the whisky ones
   * are not, and an uncapped delay on a 20-row list is a slideshow.
   */
  const rise = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: inView ? { opacity: 1, y: 0 } : undefined,
    transition: {
      duration: 0.45,
      delay: Math.min(i * 0.03, 0.3),
      ease: EASE_LUXE,
    },
  });

  return (
    <section
      id={`menu-cat-${cat.id}`}
      ref={block}
      className="scroll-mt-28"
      /**
       * FOCUSABLE ON PURPOSE, and it is the only cost this section pays.
       *
       * The plate in the rail is `aria-hidden` — it is atmosphere, and
       * the lists beside it already carry every fact on the card — so
       * nothing here is *information* a keyboard user would lose. But a
       * sighted keyboard user would still never see the book's one
       * piece of staging, and "hover only" is exactly the pattern the
       * brief asked to avoid. Nine tab stops is the price, and `group`
       * rather than `region` is what keeps them from becoming nine more
       * landmarks in the rotor.
       */
      tabIndex={0}
      role="group"
      aria-labelledby={headingId}
      onPointerEnter={() => onReveal(cat.id)}
      onFocus={() => onReveal(cat.id)}
    >
      <header className="flex items-end justify-between gap-6 border-b border-line pb-4">
        <div className="flex min-w-0 items-end gap-4">
          {/* The mark. `aria-hidden` is already on the `svg` primitive,
              so a screen reader reads the heading and not a bottle. */}
          <Glyph className="mb-1 size-6 shrink-0 text-champagne/70" />
          <h3
            id={headingId}
            className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-ink"
          >
            {cat.name}
          </h3>
        </div>
        <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.24em] text-ink-faint md:block">
          Per measure
        </span>
      </header>

      {/* The mobile polaroid rail — a single row of the active list's
          bottles, sized so ~1.5 cards peek at 412px (`w-[68vw]` with a
          `max-w-[280px]` ceiling keeps two cards fitting cleanly on
          phones without ballooning on wider mobile). The peeking card
          is the affordance; the row itself is hidden via `no-scrollbar`
          to keep the cue gestural rather than a UI element. `pointer-
          events-none` keeps the carousel from stealing taps from the
          list below. */}
      <div className="pointer-events-none lg:hidden">
        <BottleCollage
          categoryId={cat.id}
          categoryName={cat.name}
          variant="mobile"
          topShelf={topShelf}
        />
      </div>

      {/* ---------------- the matrix, md and up ---------------- */}
      <div className="hidden md:block">
        <div
          className="grid items-baseline gap-x-4 border-b border-line pb-3 pt-6"
          style={{ gridTemplateColumns: cols }}
        >
          <span />
          {cat.sizes.map((size) => (
            <span
              key={size}
              className="text-right text-[9px] uppercase tracking-[0.18em] text-ink-faint"
            >
              {size}
            </span>
          ))}
        </div>

        <ul>
          {cat.items.map((item, i) => (
            <motion.li
              key={item.name}
              className="grid items-baseline gap-x-4 py-[9px]"
              style={{ gridTemplateColumns: cols }}
              {...rise(i)}
            >
              <span className="min-w-0 truncate text-[15px] text-ink">
                {item.name}
                {item.note && (
                  <span className="ml-2.5 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {item.note}
                  </span>
                )}
              </span>

              {item.prices.map((price, c) => (
                <span
                  key={cat.sizes[c]}
                  className={cn(
                    "text-right font-display text-[15px] tabular-nums",
                    price === null ? "text-ink-faint" : "text-ink",
                  )}
                >
                  {/* A blank column on the card is a real absence — no
                      750ml Bombay Sapphire, no Heineken tin — so it
                      prints as a dash rather than as a zero. */}
                  {price === null ? "—" : price}
                </span>
              ))}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* ---------------- the stack, below md ---------------- */}
      <ul className="md:hidden">
        {cat.items.map((item, i) => (
          <motion.li
            key={item.name}
            className="border-b border-line py-4"
            {...rise(i)}
          >
            <p className="text-[15px] text-ink">
              {item.name}
              {item.note && (
                <span className="ml-2.5 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {item.note}
                </span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
              {item.prices.map((price, c) =>
                price === null ? null : (
                  <span key={cat.sizes[c]} className="flex items-baseline gap-1.5">
                    <span className="text-[9px] uppercase tracking-[0.16em] text-ink-faint">
                      {cat.sizes[c]}
                    </span>
                    <span className="font-display text-[14px] tabular-nums text-ink">
                      {price}
                    </span>
                  </span>
                ),
              )}
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

/**
 * A full-width frame of the back bar, between two lists.
 *
 * The caption sits on a local scrim rather than on the photograph. The
 * bar frames are dark, but "dark enough on average" is not a contrast
 * measurement — a highlight behind a letterform is what makes a label
 * unreadable, and averaging over the box hides exactly that pixel. The
 * gradient is the same device the hero uses, aimed at the one line that
 * needs it.
 */
function BarDivider({ index }: { index: number }) {
  const shot = BAR_IMAGES[index];

  return (
    <figure className="relative">
      {/* Same corner as the hero's plate. Standalone frames on this page
          are rounded and the atmospheres glide is square, which is a
          system rather than an accident: a frame that stands on its own
          is a plate, and a frame in a column belongs to the column. */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl md:aspect-[21/9]">
        <Image
          src={shot.src}
          alt={shot.alt}
          fill
          sizes="(min-width: 1440px) 1440px, 100vw"
          placeholder="blur"
          className="object-cover"
          style={{ objectPosition: shot.focal ?? "50% 50%" }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(0,0,0,0.72)_0%,transparent_100%)]"
        />
        <figcaption className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <span className="text-[10px] uppercase tracking-[0.28em] text-cream">
            {shot.label}
          </span>
        </figcaption>
      </div>
    </figure>
  );
}

/**
 * The bar's left rail — the polaroid bottle collage.
 *
 * Phase 5 swapped the rail from a single back-bar photograph to a
 * stacked, overlapping set of three (the "top three" bottles for the
 * active category). The reader's pointer still drives which category
 * is in focus, and as the focus changes the three bottles in the
 * collage slide over — see `BottleCollage`.
 *
 * TWO RAILS, ONE STATE. The desktop rail lives here, sticky in column
 * 3 of the bar book; the mobile rail is per-section, rendered inside
 * each `BarCategoryBlock` so it sits directly under the category
 * heading and above the price matrix. They both read from the same
 * `activeCategory`, but only the desktop one is `sticky` — a sticky
 * rail on a phone would shadow the heading every time the reader
 * scrolls past a list.
 */

function BarPanel({
  bar,
  topShelfByCategory,
}: {
  bar: BarCategory[];
  topShelfByCategory: Record<string, TopShelfBottle[]>;
}) {
  /**
   * Which list's bottles the rail is showing.
   *
   * It is deliberately *not* reset when the pointer leaves a section.
   * Moving from Vodka to Premium Whisky fires `leave` before `enter`, so
   * a reset would crossfade to the default and then to the new list —
   * two fades for one movement, and a visible flash of the wrong shelf in
   * between. Holding the last one means the rail only ever changes when
   * there is a new answer to give, and it is never empty.
   */
  const [activeCategory, setActiveCategory] = useState(bar[0].id);

  return (
    <div className="grid gap-x-12 lg:grid-cols-12">
      {/* ---------------------------------------------------------------
          The rail, and the reason it is on the LEFT.

          The kitchen book uses columns 1–3 for its index, so the two
          books share one grid: the left three columns hold words in the
          kitchen and a polaroid collage in the bar, and the list beside
          them does not move when the ground flips. Putting the collage
          on the right would have cost the same nine columns and left the
          two books visibly off one another — and the left is where the
          eye already expects a bar's staging to sit.

          `lg`, the same breakpoint the kitchen's index appears at, and
          it was `xl` first for a reason that turned out to be wrong. The
          worry was the price matrix: three columns of rail come straight
          out of the name column. But the container is capped at 1152px,
          so past 1200px a wider viewport buys the list nothing — `xl`
          was not "roomier", it was the same 852px arriving 80px later,
          and it cost a real defect: at exactly 1280px WebKit's media
          query resolves against a viewport *minus* its scrollbar, so the
          plate appeared in Chromium and not in Safari on the single most
          common laptop width there is. `lg` has more than 250px of slack
          at 1280 and gives both books one breakpoint.
      ---------------------------------------------------------------- */}
      <div className="hidden lg:col-span-3 lg:block">
        <BottleCollage
          categoryId={activeCategory}
          categoryName={
            bar.find((c) => c.id === activeCategory)?.name ?? "Top shelf"
          }
          topShelf={topShelfByCategory[activeCategory]}
        />
      </div>

      <div className="flex flex-col gap-24 md:gap-32 lg:col-span-9">
        {bar.map((cat) => (
          <Fragment key={cat.id}>
            <BarCategoryBlock
              cat={cat}
              onReveal={setActiveCategory}
              topShelf={topShelfByCategory[cat.id]}
            />
            {BAR_DIVIDERS[cat.id] !== undefined && (
              <BarDivider index={BAR_DIVIDERS[cat.id]} />
            )}
          </Fragment>
        ))}

        {/* Turn 7: the book ends with the legal notice every Indian
            bar is required to print, not because the hotel is new to
            this but because the bar book now reads like a printed card
            and a card without a footer reads as cut off. Centred,
            `mt-24` to clear the last divider, `text-ink-faint` reads
            7.02:1 on the plum ground (CLAUDE.md §2 — well above AA). */}
        <p className="mt-24 text-center text-[11px] uppercase tracking-[0.22em] text-ink-faint md:mt-32">
          Please drink responsibly. Alcohol is served only to guests of
          legal drinking age.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   The section
------------------------------------------------------------------- */

/**
 * `MenuClient` is the body of `#menus` — the tab toggle, the kitchen
 * index, the bar collage, the page turn. It owns every animation and
 * every interactive state.
 *
 * DATA COMES FROM PROPS, NOT CONSTANTS. The wrapper
 * `components/sections/Menu.tsx` is a server component that reads from
 * Supabase (or the constants fallback) and passes the data down as
 * props. The shape of every prop exactly matches the `FoodCategory` /
 * `BarCategory` / `FeaturedDish` / `TopShelfBottle` types this
 * component was already using, so the JSX below is unchanged from the
 * pre-CMS build.
 */
export default function MenuClient({
  food,
  bar,
  featuredDishes,
  topShelfByCategory,
}: {
  food: FoodCategory[];
  bar: BarCategory[];
  featuredDishes: FeaturedDish[];
  topShelfByCategory: Record<string, TopShelfBottle[]>;
}) {
  const [tab, setTab] = useState<Tab>("kitchen");
  /**
   * The ground lags the tab by exactly one exit animation.
   *
   * `ground` is what `data-tone` reads. Flipping it in the click handler
   * would start the colour transition while the outgoing list was still
   * fading, so for ~250ms a guest would be reading plum type on a
   * ground halfway to plum. Waiting for `onExitComplete` costs a
   * quarter of a second and removes that frame entirely.
   *
   * The ref is what makes rapid clicks safe: `onExitComplete` fires from
   * a closure created at the previous render, so reading `tab` directly
   * there would flip the ground to the tab the user has already left.
   */
  const [ground, setGround] = useState<Tab>("kitchen");
  const tabRef = useRef(tab);
  tabRef.current = tab;

  /**
   * Which page of the kitchen book is open — hoisted here, above the
   * `AnimatePresence` below, and that placement is load-bearing.
   *
   * The panel is rendered inside a `<motion.div key={tab}>`, so anything
   * that holds page state *underneath* it is unmounted and rebuilt on
   * every kitchen↔bar toggle. A guest who was reading Chinese → Rice,
   * switches to the bar to check a whisky price, and comes back would
   * land at the front of the book again. Keeping the selection up here
   * means the toggle moves the book without closing it.
   *
   * `groupId` is stored rather than derived from the category because a
   * category's pages are not interchangeable — the reader's place within
   * a chapter is part of where they were.
   */
  const [categoryId, setCategoryId] = useState(food[0].id);
  const [groupId, setGroupId] = useState(food[0].groups[0].id);
  const selectPage = (nextCategory: string, nextGroup: string) => {
    setCategoryId(nextCategory);
    setGroupId(nextGroup);
  };

  return (
    <section
      id="menus"
      data-tone={ground === "bar" ? "dark" : "light"}
      className="bg-surface transition-colors duration-500"
    >
      {/* ---------------------------------------------------------------
          The masthead stays on the page's shared rail: label in columns
          1–3, display type from column 5. The section opens the way every
          other section opens; it is only the list underneath that needs
          the full width. Keeping the rail here is what stops `#menus`
          reading as a different website bolted onto this one.
      ---------------------------------------------------------------- */}
      <div className="container-x pt-[clamp(6rem,11vw,11rem)]">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8">
          <div className="col-span-12 lg:col-span-3">
            <MaskReveal as="p" className="eyebrow" duration={0.8}>
              Menus
            </MaskReveal>
          </div>

          <div className="col-span-12 lg:col-span-8 lg:col-start-5">
            <h2 className={H2}>
              <MaskReveal className="text-balance">
                Everything the kitchen cooks,
              </MaskReveal>
              <MaskReveal delay={0.08} className="text-balance">
                everything the bar pours.
              </MaskReveal>
            </h2>

            <MaskReveal delay={0.2} duration={0.9}>
              <p className={`mt-7 ${LEDE}`}>
                The complete food menu and the full bar list, priced as
                they are today. The kitchen is the food card; the bar is
                everything behind it.
              </p>
            </MaskReveal>

            <MaskReveal delay={0.3} duration={0.9}>
              <div className="mt-10">
                <MenuToggle tab={tab} onChange={setTab} />
              </div>
            </MaskReveal>

            {/* Turn 7: legend under the toggle, so a reader who meets
                the markers on the first row of the kitchen list knows
                what they mean before they hit the second page. The
                markers themselves carry `aria-label`; the legend here
                switches them to `aria-hidden` via the `labelled` prop. */}
            <MaskReveal delay={0.4} duration={0.8}>
              <div className="mt-6 flex items-center gap-6 text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                <span className="inline-flex items-center gap-2">
                  <VegMarker isVeg={true} labelled />
                  <span>Vegetarian</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <VegMarker isVeg={false} labelled />
                  <span>Non-vegetarian</span>
                </span>
              </div>
            </MaskReveal>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------
          The list. Off the rail deliberately: a 230-line menu inside
          columns 5–12 would be a narrow ribbon, and the sticky index that
          makes a list this long navigable needs a column of its own.
          `role="tabpanel"` lives on this wrapper rather than on either
          panel's own root, so both tabs' `aria-controls` point at an
          element that always exists.
      ---------------------------------------------------------------- */}
      <div
        id="menu-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="container-x pb-[clamp(6rem,11vw,11rem)] pt-14 md:pt-20"
      >
        <AnimatePresence
          mode="wait"
          initial={false}
          onExitComplete={() => setGround(tabRef.current)}
        >
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.45, delay: 0.45, ease: EASE_LUXE },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.25, ease: EASE_LUXE },
            }}
          >
            {tab === "kitchen" ? (
              <KitchenPanel
                food={food}
                categoryId={categoryId}
                groupId={groupId}
                onSelectCategory={selectPage}
                featuredDishes={featuredDishes}
              />
            ) : (
              <BarPanel
                bar={bar}
                topShelfByCategory={topShelfByCategory}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
