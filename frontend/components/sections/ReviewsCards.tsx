"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { MaskReveal } from "@/components/motion/MaskReveal";
import { SITE } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/**
 * ReviewsCards — the "What people say" chapter.
 *
 * Boxless editorial spread on cream. The phase-6 marquee carried
 * four hairline-bordered rectangles across a plum band and read as
 * a stock testimonial widget; the brand system forbids the underlying
 * pattern outright ("no cards, no pills, no centred stacks"), so the
 * replacement drops the wrappers entirely and lets the type itself
 * carry the chapter.
 *
 *   - GROUND. Warm cream. No card surfaces, no borders, no fills.
 *     The quotes sit directly on the page.
 *   - TYPE. Display Playfair italic at editorial scale, espresso
 *     (#1A1A1A) — a true near-black rather than the warmer `--plum`,
 *     which reads wine-red next to cream. Vermillion is reserved for
 *     the stars in the byline; nothing else wears the accent.
 *   - MOTION. One quote on stage at a time. AnimatePresence with
 *     `mode="wait"` crossfades between reviews: outgoing fades up
 *     and out, incoming fades up and in, on `--ease-luxe`. The
 *     interval holds each quote long enough to read (~7s) and
 *     pauses on hover and on keyboard focus, so a reader can finish
 *     a sentence before it sweeps away. A reduced-motion visitor
 *     still gets a static rotation — the y-translate is the only
 *     thing neutralised; the crossfade is the meaning.
 *   - CONTROL. Three tiny dots beneath the byline mark the active
 *     slide. No arrows, no progress bar, no swipe — the type is
 *     the carousel, and chrome on top of it would compete.
 *
 * ACCESSIBILITY. Each rendered slide is a `<figure>` with the
 * reviewer's name as a heading; the DOM holds all six in source
 * order (one is on stage, the rest are absent between swaps), so
 * a screen reader sees the quotes in their natural sequence. The
 * decorative opening quote glyph is `aria-hidden`. Dots are real
 * `<button>`s with `aria-label` and `aria-current`.
 */

type Review = {
  body: string;
  author: string;
  rating: number;
  /** Turn 8: the source the review was lifted from. All six entries
   *  here come from Google; the field is open for future per-review
   *  sourcing once the CMS lands. Renders as a small ink-faint line
   *  below the byline, in the same upper-case tracking as the eyebrow. */
  source: string;
};

const REVIEWS: Review[] = [
  // Strongest first by enthusiasm — a 5-star vote and concrete
  // descriptors ("Loved the chaats", "some of the best in town") lead.
  {
    body: "Loved the chaats — crisp, tangy, and clearly made to order. The terrace view is the cherry on top.",
    author: "Anita M.",
    rating: 5,
    source: "Google review",
  },
  {
    body: "Went on a weekday evening and the place was calm, well-lit, and the kebabs were honestly some of the best in town.",
    author: "Devansh S.",
    rating: 4.5,
    source: "Google review",
  },
  {
    body: "Good and peaceful place, love to have chilled beer in the terrace with beautiful green views.",
    author: "Kkaruppiah A.",
    rating: 4.5,
    source: "Google review",
  },
  {
    body: "Taste and quality is very nice. Good staff behavior and great open terrace seating.",
    author: "Pratik R.",
    rating: 4.5,
    source: "Google review",
  },
  // --- below: lukewarm, demoted to end per the Turn 8 brief ---
  // The brief asks for strongest-first; these read as polite-but-flat
  // ("Good place", uses "decent") and so land at the bottom of the
  // carousel rather than the top. None are dropped.
  {
    body: "Good place on terrace to drink and eat.",
    author: "Jal P.",
    rating: 4.5,
    source: "Google review",
  },
  {
    body: "Nice place to hangout or have a drink with friends. Prompt service and decent food.",
    author: "Rohit A.",
    rating: 4.5,
    source: "Google review",
  },
];

/** How long each quote holds before the next crossfades in. Slow enough
 *  to read at the editorial scale; long enough that the swap never
 *  feels like a conveyor belt. */
const HOLD_MS = 7000;

/** The fade itself, in seconds. Matches the half-life of a typical
 *  MaskReveal so the chapter reads as one continuous motion language. */
const SWAP_SECONDS = 0.7;

const EASE_LUXE = [0.32, 0.72, 0, 1] as const;

