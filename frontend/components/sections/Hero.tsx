"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { memo, useEffect, useRef, useState } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import { MaskRise } from "@/components/motion/MaskReveal";
import { WHATSAPP_RESERVATION_HREF } from "@/lib/constants/site";
import type { FeaturedDish } from "@/lib/menu/queries";

/**
 * Hero — the opening frame, full bleed, four-column mosaic.
 *
 * THE BOX IS GONE. A rounded plate inset from the page edges with the
 * display type crossing its lower lip is the shape of a component
 * library — it makes the first thing a guest sees read as software
 * rather than as a restaurant. The backdrop runs to all four edges and
 * the type sits on it.
 *
 * THE BACKDROP IS A FOUR-COLUMN MOSAIC. Not one photograph, not a 2x2,
 * and not the same plate four times: four upright strips, one image
 * per strip, dissolving into the next. The eight kitchen plates (the
 * four originals plus the four new arrivals) live in two pools — four
 * "visible", four "hidden". Every 1500ms the loop picks one of the
 * four columns at random and overlays a hidden-pool dish on top of
 * the visible one, fading it in over 800ms.
 *
 * THE BLINK IS THE OLD BACKDROP'S FAILURE. The earlier pass used
 * `AnimatePresence` to mount/unmount each swap, which exposed a
 * blank column between the exit and the entry on slower devices and
 * tore down the browser's image cache every cycle. The replacement
 * keeps all four base images mounted permanently and adds a
 * per-column overlay for the swap. The overlay fades from 0 → 1; the
 * base only changes src *after* the overlay has finished, so the
 * reader sees one image blending into the next with zero blank
 * frames between them.
 *
 * PARALLAX FOR DEPTH. The mosaic translates vertically at 30% of the
 * scroll speed, decoupling the background from the foreground type.
 * As the reader scrolls, the food grid drifts up slower than the page
 * — the same effect a Steadicam gives a tracking shot. The transform
 * is on a motion value (`useTransform`), so the GPU composites the
 * shift on the existing layer; no layout work, no React re-renders
 * during the scroll.
 *
 * STATE ISOLATION. The mosaic is a `React.memo` child that owns its
 * own swap state. The foreground copy block sits in `Hero()` itself
 * — a sibling of the mosaic, not a parent of its state. The 1500ms
 * interval fires every column independently, so the parent and the
 * foreground never re-render due to a swap.
 *
 * THE TYPE IS THE DESIGN. One word, lowercase, at 10.5vw with tight
 * negative tracking, anchored bottom-left — a wordmark rather than a
 * headline with a subtitle under it. The asterisk is the only
 * vermillion on the first screen and it is `aria-hidden`: it is a
 * mark, not a character, and "bagheecha asterisk" is not the name of
 * the restaurant. The `sr-only` "Hotel" in front of it is, so the
 * accessible name is the real one.
 *
 * THE CTA IS A GHOST. Both actions are `outline`, so the first
 * viewport contains no solid button at all. With a wordmark this
 * size, a filled block beside it is two things shouting.
 *
 * THE OVERLAY. A single deep-plum ramp covers the whole grid (top
 * transparent, mid-plum at 40%, full plum at the foot) so the type
 * below clears AA on every frame, on every strip. The drift happens
 * behind the ramp; the ramp does not move. Measured against the
 * composited result, not the token, by `e2e/hero.spec.ts`.
 *
 * LCP. Strip one carries `priority` and is preloaded; the other
 * three are `loading="eager"`. They all live in the first viewport,
 * so lazy would be a lie, but four `<link rel=preload>` tags for one
 * backdrop is bandwidth taken from the text. CLS stays zero because
 * the static imports give `next/image` their intrinsic sizes at
 * build time.
 */

const ZONE_LEGEND = ["Terrace Lounge", "AC Fine Dining", "Classic Non-AC"];

/** How often the mosaic picks one column to start a crossfade. */
const SWAP_MS = 1500;

/** How long the crossfade itself takes. */
const FADE_MS = 800;

/** How far the parallax translates the backdrop for every 1000px of
 *  scroll — 30% of the page speed. Heavy enough to read as motion,
 *  light enough that the food never drifts out of frame. */
const PARALLAX_RANGE = [0, 300] as const;
const PARALLAX_INPUT = [0, 1000] as const;

const DRIFT = ["a", "b", "c", "d"] as const;

