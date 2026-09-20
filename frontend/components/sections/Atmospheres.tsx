"use client";

import { motion, useScroll } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";

import { MaskReveal } from "@/components/motion/MaskReveal";
import {
  AC_DINING_IMAGES,
  NON_AC_IMAGES,
  TERRACE_IMAGES,
  type Shot,
} from "@/lib/constants/images";
import { ZONES } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/**
 * Atmospheres — a pinned caption beside a column of rooms.
 *
 * The column architecture hasn't moved: three rooms in one stacked
 * column, each passing the pinned copy, and the caption crossfading
 * to whichever room is currently beside it. What changed in the 2026-
 * 09-20 editorial pass is the *finish* — the numbers, the photograph
 * arrivals, and the rail underneath.
 *
 * THREE NEW LAYERS, AND WHY EACH IS LOAD-BEARING.
 *
 *  1. THE MASSIVE INDEX NUMBER. The "01" / "02" / "03" used to be a
 *     10px micro-label above each room title — visible, but not doing
 *     any work. It is now a 12vw Playfair numeral sitting behind the
 *     title and bleeding ~120px past the column edge into the image
 *     column. At low opacity (espresso at ~8%) the underlying
 *     photograph reads through it; the title sits on top in cream
 *     opacity-1, and the result is the kind of stitch a high-fashion
 *     magazine uses to glue a body of text to a body of imagery.
 *     Below `lg` the column doesn't exist, so the number doesn't
 *     either — the mobile figcaption keeps its 10px version.
 *
 *  2. THE PHOTOGRAPH ARRIVAL. Each image is now wrapped in a `motion.div`
 *     with `whileInView`, fading in over 0.8s and scaling down from
 *     1.05 to 1.0 over 1.5s — a deliberately slow, breath-led settle
 *     that the previous build snapped. The two durations split is the
 *     point: opacity lands first so the image is *recognisable*, and
 *     the scale keeps easing after that so the photograph feels like
 *     it's still arriving when it's already on screen.
 *
 *  3. THE PROGRESS RAIL. The three static hairlines under the pinned
 *     caption were an indicator with no signal. Each bar is now driven
 *     by `useScroll` against its room's own figure ref, and the fill
 *     rises 0→1 as that figure passes through the viewport. One room
 *     visible at a time means only one bar is filling at a time, but
 *     the others still carry the *track* — and a reader scrolling
 *     down past the third room sees the second bar already full, the
 *     third still empty, and knows where they are in the book. The
 *     shape is hairline-thin (1px) so it reads as a rule, not a
 *     control, and `aria-hidden` because the caption above already
 *     announces the room.
 */

type Room = {
  id: string;
  index: string;
  shot: Shot;
  name: string;
  body: string;
  tagline: string;
};

const TERRACE = ZONES.find((z) => z.id === "terrace")!;
const AC = ZONES.find((z) => z.id === "ac")!;
const CLASSIC = ZONES.find((z) => z.id === "nonac")!;

const ROOMS: Room[] = [
  {
    id: "terrace",
    index: "01",
    shot: TERRACE_IMAGES[1],
    name: TERRACE.name,
    body: "High-energy, open-air seating with signature cocktails and premium service.",
    tagline: TERRACE.tagline,
  },
  {
    id: "ac",
    index: "02",
    shot: AC_DINING_IMAGES[0],
    name: AC.name,
    body: "Cool, quiet, and elegantly appointed for family celebrations.",
    tagline: AC.tagline,
  },
  {
    id: "nonac",
    index: "03",
    shot: NON_AC_IMAGES[0],
    name: CLASSIC.name,
    body: CLASSIC.detail,
    tagline: CLASSIC.tagline,
  },
];

/** One room's words. Rendered twice — see the note on the section above. */
function RoomCopy({ room, level }: { room: Room; level: "h3" | "plain" }) {
  const Heading = level === "h3" ? "h3" : "p";
  return (
    <>
      <Heading
        className={cn(
          "font-display font-normal leading-[1.06] tracking-[-0.025em] text-ink",
          level === "h3"
            ? "text-[clamp(1.8rem,3.4vw,2.9rem)]"
            : "text-[1.6rem]",
        )}
      >
        {room.name}
      </Heading>
      <p className="mt-6 max-w-md text-pretty text-[15px] leading-7 text-ink-muted">
        {room.body}
      </p>
      <p className="mt-6 text-[10px] uppercase tracking-[0.24em] text-ink-faint">
        {room.tagline}
      </p>
    </>
  );
}

