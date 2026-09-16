import type { SVGProps } from "react";

/**
 * Hand-drawn hairline glyphs.
 *
 * Deliberately not an icon library: the brief (and the design system)
 * calls for ultra-light, precise strokes. Every glyph here is 1.4px on
 * a 24px grid, `currentColor`, and inherits type size.
 */

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

export type GlyphProps = SVGProps<SVGSVGElement>;

/** Diagonal arrow — the trailing mark inside CTA "islands". */
export function ArrowUpRight(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17 17 7M17 7H8.5M17 7v8.5" />
    </svg>
  );
}

/** Stroked WhatsApp mark: speech bubble, tail, handset. */
export function WhatsAppGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.2a8.8 8.8 0 0 0-7.5 13.3L3.2 20.8l4.4-1.2A8.8 8.8 0 1 0 12 3.2Z" />
      <path d="M9.1 8.3c.3 2.1 2.1 3.9 4.2 4.2l.9-1.1 1.7.9c-.3 1.1-1.4 1.8-2.5 1.6-2.8-.5-5.3-3-5.8-5.8-.2-1.1.5-2.2 1.6-2.5l.9 1.7-1 1Z" />
    </svg>
  );
}

/** Telephone handset. */
export function PhoneGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.6 3.6h2.9l1.4 3.9-2 1.4a11.6 11.6 0 0 0 6.2 6.2l1.4-2 3.9 1.4v2.9c0 1-.8 1.8-1.8 1.7C11.5 18.6 5.4 12.5 4.9 5.4c-.1-1 .7-1.8 1.7-1.8Z" />
    </svg>
  );
}

/** Navigation arrow — points the way to the door. */
export function CompassGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.4 19.8 20.6 12 16.9 4.2 20.6 12 3.4Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------
   The bar card's nine marks.

   One glyph per list, and each one is the vessel or the plant the list
   is served in or from — not a symbol for "spirits". They exist because
   the bar book is nine blocks of prose and numbers on a black ground,
   and a reader scrolling it has nothing to orient by; a nine-pixel
   hairline mark beside each heading is the cheapest handhold there is.

   Drawn to the same rule as the four above (24px grid, 1.4 stroke,
   `currentColor`, `aria-hidden` baked into `base`), and drawn to be
   told apart *at 18px on plum* rather than at 240px on white. That
   is why the mug has a handle and the pilsner does not, why the snifter
   is a wide bowl on a stub of stem and the wine glass a narrow one on a
   long stem, and why the cask's bands run past the staves. Two glasses
   that differ only in the curve of a bowl are one glass at this size.
------------------------------------------------------------------- */

/** Spirits bottle — narrow neck, square shoulder, a label line. */
export function BottleGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.6 3.4h2.8v4.2c1.5.5 2.4 1.8 2.4 3.3v8.5a1.6 1.6 0 0 1-1.6 1.6H9.8a1.6 1.6 0 0 1-1.6-1.6v-8.5c0-1.5.9-2.8 2.4-3.3V3.4Z" />
      <path d="M8.2 15h7.6" />
    </svg>
  );
}

/** Snifter — a wide balloon on a short stem. */
export function SnifterGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.4 3.8h11.2c0 5.6-2.5 9-5.6 9s-5.6-3.4-5.6-9Z" />
      <path d="M12 12.8v6.4" />
      <path d="M8.6 19.2h6.8" />
    </svg>
  );
}

/** Cask — staves under two hoops, seen from the side. */
export function CaskGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.6 4.8c-1.9 2.1-2.9 4.5-2.9 7.2s1 5.1 2.9 7.2h6.8c1.9-2.1 2.9-4.5 2.9-7.2s-1-5.1-2.9-7.2H8.6Z" />
      <path d="M6.2 9.6h11.6M6.2 14.4h11.6" />
    </svg>
  );
}

/** Rocks tumbler — straight-sided, with the thick base that reads as glass. */
export function TumblerGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7.4 6.2h9.2l-.8 12.4a1.6 1.6 0 0 1-1.6 1.5h-4.4a1.6 1.6 0 0 1-1.6-1.5L7.4 6.2Z" />
      <path d="M7.9 17H16" />
    </svg>
  );
}

/** Cane — one stalk, two leaves, cut at the foot. */
export function CaneGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M11.6 20.6V5.4" />
      <path d="M11.6 9.8c-2.6-.5-4.2-1.9-4.8-4.4 2.6.5 4.2 1.9 4.8 4.4Z" />
      <path d="M11.6 14.6c2.6-.5 4.2-1.9 4.8-4.4-2.6.5-4.2 1.9-4.8 4.4Z" />
      <path d="M8.6 20.6h6" />
    </svg>
  );
}

/** Juniper — three berries on a needled sprig. */
export function JuniperGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20.6V7.2" />
      <path d="M12 11 8.6 8.8M12 14.2l3.4-2.2M12 17.4l-3.4-2.2" />
      <path d="M12 4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z" />
      <path d="M9.2 6a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z" />
      <path d="M14.8 6a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z" />
    </svg>
  );
}

/** Wine glass — a narrow bowl on a long stem. */
export function WineGlassGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7.8 3.8h8.4c0 4-1.8 6.9-4.2 7.7-2.4-.8-4.2-3.7-4.2-7.7Z" />
      <path d="M12 11.5v8" />
      <path d="M8.2 19.5h7.6" />
    </svg>
  );
}

/** Beer mug — short, wide, and the only vessel here with a handle. */
export function BeerMugGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.6 5.2h9.2v13a1.6 1.6 0 0 1-1.6 1.6H8.2a1.6 1.6 0 0 1-1.6-1.6v-13Z" />
      <path d="M6.6 8.6h9.2" />
      <path d="M15.8 9.2h1.5a1.5 1.5 0 0 1 1.5 1.5v3.8a1.5 1.5 0 0 1-1.5 1.5h-1.5" />
    </svg>
  );
}

/** Pilsner — tall and tapered, no handle. */
export function PilsnerGlyph(props: GlyphProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.4 3.6h7.2l-1.1 16a1.6 1.6 0 0 1-1.6 1.5h-1.8a1.6 1.6 0 0 1-1.6-1.5l-1.1-16Z" />
      <path d="M8.9 9.4h6.2" />
    </svg>
  );
}