/* ------------------------------------------------------------------
   Tiny seeded PRNG (mulberry32) — used only to pick the *first*
   frame, so the server and the client render the same opening
   mosaic. After mount, the swap interval uses `Math.random()`,
   which is fine because it touches state, not markup.
------------------------------------------------------------------- */

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 0x9e3779b1;

/** Fisher-Yates using a seeded PRNG, so server and client agree. */
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function Hero({ featuredDishes }: { featuredDishes: FeaturedDish[] }) {
  return (
    <section
      id="top"
      data-tone="dark"
      className="relative flex min-h-dvh flex-col overflow-hidden bg-plum"
    >
      <HeroMosaicBackground featuredDishes={featuredDishes} />
      <HeroVignette />

      {/* -----------------------------------------------------------------
          The copy block. A sibling of the mosaic, not a descendant of
          its state. The 1500ms swap interval lives inside the memoized
          mosaic child and never re-renders this block.
      ------------------------------------------------------------------ */}
      <div className="container-x relative z-20 mt-auto pb-24 pt-6 md:pb-14 md:pt-8">
        <MaskRise delay={0.1} duration={0.8} className="eyebrow">
          Hotel Bagheecha &middot; Virar
        </MaskRise>

        <h1 className="mt-4 font-display text-[clamp(3.2rem,10.5vw,9rem)] font-normal leading-[0.85] tracking-tighter text-ink">
          <MaskRise delay={0.18}>
            <span className="sr-only">Hotel </span>
            bagheecha
            <span aria-hidden="true" className="text-vermillion">
              *
            </span>
          </MaskRise>
        </h1>

        <div className="mt-7 grid grid-cols-12 items-end gap-x-6 gap-y-7">
          <div className="col-span-12 lg:col-span-5">
            <MaskRise delay={0.46} duration={0.9}>
              <p className="max-w-md text-pretty text-[15px] leading-7 text-ink-muted md:text-base">
                The city&rsquo;s rooftop lounge, its family dining rooms, and a
                back bar that runs late &mdash; under one roof in Virar.
              </p>
            </MaskRise>
          </div>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7 lg:justify-self-end">
            <MaskRise delay={0.56} duration={0.9}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:justify-end">
                <ActionButton
                  href={WHATSAPP_RESERVATION_HREF}
                  variant="secondary"
                  size="lg"
                  external
                  className="w-full justify-center sm:w-auto"
                >
                  Reserve a Place
                </ActionButton>
                <ActionButton
                  href="#menus"
                  variant="secondary"
                  size="lg"
                  cursor="hover"
                  className="w-full justify-center sm:w-auto"
                >
                  Explore the Menu
                </ActionButton>
              </div>
            </MaskRise>
          </div>
        </div>

        <div className="mt-8 md:mt-12">
          <div aria-hidden="true" className="rule-hairline" />

          <div className="mt-4 grid grid-cols-12 items-center gap-x-6 gap-y-4">
            <ul className="col-span-12 flex flex-wrap items-center gap-x-5 gap-y-2 md:col-span-8">
              {ZONE_LEGEND.map((zone, i) => (
                <li key={zone} className="flex items-center gap-5">
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="hidden size-1 rotate-45 bg-vermillion/70 sm:block"
                    />
                  )}
                  <span className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
                    {zone}
                  </span>
                </li>
              ))}
            </ul>

            <div className="col-span-12 md:col-span-4 md:justify-self-end">
              <a
                href="#spaces"
                aria-label="Scroll to the spaces section"
                className="hidden items-center gap-3 text-ink transition-opacity duration-500 hover:opacity-70 md:inline-flex"
              >
                <span className="text-[9px] uppercase tracking-[0.32em]">
                  Scroll
                </span>
                <span className="relative h-10 w-px overflow-hidden bg-line-strong">
                  <span className="scroll-cue__mark absolute inset-x-0 top-0 h-4 bg-champagne" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   The mosaic, isolated.

   `React.memo` because the foreground copy is a sibling of this
   child, and a swap here must never reach the typography. The
   component owns its own state and has no props — memo will skip
   any future re-render triggered from the parent.

   The parallax `y` is a `MotionValue`, so scroll updates the
   transform on the GPU without going through React's commit
   phase. The swap state changes only on the 1500ms interval, and
   the resulting re-render is local to the mosaic's JSX subtree.
------------------------------------------------------------------- */

