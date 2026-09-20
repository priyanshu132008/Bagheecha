"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { MaskReveal } from "@/components/motion/MaskReveal";
import { Button } from "@/components/ui/Button";
import {
  AC_DINING_IMAGES,
  NON_AC_IMAGES,
  TERRACE_IMAGES,
  type Shot,
} from "@/lib/constants/images";
import { WHATSAPP_RESERVATION_HREF, ZONES } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/**
 * Atmospheres — a pinned caption beside a column of rooms.
 *
 * The column architecture hasn't moved across the 2026-09-20
 * editorial passes: three rooms in one stacked column, each passing
 * the pinned copy, and the caption crossfading to whichever room is
 * currently beside it. What the passes refined is the *finish* —
 * the copy, the captions under each photograph, and the rail
 * underneath the pinned column.
 *
 *  S1 (Sep 20, morning): the per-zone fragment ids (`#space-terrace`,
 *  `#space-ac`, `#space-classic`) were added to each figure so the
 *  hero bottom strip could deep-link into the section.
 *
 *  S2 (Sep 20, evening): the brief asks for a quieter section — no
 *  ghost numerals, no decorative hairlines, and a clearer caption
 *  under each photograph. The 12vw Playfair backdrop numerals are
 *  gone; in their place, a small `01 / 03` eyebrow above each room
 *  title (at every width). The decorative `<figcaption>` strip on
 *  `lg` collapses from `index + hairline + name` to a single caption
 *  string — `01 — Terrace Lounge` — with the hairline rule removed.
 *  Each photograph now carries a subtle bottom gradient so the image
 *  anchors into the cream ground instead of floating against it.
 *
 *  Two new interactive elements (editorial override, see
 *  `frontend/CLAUDE.md` §4 and `e2e/atmospheres.spec.ts:86–100`):
 *
 *    - A clickable `01 / 02 / 03` progress rail in the pinned column.
 *      Three buttons with a 44 px hit area each; the active state is
 *      `text-ink` plus a 1 px underline, mirrored from the same
 *      `active` index that drives the pinned caption's crossfade.
 *      Clicking one smooth-scrolls to the corresponding figure, using
 *      the `id` already on the figure (S1).
 *
 *    - A per-room WhatsApp CTA below each caption — three in the
 *      pinned column at `lg`, and one inside each figure's
 *      figcaption below `lg`. All three point at the existing
 *      `WHATSAPP_RESERVATION_HREF`; the pre-filled template already
 *      names `Preferred Seating (Terrace/AC/Classic)` so the
 *      `wa.me` URL is byte-identical to the rest of the site.
 *
 *  The column architecture itself — sticky/grid mechanics, the
 *  three-deep caption stack whose opacities the e2e test polls, and
 *  the `gap-32` figure column — is byte-identical to before.
 */

type Room = {
  id: string;
  index: string;
  shot: Shot;
  name: string;
  body: string;
  tagline: string;
  /** Label rendered inside the per-room WhatsApp CTA. */
  ctaLabel: string;
};

const TERRACE = ZONES.find((z) => z.id === "terrace")!;
const AC = ZONES.find((z) => z.id === "ac")!;
const CLASSIC = ZONES.find((z) => z.id === "nonac")!;

const TOTAL = 3;

const ROOMS: Room[] = [
  {
    id: "terrace",
    index: "01",
    shot: TERRACE_IMAGES[1],
    name: TERRACE.name,
    body: "Open-air seating under a timber roof, palm trees at the edge of the view, and cocktails poured till late.",
    tagline: "Open-air · Bar service · Evenings",
    ctaLabel: "Reserve the terrace",
  },
  {
    id: "ac",
    index: "02",
    shot: AC_DINING_IMAGES[0],
    name: AC.name,
    body: "An air-conditioned room, quiet enough to talk. Made for birthdays, anniversaries and family tables that run long.",
    tagline: "Air-conditioned · Celebrations · Families",
    ctaLabel: "Reserve the AC room",
  },
  {
    id: "nonac",
    index: "03",
    shot: NON_AC_IMAGES[0],
    name: CLASSIC.name,
    body: CLASSIC.detail,
    tagline: "Non-AC · Quick service · Big groups",
    ctaLabel: "Reserve the classic room",
  },
];

/** Pad `1` to `01`, `2` to `02`, … — for the `01 / 03` eyebrow. */
const padIndex = (n: number) => n.toString().padStart(2, "0");
/** S2: total room count, formatted the same way for the `01 / 03` form. */
const TOTAL_LABEL = padIndex(TOTAL);
/** S2: map the legacy `nonac` room id to the canonical `classic` fragment. */
const figureIdFor = (roomId: string) => `space-${roomId === "nonac" ? "classic" : roomId}`;

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
   The progress rail — three clickable labels, one per room.

   S2: the previous build drove three hairline bars with `useScroll`
   so the fill tracked each figure's scroll progress. The brief
   replaces that with three `01 02 03` text labels — clickable,
   44 px hit area, an active state that mirrors the pinned caption's
   current room. The fill-by-scrollYProgress behaviour is gone; what
   stays is the active/inactive switch that already drove the pinned
   copy, which is what the labels now mirror.

   The `aria-pressed` attribute toggles with `active` so a screen
   reader announces the active room as a pressed toggle rather than
   as a static label. `aria-label` adds the word "room" so "01" is
   read as "Jump to room 01" rather than as a bare numeral.

   The wrapping div in the JSX is `role="group"` with its own label
   so the three buttons are announced together instead of as three
   unrelated controls.
