import Image, { type StaticImageData } from "next/image";

import { cn } from "@/lib/utils";

/**
 * PhotoBackdrop — a full-bleed photograph, graded to the house look.
 *
 * The grade was inverted when the palette flipped. Under Obsidian &
 * Editorial every frame was desaturated and pulled down a stop
 * (`saturate(0.5) brightness(0.7)`) because a flash-lit daylight shot
 * reads as neon against pure black. On cream the opposite is true:
 * the photography *is* the warmth of the page, and grading it down was
 * what made the site feel like a carpenter's portfolio. The grades now
 * sit at or just above neutral.
 *
 * The overlay is a cap, not a dial. The brief allows a maximum of
 * `bg-black/20` on the hero — enough to seat the navigation, not enough
 * to dim the room. Anything that needs more contrast than that gets it
 * from a *localised* gradient behind the text rather than from darkening
 * the whole frame, because a flat veil spends the photograph everywhere
 * in order to fix one corner.
 *
 * That gradient is deliberately NOT a prop here. It lives in `Hero.tsx`,
 * which owns four of them, each aimed at the thing it protects, split at
 * `md` because the copy reflows there. A `scrim` boolean used to sit on
 * this component and was a worse idea: it implied one bottom ramp was
 * enough, and the section that needed the masking most could not use it.
 *
 * `fill` is always used, so the container owns the box and its aspect
 * ratio. That is what keeps CLS at zero: the box is sized before a byte
 * of image arrives. Static imports give next/image the intrinsic
 * dimensions and a blur placeholder at build time.
 *
 * Presentational only — no hooks, no client directive — so it renders
 * from either a server or a client tree.
 */

const GRADE = {
  /** Untouched, or near enough. For the hero and the editorial grid. */
  vibrant: "saturate(1.04) contrast(1.04) brightness(1.01)",
  /** The default: a hair of contrast, no colour cast. */
  natural: "saturate(1) contrast(1.03) brightness(0.99)",
  /** For photography inside a plum section, which needs seating. */
  muted: "saturate(0.9) contrast(1.05) brightness(0.9)",
} as const;

export type PhotoBackdropProps = {
  image: StaticImageData;
  /** Required. Describe the photograph; never leave it decorative. */
  alt: string;
  /** Flat veil over the image. Capped at 20% — see the note above. */
  overlay?: "bg-black/0" | "bg-black/10" | "bg-black/20";
  grade?: keyof typeof GRADE;
  /** Responsive width hint. Always pass one — `100vw` is rarely right. */
  sizes?: string;
  /** Set on the one above-the-fold image only. */
  priority?: boolean;
  /** CSS `object-position` — keeps an off-centre subject in frame. */
  focal?: string;
  className?: string;
};

export function PhotoBackdrop({
  image,
  alt,
  overlay = "bg-black/0",
  grade = "natural",
  sizes = "100vw",
  priority = false,
  focal = "50% 50%",
  className,
}: PhotoBackdropProps) {
  return (
    <>
      <Image
        src={image}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        className={cn("object-cover", className)}
        style={{ filter: GRADE[grade], objectPosition: focal }}
      />

      {overlay !== "bg-black/0" && (
        <span aria-hidden="true" className={cn("absolute inset-0", overlay)} />
      )}
    </>
  );
}