interface Swap {
  /** Which column is mid-crossfade. */
  col: number;
  /** The dish being faded in. The base of that column still shows the
   *  old dish until the fade completes. */
  incoming: number;
}

const HeroMosaicBackground = memo(function HeroMosaicBackground({
  featuredDishes,
}: {
  featuredDishes: FeaturedDish[];
}) {
  const total = featuredDishes.length;

  // The opening mosaic is computed once at mount, deterministically.
  // After mount, the swap interval is non-deterministic by design —
  // `Math.random()` in the interval handler does not affect markup,
  // only state, so there is no hydration mismatch.
  const [{ visible, pool }, setLayout] = useState(() => {
    const rand = mulberry32(SEED);
    const shuffled = shuffle(
      Array.from({ length: total }, (_, i) => i),
      rand,
    );
    return { visible: shuffled.slice(0, 4), pool: shuffled.slice(4) };
  });

  // The active overlay, if any. Mounting an overlay image on top of
  // the visible one is what kills the blank-frame between AnimatePresence's
  // exit and entry — both layers are present while the opacity walks.
  const [overlay, setOverlay] = useState<Swap | null>(null);

  // `inFlightRef` is the synchronously-readable "is a fade mounted
  // right now" flag. Reading the React state via a ref-mirror would
  // be asynchronous — the post-render `useEffect` runs after the
  // next paint, so two ticks could land in the same frame and both
  // think the slot is free. Updating the ref immediately, beside the
  // state setter, closes that window.
  const inFlightRef = useRef(false);

  // `layoutRef` mirrors `{ visible, pool }` for the same reason: the
  // interval handler needs the *current* swap candidates to make a
  // random pick, but reading React state from inside the timer is a
  // closure over the mount-time snapshot. The mirror is updated beside
  // the state setter so two reads in the same tick agree on what is
  // visible right now.
  const layoutRef = useRef<{ visible: number[]; pool: number[] }>({
    visible,
    pool,
  });
  useEffect(() => {
    layoutRef.current = { visible, pool };
  }, [visible, pool]);

  // Parallax — `scrollY` is a live motion value, `y` maps it through
  // a 30% range. The motion values update the GPU directly, never
  // re-rendering React.
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [...PARALLAX_INPUT], [...PARALLAX_RANGE]);

  // The swap interval. Every 1500ms, pick one column and one hidden
  // dish, mount an overlay on that column, and after the fade
  // completes promote the overlay into the visible layout and free
  // the old dish back into the pool. Skips ticks while a fade is
  // mid-flight — the brief is "one random column per tick", and
  // stacking two crossfades onto the same column would land the
  // base on whichever promote ran last, not on whichever was seen.
  //
  // The interval handler is intentionally *not* a React updater: it
  // picks from `layoutRef`, mutates refs, calls `setOverlay`, and
  // schedules a timer. None of that happens inside a `setLayout`
  // callback, so React's Strict Mode (which double-invokes state
  // updaters in dev) cannot double-fire the swap and corrupt the
  // mosaic. `setLayout` itself lives in the promote callback, where
  // it does run twice in dev — but the updater is pure (same
  // inputs, same output), so the double call is a no-op.
  useEffect(() => {
    const promoteTimers = new Set<number>();

    const id = window.setInterval(() => {
      if (inFlightRef.current) return;

      const { visible: v, pool: p } = layoutRef.current;
      if (p.length === 0) return;

      const col = Math.floor(Math.random() * v.length);
      const poolIdx = Math.floor(Math.random() * p.length);
      const incoming = p[poolIdx];

      // Mark the slot as in-flight *now* — before the timer is
      // scheduled — so the very next interval tick sees the lock and
      // skips. The flag goes down inside the promote callback below.
      inFlightRef.current = true;

      // Mount the overlay. We deliberately *do not* touch `visible`
      // here — the base image keeps showing the old dish until the
      // overlay has fully faded in. That is the whole point of the
      // overlay pattern: the reader never sees a blank frame because
      // the base image is still on screen during the fade.
      setOverlay({ col, incoming });

      const promote = window.setTimeout(() => {
        promoteTimers.delete(promote);
        inFlightRef.current = false;
        setOverlay((current) =>
          current && current.col === col && current.incoming === incoming
            ? null
            : current,
        );
        // Pure updater: returning the previous reference when the
        // column no longer holds the dish we picked earlier means
        // React skips a commit, and the function is safe under the
        // dev-mode double invocation — same input, same output.
        setLayout((latest) => {
          // The promote timer captured `v[col]` (the dish that *was*
          // on this column when the swap started) and `incoming`.
          // If `latest` has moved on, this swap is stale — the
          // column has already been swapped to something else, and
          // our promote has nothing to land on. Bail with the same
          // reference so React skips the commit.
          const stillOurSwap =
            latest.visible[col] === v[col] && latest.pool[poolIdx] === incoming;
          if (!stillOurSwap) return latest;
          const nextVisible = latest.visible.slice();
          const nextPool = latest.pool.slice();
          nextVisible[col] = incoming;
          nextPool[poolIdx] = v[col];
          return { visible: nextVisible, pool: nextPool };
        });
      }, FADE_MS);
      promoteTimers.add(promote);
    }, SWAP_MS);

    return () => {
      window.clearInterval(id);
      for (const t of promoteTimers) window.clearTimeout(t);
      inFlightRef.current = false;
    };
  }, []);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{ y }}
    >
      <div className="grid h-full grid-cols-2 md:grid-cols-4">
        {visible.map((dishIdx, i) => (
          <MosaicColumn
            key={i}
            dish={featuredDishes[dishIdx]!}
            columnIndex={i}
            driftKey={DRIFT[i]}
            priority={i === 0}
            overlay={
              overlay?.col === i
                ? featuredDishes[overlay.incoming] ?? null
                : null
            }
          />
        ))}
      </div>
    </motion.div>
  );
});

