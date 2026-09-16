"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
 * WHAT THIS REPLACED, TWICE. First a full-screen crossfade switcher, which
 * showed one room at a time behind a heavy dark veil — a good mechanism
 * for a bad idea, because a guest deciding where to sit wants to *see the
 * rooms*. That became a staggered editorial grid, which fixed the
 * darkness and the one-at-a-time problem but left the photographs as a
 * static pile: three frames stacked in a column, all of them already on
 * screen, none of them asking to be looked at.
 *
 * So the section is now a two-column glide. The copy is pinned on the
 * left; the three rooms run down the right at `gap-32`, and they pass
 * the pinned copy rather than sitting beside it. That is the difference
 * between a page that has photographs on it and a page that moves.
 *
 * THE CAPTION FOLLOWS THE ROOM, AND THAT IS NOT A SWITCHER. The pinned
 * block crossfades to whichever room is beside it, because a caption
 * that names the terrace while the AC room is on screen is worse than no
 * caption at all. It is scroll-driven, never user-operated: there is no
 * tab, no button, no control of any kind in this section, and the rail
 * under the caption is an indicator rather than a widget — three
 * hairlines, one of them filled. All three descriptions are in the DOM at
 * all times, so nothing here can hide content the way the old crossfade
 * did. A reader who never touches anything still gets every word.
 *
 * THE SWAP IS `lg`-ONLY, AND THAT IS NOT LAZINESS. Below `lg` there is no
 * second column to pin against: the copy would sit above the photographs
 * and be scrolled off screen by the time the second room arrived, so the
 * caption would be describing a room nobody can see. On a phone each
 * room keeps its own caption under its own frame, and the pinned block is
 * `display: none` — out of the layout and out of the accessibility tree,
 * so no room is ever announced twice.
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

export default function Atmospheres() {
  const [active, setActive] = useState(0);
  const figures = useRef<(HTMLElement | null)[]>([]);

  /**
   * Which room the pinned caption is describing.
   *
   * The band is pulled in hard from both edges (`-45%` / `-45%`), leaving
   * a strip through the middle of the viewport. Only one figure can be in
   * a strip that thin, which is the point: a wider band would let two
   * rooms claim the caption at the gap between them, and the copy would
   * flicker back and forth on a slow scroll. Crossing the gap, nothing
   * intersects and the last room keeps the caption — which is right, and
   * is also why `active` is never reset to a default here.
   */
  useEffect(() => {
    const els = figures.current.filter((el): el is HTMLElement => el !== null);
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
      id="atmospheres"
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
          ---------------------------------------------------------------- */}
          <div className="lg:sticky lg:top-24 lg:self-start">
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

            {/* The caption that tracks the column opposite. All three are
                stacked in a single grid cell, so the block's height is
                the tallest of them and the pin never jumps as it swaps.

                ONLY OPACITY CHANGES — never `aria-hidden`. An earlier
                pass hid the two inactive copies from the accessibility
                tree, which meant a screen reader at `lg` was told about
                one room and two photographs it could not name. Every room
                is described here exactly once, in order, and the
                `opacity-0` copies are still real text in the DOM. The
                duplication that *would* follow is handled at the figure:
                its index-and-name strip is decorative reinforcement and
                carries `aria-hidden` itself. */}
            <div className="mt-14 hidden lg:block">
              <div className="grid">
                {ROOMS.map((room, i) => (
                  <div
                    key={room.id}
                    className={cn(
                      "col-start-1 row-start-1 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      i === active ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <p className="mb-5 text-[10px] uppercase tracking-[0.32em] text-ink-faint">
                      {room.index}
                    </p>
                    <RoomCopy room={room} level="h3" />
                  </div>
                ))}
              </div>

              {/* The rail. Three hairlines, one filled — an indicator, not
                  a control. `aria-hidden` because the caption above
                  already says which room this is; a screen reader hearing
                  "one of three" twice per scroll adds nothing. */}
              <div aria-hidden="true" className="mt-12 flex gap-3">
                {ROOMS.map((room, i) => (
                  <span
                    key={room.id}
                    className={cn(
                      "h-px w-14 transition-colors duration-500",
                      i === active ? "bg-ink" : "bg-line-strong",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------
              The glide. Three rooms at `gap-32`, passing the pinned copy.
          ---------------------------------------------------------------- */}
          <div className="mt-16 flex flex-col gap-32 lg:mt-0">
            {ROOMS.map((room, i) => (
              <figure
                key={room.id}
                ref={(el) => {
                  figures.current[i] = el;
                }}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={room.shot.src}
                    alt={room.shot.alt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    placeholder="blur"
                    className="object-cover"
                    style={{ objectPosition: room.shot.focal ?? "50% 50%" }}
                  />
                </div>

                {/* Below `lg` this is the only caption. At `lg` and up it
                    is `display: none`, so the pinned column's copy is the
                    only copy and no room is announced twice. */}
                <figcaption className="mt-7 lg:hidden">
                  <p className="mb-4 text-[10px] uppercase tracking-[0.32em] text-ink-faint">
                    {room.index}
                  </p>
                  <RoomCopy room={room} level="h3" />
                </figcaption>

                {/* Visual reinforcement only: the index and the room name
                    are already in the pinned column, so this strip is
                    `aria-hidden` rather than a second announcement. */}
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
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