/* ------------------------------------------------------------------
   The progress rail — one hairline bar per room, driven by that
   room's scrollYProgress.

   `useScroll` watches the figure's ref and gives back a motion value
   that runs 0→1 as the element moves from "start at viewport bottom"
   to "end at viewport top". That span is the room's time on screen,
   which is what the fill maps to.

   `transformOrigin: left` keeps the fill anchored at the start edge
   so it grows rightward; `scaleX` instead of `width` so the GPU
   composites it directly without re-layout. The track is the lighter
   `--line-strong` token and the fill is espresso — the same ink the
   display headings carry, so the bar reads as part of the type
   rather than a separate UI element.
------------------------------------------------------------------- */

function RoomProgressBar({
  figureRef,
  active,
}: {
  figureRef: RefObject<HTMLElement | null>;
  active: boolean;
}) {
  const { scrollYProgress } = useScroll({
    target: figureRef,
    offset: ["start end", "end start"],
  });

  return (
    <div
      aria-hidden="true"
      className="relative h-px w-14 overflow-hidden bg-line-strong"
    >
      <motion.div
        style={{ scaleX: scrollYProgress, transformOrigin: "left center" }}
        className={cn(
          "absolute inset-0 origin-left",
          active ? "bg-espresso" : "bg-ink-faint",
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   One room's photograph — image wrapped in a motion.div that fades
   in and breathes down from 1.05 to 1.0 as it enters the viewport.

   The two durations split is the cinematic effect: 0.8s on opacity
   so the image is recognisable almost immediately, and 1.5s on scale
   so the photograph keeps settling after it's already on screen. A
   single 1.5s curve on both makes the image look like it's still
   loading when it isn't.
------------------------------------------------------------------- */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function RoomFigure({
  room,
  figureRef,
}: {
  room: Room;
  figureRef: RefObject<HTMLElement | null>;
}) {
  return (
    <figure
      ref={figureRef}
      id={`space-${room.id === "nonac" ? "classic" : room.id}`}
      data-room-id={room.id}
      /* S1: each figure is a deep-link target from the hero bottom
          strip (Terrace Lounge ◆ AC Fine Dining ◆ Classic Dining).
          scroll-margin-top clears the fixed header so the link lands
          on the figure rather than under the navbar. The two values
          match the section-pad scale on globals.css. */
      className="scroll-mt-20 md:scroll-mt-24"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
          transition={{
            opacity: { duration: 0.8, ease: EASE_OUT },
            scale: { duration: 1.5, ease: EASE_OUT },
          }}
          className="absolute inset-0"
        >
          <Image
            src={room.shot.src}
            alt={room.shot.alt}
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            placeholder="blur"
            className="object-cover"
            style={{ objectPosition: room.shot.focal ?? "50% 50%" }}
          />
        </motion.div>
      </div>

      {/* Below `lg` this is the only caption. At `lg` and up it is
          `display: none`, so the pinned column's copy is the only
          copy and no room is announced twice. */}
      <figcaption className="mt-7 lg:hidden">
        <p className="mb-4 text-[10px] uppercase tracking-[0.32em] text-ink-faint">
          {room.index}
        </p>
        <RoomCopy room={room} level="h3" />
      </figcaption>

      {/* Visual reinforcement only: the index and the room name are
          already in the pinned column, so this strip is `aria-hidden`
          rather than a second announcement. */}
      <figcaption
        aria-hidden="true"
        className="mt-5 hidden items-baseline gap-4 lg:flex"
      >
        <span className="text-[10px] tracking-[0.2em] text-ink-faint">
          {room.index}
        </span>
        <span className="h-px flex-1 bg-line" />
        <span className="text-[10px] uppercase tracking-[0.24em] text-ink-faint">
          {room.name}
        </span>
      </figcaption>
    </figure>
  );
}

export default function Atmospheres() {
  const [active, setActive] = useState(0);

  /**
   * One stable ref per figure. They are passed *both* to the figure's
   * own `ref` attribute and to the progress rail's `useScroll`, so
   * framer-motion sees the same ref object on every render rather than
   * a fresh `{ current: ... }` wrapper each pass. A wrapper object is
   * a different reference every render, and the hook's first read of
   * `ref.current` may happen before the figures have mounted, which
   * is what logs "Target ref is defined but not hydrated".
   */
  const terraceRef = useRef<HTMLElement | null>(null);
  const acRef = useRef<HTMLElement | null>(null);
  const classicRef = useRef<HTMLElement | null>(null);
  const figureRefs: RefObject<HTMLElement | null>[] = [terraceRef, acRef, classicRef];

  /**
   * Which room the pinned caption is describing.
   *
   * The band is pulled in hard from both edges (`-45%` / `-45%`),
   * leaving a strip through the middle of the viewport. Only one
   * figure can be in a strip that thin, which is the point: a wider
   * band would let two rooms claim the caption at the gap between
   * them, and the copy would flicker back and forth on a slow
   * scroll. Crossing the gap, nothing intersects and the last room
   * keeps the caption — which is right, and is also why `active` is
   * never reset to a default here.
   */
  useEffect(() => {
    const els = figureRefs
      .map((r) => r.current)
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = els.indexOf(entry.target as HTMLElement);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="spaces"
      data-tone="light"
      className="section-pad relative bg-surface"
    >
      <div className="container-x">
        <div className="grid gap-x-16 lg:grid-cols-2">
          {/* ---------------------------------------------------------------
              The pinned column.

              `self-start` is load-bearing: a grid item stretches to the
              row by default, and a stretched box has no scroll left in it
              for `sticky` to use. Without it the copy simply sits at the
              top of a two-and-a-half-thousand-pixel row and never pins.

              `relative` (added) lets the absolutely-positioned index
              numbers anchor here without leaking up to the section.
          ---------------------------------------------------------------- */}
          <div className="relative lg:sticky lg:top-24 lg:self-start">
            <MaskReveal as="p" className="eyebrow" duration={0.8}>
              Atmospheres
            </MaskReveal>

            <h2 className="mt-6 font-display text-[clamp(2rem,4.4vw,3.6rem)] font-normal leading-[1.02] tracking-[-0.025em] text-ink">
              <MaskReveal className="text-balance" delay={0.08}>
                Three rooms,
              </MaskReveal>
              <MaskReveal className="text-balance" delay={0.16}>
                one address.
              </MaskReveal>
            </h2>

            <MaskReveal delay={0.24} duration={0.9}>
              <p className="mt-7 max-w-md text-pretty text-[15px] leading-7 text-ink-muted">
                A rooftop under timber, an air-conditioned room built for
                celebrations, and the everyday hall that never closes. Pick
                the one that suits the evening.
              </p>
            </MaskReveal>

            {/* The caption that tracks the column opposite. All three
                are stacked in a single grid cell, so the block's height
                is the tallest of them and the pin never jumps as it
                swaps.

                ONLY OPACITY CHANGES — never `aria-hidden`. An earlier
                pass hid the two inactive copies from the accessibility
                tree, which meant a screen reader at `lg` was told
                about one room and two photographs it could not name.
                Every room is described here exactly once, in order,
                and the `opacity-0` copies are still real text in the
                DOM. The duplication that *would* follow is handled at
                the figure: its index-and-name strip is decorative
                reinforcement and carries `aria-hidden` itself.

                THE MASSIVE INDEX NUMBER LIVES HERE. Each crossfading
                copy is its own positioning context (`relative`), so
                the numeral can absolutely bleed right past the
                column's edge into the image column without escaping
                upward. `pointer-events-none` because a 12vw glyph
                would otherwise swallow clicks meant for the title
                underneath. */}
            <div className="mt-14 hidden lg:block">
              <div className="grid">
                {ROOMS.map((room, i) => (
                  <div
                    key={room.id}
                    className={cn(
                      "col-start-1 row-start-1 relative transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      i === active ? "opacity-100" : "opacity-0",
                    )}
                  >
                    {/* The MASSIVE editorial index. Anchored to the
                        right edge of the pinned column and bled ~120px
                        past it so it visibly crosses the gap into the
                        image column — the stitch between the type
                        column and the photograph column. Espresso at
                        8% lets the underlying image read through it
                        without competing with the title. `select-none`
                        because nothing about a 12vw backdrop numeral
                        is selectable text. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-[-clamp(4rem,7vw,8rem)] top-[-clamp(2rem,3vw,3.5rem)] select-none font-display text-[clamp(8rem,12vw,12rem)] font-normal leading-[0.85] tracking-[-0.04em] text-espresso/[0.08]"
                    >
                      {room.index}
                    </span>

                    {/* The title and body sit above the numeral. The
                        wrapping div establishes a stacking context so
                        the z-order is reliable across browsers — the
                        numeral stays behind the type even when the
                        opacity-0 → 1 transition crosses. */}
                    <div className="relative z-10">
                      <RoomCopy room={room} level="h3" />
                    </div>
                  </div>
                ))}
              </div>

              {/* The progress rail. Three hairlines, each driven by the
                  scroll progress of its own figure through the viewport.
                  `aria-hidden` because the caption above already says
                  which room this is; a screen reader hearing "one of
                  three" twice per scroll adds nothing. The hairline is
                  1px because anything thicker would compete with the
                  editorial numeral above. */}
              <div aria-hidden="true" className="mt-12 flex gap-3">
                {ROOMS.map((room, i) => (
                  <RoomProgressBar
                    key={room.id}
                    figureRef={figureRefs[i]}
                    active={i === active}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------
              The glide. Three rooms at `gap-32`, passing the pinned copy.
              Each figure carries a ref so the pinned column's progress
              rail can read its scroll position.
          ---------------------------------------------------------------- */}
          <div className="mt-16 flex flex-col gap-32 lg:mt-0">
            {ROOMS.map((room, i) => (
              <RoomFigure
                key={room.id}
                room={room}
                figureRef={figureRefs[i]}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