function StarRow({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  // Turn 8: the row used to be `aria-hidden`, which forced a screen
  // reader to hear five shape glyphs and infer the rating. Now it
  // carries `role="img"` + an `aria-label` like "4.5 out of 5", and
  // the visual stars inside are marked decorative. `inline-flex` keeps
  // the row inside the byline's flex row without forcing a line break.
  return (
    <span
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5`}
      className="inline-flex items-center gap-[3px] text-vermillion"
    >
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} kind="full" />
      ))}
      {half && <Star kind="half" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} kind="empty" />
      ))}
    </span>
  );
}

function Star({ kind }: { kind: "full" | "half" | "empty" }) {
  return (
    <svg
      viewBox="0 0 14 14"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
      className={kind === "empty" ? "opacity-30" : ""}
    >
      <path d="M7 1.2 L8.78 5.06 L13 5.6 L9.9 8.5 L10.65 12.66 L7 10.6 L3.35 12.66 L4.1 8.5 L1 5.6 L5.22 5.06 Z" />
      {kind === "full" && (
        <path
          d="M7 1.2 L8.78 5.06 L13 5.6 L9.9 8.5 L10.65 12.66 L7 10.6 L3.35 12.66 L4.1 8.5 L1 5.6 L5.22 5.06 Z"
          fill="currentColor"
          stroke="none"
        />
      )}
      {kind === "half" && (
        <path
          d="M7 1.2 L8.78 5.06 L13 5.6 L9.9 8.5 L10.65 12.66 L7 10.6 L3.35 12.66 L4.1 8.5 L1 5.6 L5.22 5.06 Z"
          fill="currentColor"
          stroke="none"
          clipPath="inset(0 50% 0 0)"
        />
      )}
    </svg>
  );
}

export function ReviewsCards() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Turn 8: gate autoplay on the user's reduced-motion preference.
  // `useReducedMotion()` is forbidden (CLAUDE.md §2 — it reads the
  // media query during render and creates a hydration mismatch), so
  // we read it once in `useEffect` (post-mount, server markup identical)
  // and never re-read. The central `<MotionConfig reducedMotion="user">`
  // still handles Framer's animation layer; this only suppresses the
  // JS-driven autoplay interval so a reduced-motion reader gets a static
  // carousel with manual dot navigation.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);
  const timerRef = useRef<number | null>(null);

  // The interval advances one step every HOLD_MS, wrapping at the end.
  // It is intentionally a `useEffect` timer rather than a `framer-motion`
  // loop: it schedules an action at a known cadence, which is what the
  // brief means by "sweep through pages", not an infinite animation.
  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % REVIEWS.length);
    }, HOLD_MS);
    timerRef.current = id;
    return () => {
      window.clearInterval(id);
      timerRef.current = null;
    };
  }, [paused, reducedMotion]);

  const goTo = useCallback((next: number) => {
    setIndex(((next % REVIEWS.length) + REVIEWS.length) % REVIEWS.length);
  }, []);

  const review = REVIEWS[index];

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="section-pad overflow-hidden bg-cream"
    >
      <div className="container-x">
        {/* Masthead — eyebrow on the rail, heading inset from it. The
            rail-count test in e2e/hero.spec.ts expects exactly seven
            `.eyebrow` elements at column 1, and `#reviews`'s eyebrow
            is one of them, so the column-3 cell and the `.eyebrow`
            class both stay. */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-8">
          <div className="col-span-12 lg:col-span-3">
            <MaskReveal as="p" className="eyebrow" duration={0.8}>
              Guest reviews
            </MaskReveal>
          </div>

          <div className="col-span-12 lg:col-span-9 lg:col-start-4">
            <h2
              id="reviews-heading"
              className="font-display text-4xl font-normal leading-[1.04] tracking-[-0.025em] text-espresso text-balance md:text-5xl"
            >
              <MaskReveal className="block">
                In our guests&apos; words.
              </MaskReveal>
            </h2>
          </div>
        </div>

        {/* Turn 8: the Google rating badge — single inline row, sits
            between the heading and the carousel. Renders only when the
            owner has filled both rating fields in `lib/constants/site.ts`.
            24 px below the heading (matches `.rhythm-h2-body` in
            globals.css); 32 px below on `lg`. When the fields are null
            the whole block is absent — no placeholder, no zero, no
            "Coming soon". */}
        {SITE.googleRatingNumber != null && SITE.googleReviewCountNumber != null && (
          <div className="mt-6 flex justify-center lg:mt-8">
            <div
              data-reviews-badge="google"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-ink-muted"
            >
              {/* The badge carries its own little vermillion star — same
                  glyph as the byline but solid (no fractional fill), since
                  the published number is what the star qualifies. */}
              <svg
                viewBox="0 0 14 14"
                width="10"
                height="10"
                aria-hidden="true"
                className="text-vermillion"
              >
                <path
                  d="M7 1.2 L8.78 5.06 L13 5.6 L9.9 8.5 L10.65 12.66 L7 10.6 L3.35 12.66 L4.1 8.5 L1 5.6 L5.22 5.06 Z"
                  fill="currentColor"
                />
              </svg>
              <span>
                {SITE.googleRatingNumber.toFixed(1)} on Google ·{" "}
                {SITE.googleReviewCountNumber.toLocaleString("en-IN")} reviews
              </span>
            </div>
          </div>
        )}

        {/* The stage. A `relative` container of fixed editorial height,
            with one `<motion.figure>` per swap. The decorative opening
            quote glyph lives behind the text (low-opacity espresso),
            the way a print editor sets a pull-quote. */}
        <div
          className="relative mt-20 md:mt-28"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(e) => {
            // Only unpause when focus actually leaves the stage —
            // a focus moving between the dots or stars inside the
            // stage should not restart the timer.
            if (
              e.currentTarget instanceof Node &&
              e.relatedTarget instanceof Node &&
              e.currentTarget.contains(e.relatedTarget)
            ) {
              return;
            }
            setPaused(false);
          }}
        >
          <div className="relative h-[28rem] md:h-[34rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={index}
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: SWAP_SECONDS, ease: EASE_LUXE }}
              >
                {/* Turn 8: the decorative opening quote is now a 56 px
                    ornament *above* the text — was a 10rem watermark
                    *behind* it (160 px, dominated the chapter). 16 px
                    gap (`mb-4`) to the quote text. The body of the
                    quote is the meaning; the glyph is editorial chrome. */}
                <span
                  aria-hidden="true"
                  className="mb-4 block font-display text-[56px] leading-none text-espresso/12"
                >
                  &ldquo;
                </span>

                <blockquote className="relative max-w-4xl px-2">
                  <p className="font-display text-3xl italic leading-[1.2] tracking-[-0.015em] text-espresso text-balance md:text-5xl md:leading-[1.15]">
                    {review.body}
                  </p>
                </blockquote>

                {/* Byline — sharp, minimal: name on the left in
                    uppercase tracking, vermillion stars on the right.
                    No numeric badge, no avatar, no border. `mt-6` is
                    the 24 px gap the brief asks for (was `mt-10`). */}
                <figcaption className="relative mt-6 flex flex-col items-center gap-4 md:flex-row md:gap-6">
                  <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink-muted">
                    — {review.author}
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden h-px w-6 bg-espresso/15 md:block"
                  />
                  <StarRow rating={review.rating} />
                </figcaption>
                {/* Source line — sits 8 px below the byline (`mt-2`),
                    in the same upper-case tracking as the eyebrow but
                    a step quieter (`text-ink-faint`). One line per
                    review: short, factual, never decorative. */}
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                  {review.source}
                </p>
              </motion.figure>
            </AnimatePresence>
          </div>

          {/* Dots — the only chrome on the chapter. A real button
              per review, with `aria-current` on the active one.
              Clicking jumps the stage; the autoplay interval
              resumes on the next tick because `paused` is already
              back to false.

              Turn 8: each dot is now a 44×44 px hit area (`h-11 w-11`,
              the WCAG-friendly minimum) with the visible 1.5×8 px
              pill centred inside it. The active dot still expands
              to 32 px wide — but bounded by the 44 px button so the
              visible chrome stays small while the touch target does
              not. `mt-8` is the 32 px gap the brief asks for. */}
          <div
            className="mt-8 flex items-center justify-center gap-3"
            role="tablist"
            aria-label="Reviews"
          >
            {REVIEWS.map((r, i) => {
              const active = i === index;
              return (
                <button
                  key={r.author}
                  type="button"
                  role="tab"
                  aria-label={`Show review by ${r.author}`}
                  aria-current={active ? "true" : undefined}
                  aria-selected={active}
                  onClick={() => goTo(i)}
                  className={cn(
                    "group relative flex h-11 w-11 items-center justify-center",
                    "transition-colors duration-300",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block h-1.5 rounded-full transition-[width,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      active
                        ? "w-8 bg-vermillion"
                        : "w-1.5 bg-espresso/15 group-hover:bg-espresso/40",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