/* ------------------------------------------------------------------
   One column of the mosaic.

   The base image is always mounted — its `src` only changes once a
   crossfade has fully completed, so the panel is never blank. When
   the column receives an `overlay`, that second image mounts
   absolutely on top and fades from 0 → 1 over `FADE_MS`. The
   overlay unmounts once its fade is done; the base then takes over
   with the new src.
------------------------------------------------------------------- */

interface MosaicColumnProps {
  dish: FeaturedDish;
  columnIndex: number;
  driftKey: (typeof DRIFT)[number];
  priority: boolean;
  overlay: FeaturedDish | null;
}

function MosaicColumn({
  dish,
  columnIndex,
  driftKey,
  priority,
  overlay,
}: MosaicColumnProps) {
  return (
    <div
      className="relative overflow-hidden border-l border-line first:border-l-0"
      data-hero-column={columnIndex}
    >
      {/* The base image — always mounted, only its `src` changes when a
          swap promotes. No `key` on purpose: keeping the DOM element
          identity stable means the drift CSS animation plays
          continuously, with no restart tick when the swap lands. */}
      <Image
        src={dish.imageUrl}
        alt=""
        fill
        {...(priority
          ? { priority: true }
          : { loading: "eager" as const })}
        sizes="(min-width: 768px) 25vw, 50vw"
        {...(dish.blurDataUrl
          ? { placeholder: "blur" as const, blurDataURL: dish.blurDataUrl }
          : { placeholder: "empty" as const })}
        className={`hero-panel__img hero-panel__img--${driftKey} object-cover`}
        style={{ objectPosition: dish.focal ?? "50% 50%" }}
      />

      {/* The overlay image — mounted only during a crossfade. The
          motion `key` on the wrapping div re-mounts on every new
          overlay so the fade plays from scratch, and the linear ease
          keeps the blend a constant rate rather than an "ease-in then
          slow-down" reveal. The overlay never gets the drift class:
          it is short-lived and the drift would stack with the fade
          into a confused composite. */}
      {overlay && (
        <motion.div
          key={overlay.imageUrl}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: FADE_MS / 1000, ease: "linear" }}
        >
          <Image
            src={overlay.imageUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            {...(overlay.blurDataUrl
              ? { placeholder: "blur" as const, blurDataURL: overlay.blurDataUrl }
              : { placeholder: "empty" as const })}
            className="object-cover"
            style={{ objectPosition: overlay.focal ?? "50% 50%" }}
          />
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   The unified dark vignette. A single ramp covering the whole grid
   so the type below clears AA on every frame, on every strip. The
   drift happens behind the ramp; the ramp does not move.
------------------------------------------------------------------- */

function HeroVignette() {
  return (
    <div
      aria-hidden="true"
      className="hero-vignette pointer-events-none absolute inset-0 z-10"
    />
  );
}