------------------------------------------------------------------- */

function RoomProgressButton({
  active,
  index,
  onSelect,
}: {
  active: boolean;
  index: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Jump to room ${index}`}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center px-3",
        "text-[11px] uppercase tracking-[0.2em]",
        "transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        active
          ? "text-ink underline decoration-1 underline-offset-[6px]"
          : "text-ink-faint hover:text-ink",
      )}
    >
      {index}
    </button>
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
      id={figureIdFor(room.id)}
      data-room-id={room.id}
      /* S1: each figure is a deep-link target from the hero bottom
          strip (Terrace Lounge ◆ AC Fine Dining ◆ Classic Dining).
          S2: the same id is now also a jump target for the clickable
          progress labels (`RoomProgressButton`) in the pinned column.
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
        {/* S2: subtle bottom gradient so the photograph anchors into
            the page instead of floating against the cream ground.
            Sits above the photo's `motion.div` so the gradient lands
            on the image, but `pointer-events-none` so clicks still
            pass through. Decorative only, hence `aria-hidden`. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-plum/35 to-transparent"
        />
      </div>

      {/* Below `lg` this is the only caption. At `lg` and up it is
          `display: none`, so the pinned column's copy is the only
          copy and no room is announced twice.

          S2: index format is now `01 / 03` (matching the eyebrow
          style used elsewhere), and the per-room WhatsApp CTA is
          rendered here so mobile guests can reserve without scrolling
          back to the pinned column. */}
      <figcaption className="mt-7 lg:hidden">
        <p className="mb-4 text-[10px] uppercase tracking-[0.32em] text-ink-faint">
          {room.index} / {TOTAL_LABEL}
        </p>
        <RoomCopy room={room} level="h3" />
        <Button
          href={WHATSAPP_RESERVATION_HREF}
          variant="secondary"
          size="sm"
          cursor="cta"
          cursorLabel="WhatsApp"
          className="mt-6"
        >
          {room.ctaLabel}
        </Button>
      </figcaption>

      {/* Visual reinforcement only: the index and the room name are
          already in the pinned column, so this strip is `aria-hidden`
          rather than a second announcement.

          S2: brief asks for a single caption string — `01 — Terrace
          Lounge` — in place of the prior index + hairline + name
          triple. The hairline rule between them is gone. */}
      <figcaption
        aria-hidden="true"
        className="mt-5 hidden items-baseline gap-3 lg:flex"
      >
        <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          {room.index} — {room.name}
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

  /**
   * S2: smooth-scroll the corresponding figure into view when one of
   * the clickable `01 / 02 / 03` progress labels is clicked. The
   * figure already carries `scroll-mt-{20,24}` so the destination
   * clears the fixed header.
   */
  const handleRoomJump = useCallback((roomId: string) => {
    const el = document.getElementById(figureIdFor(roomId));
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
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
          ---------------------------------------------------------------- */}
          <div className="relative lg:sticky lg:top-24 lg:self-start">
            <MaskReveal as="p" className="eyebrow" duration={0.8}>
              Spaces
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
                celebrations, and the everyday hall for everything in
                between. Pick the one that suits the evening.
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
                the figure: its decorative `01 — Terrace Lounge` strip
                carries `aria-hidden` itself.

                S2: the 12vw ghost numeral is gone (brief asks for a
                quiet `01 / 03` eyebrow above the title instead), and
                each caption now carries a per-room WhatsApp CTA so a
                guest reading the column can reserve without scrolling
                back to `#reserve`. */}
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
                    <p className="mb-4 text-[10px] uppercase tracking-[0.32em] text-ink-faint">
                      {room.index} / {TOTAL_LABEL}
                    </p>
                    <RoomCopy room={room} level="h3" />
                    <Button
                      href={WHATSAPP_RESERVATION_HREF}
                      variant="secondary"
                      size="sm"
                      cursor="cta"
                      cursorLabel="WhatsApp"
                      className="mt-8"
                    >
                      {room.ctaLabel}
                    </Button>
                  </div>
                ))}
              </div>

              {/* The progress rail. S2: replaced the hairline fill bars
                  with three clickable text labels — `01 / 02 / 03`.
                  Each is a real button with a 44 px hit area; clicking
                  it smooth-scrolls to the corresponding figure. The
                  wrapping div is `role="group"` with its own label so
                  a screen reader announces the three together rather
                  than as three unrelated controls. */}
              <div
                role="group"
                aria-label="Jump to room"
                className="mt-12 flex gap-3"
              >
                {ROOMS.map((room, i) => (
                  <RoomProgressButton
                    key={room.id}
                    index={room.index}
                    active={i === active}
                    onSelect={() => handleRoomJump(room.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------
              The glide. Three rooms at `gap-32`, passing the pinned copy.
              Each figure carries a ref so the pinned column's
              IntersectionObserver can track which room is in view, and
              so the new clickable progress buttons can scroll to it.
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
