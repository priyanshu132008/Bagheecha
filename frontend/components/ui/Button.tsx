"use client";

import type { ReactNode } from "react";

import { ArrowUpRight } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Button — the canonical CTA primitive (polish brief G4).
 *
 * A squared, hairline-ruled split-cell: label, then arrow. The cells are
 * equal height and the divider is exactly 1 px so the button reads as a
 * composed unit, not a stacked pair.
 *
 * Three variants, named per the brief:
 *
 *   primary   — filled maroon. One per view. The dominant call to action.
 *   secondary — hairline outline. Everything that isn't primary.
 *   on-dark   — same split-cell, but cream-mark on a plum field. Used
 *               when a primary sits over a dark section but the brief
 *               wants the colour to *say* "primary" instead of letting
 *               it flip into the secondary tone-aware pair.
 *
 * Tone-aware by default. A button on a `[data-tone="light"]` parent
 * renders maroon-on-cream; on `[data-tone="dark"]` it renders via the
 * `on-dark` markers automatically. The `on-dark` variant is the escape
 * hatch when the section is dark but the button itself must read as a
 * primary maroon block (for example, a CTA that sits on the bar page
 * above a photograph, where the maroon fill is its own ground).
 *
 * Rules baked in:
 *
 *  - **Min height 56 px** at every size. A CTA that is hard to hit on
 *    a phone is a defect, not a luxury.
 *  - **Padding-inline 28 px** on both sides of the label. The label sits
 *    symmetrically inside its cell.
 *  - **One primary per view.** Two filled buttons in the same first
 *    viewport is the giveaway of an assembled page, not an art-directed
 *    one. The component does not enforce this — that is editorial
 *    — but the variant `primary` is intentionally heavy enough that the
 *    choice to use it twice is conspicuous.
 *  - **All-caps, extreme tracking, small label.** The house label style.
 *  - **Visible focus ring.** `focus-visible:ring-2 ring-ink ring-offset-2
 *    ring-offset-surface`. The surface offset matters: against a
 *    photograph, an un-offset ring is invisible; against `cream`, an
 *    offset of `surface` makes the ring clear.
 *  - **No `href` → `<button>`.** A page-turn in the kitchen book has
 *    no destination, and the alternative was worse (an `<a href="#">`
 *    is a dead anchor that scrolls to top, writes a hash, and pushes
 *    history on every click).
 *  - **Real `<a>` when `href` is set.** Voice, WhatsApp, Maps — every
 *    CTA on the site works before JS loads and with middle-click.
 *
 * The pre-filled WhatsApp links (reservation / order / per-zone) and
 * the existing `external` / `target="_blank"` behaviour are preserved
 * exactly. A rename or refactor here must keep the href targets byte-
 * identical so the kitchen's pre-baked wa.me URLs still resolve.
 */

// -------------------------------------------------------------------
//   Geometry constants — kept here, kept visible
// -------------------------------------------------------------------

/** Minimum height for every size; the brief mandates 56 px on the dot. */
const MIN_HEIGHT = "min-h-14"; // 56px

/**
 * Padding on each side of the label. The brief asks for 28 px both
 * sides; we set it on the label wrapper rather than the outer button
 * so a `w-full` button gets `28 px | label | arrow | 0` rather than
 * doubled padding on the outer.
 */
const LABEL_PAD_X = "px-7"; // 28px each side

/** The 1 px divider between label and arrow. */
const DIVIDER_LIGHT = "border-l border-action-line"; // 1px on light tone
const DIVIDER_DARK = "border-l border-action-ink/25"; // visible against cream text on plum fill

/** The 56 px square arrow cell. */
const ARROW_CELL = "size-14";

/** The 16 px arrow, with a 3 px hover nudge. */
const ARROW_BASE = "size-4 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";
const ARROW_NUDGE = "group-hover:translate-x-[3px] group-hover:-translate-y-[3px]";

// -------------------------------------------------------------------
//   Variant classes — tone-aware
// -------------------------------------------------------------------

const VARIANT = {
  /** Filled. One per view — the primary action. */
  primary: cn(
    "bg-action text-action-ink",
    "hover:bg-action-hover",
    // A subtle drop shadow lifts the primary on cream without competing
    // with the page's whitespace.
    "shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-[0_10px_40px_-14px_rgba(0,0,0,0.45)]",
  ),
  /** Hairline outline. Secondary weight, quiet by default. */
  secondary: cn(
    "bg-transparent text-ink",
    "ring-1 ring-action-line",
    "hover:bg-action-veil hover:ring-action-line-hover",
  ),
  /**
   * Same filled maroon, regardless of tone. Use when a primary button
   * must read as primary over a dark section that would otherwise
   * swap to champagne-on-plum. The brief's G4 primary rule.
   */
  "on-dark": cn(
    "bg-plum text-cream",
    "hover:bg-[#3a1520]",
    "ring-1 ring-cream/20",
    "shadow-[0_10px_40px_-14px_rgba(0,0,0,0.45)]",
  ),
} as const;

const LABEL_SIZE = {
  sm: "text-[11px]",
  md: "text-[11px]",
  lg: "text-xs",
} as const;

const LABEL_TRACKING = "tracking-[0.28em]";
const LABEL_WEIGHT_PRIMARY = "font-semibold";
const LABEL_WEIGHT_REST = "font-medium";

export type ButtonVariant = keyof typeof VARIANT;
export type ButtonSize = keyof typeof LABEL_SIZE;

export type ButtonProps = {
  /** Omit to render a `<button>` rather than an `<a>`. The control form. */
  href?: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show the trailing arrow cell. Defaults on for any link, off for a control. */
  withArrow?: boolean;
  /** Cursor mood — `cta` swells the custom cursor ring; `hover` only blooms. */
  cursor?: "cta" | "hover";
  /** Printed inside the cursor ring when the button is the subject. */
  cursorLabel?: string;
  className?: string;
  onClick?: () => void;
  /** Escape hatch for `target`/`rel` on outbound links. */
  external?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  /** Native type when rendering a `<button>` — defaults to `"button"`. */
  type?: "button" | "submit" | "reset";
};

/**
 * The component. Re-exported from `components/ui/ActionButton.tsx` as
 * well, so existing call sites that import `ActionButton` keep working.
 */
export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  withArrow,
  cursor = "cta",
  cursorLabel,
  className,
  onClick,
  external = false,
  disabled,
  "aria-label": ariaLabel,
  type = "button",
}: ButtonProps) {
  const isPrimary = variant === "primary";
  // A control gets no arrow unless a caller asks: the arrow is the
  // house's "this goes somewhere else" mark, and a control stays put.
  const showArrow = withArrow ?? href !== undefined;

  const shared = cn(
    "group inline-flex items-stretch overflow-hidden",
    "uppercase whitespace-nowrap",
    LABEL_TRACKING,
    LABEL_SIZE[size],
    isPrimary ? LABEL_WEIGHT_PRIMARY : LABEL_WEIGHT_REST,
    MIN_HEIGHT,
    "transition-[background-color,box-shadow,color,box-shadow] duration-300",
    "ease-[cubic-bezier(0.32,0.72,0,1)]",
    // The brief's visible focus ring: 2 px, ink, offset by the surface
    // so it stays readable on cream, on plum, and over a photograph.
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:pointer-events-none disabled:opacity-40",
    VARIANT[variant],
    className,
  );

  // The 1 px divider: visible against the cream text on the plum fill
  // (primary / on-dark), and against the page on outline. The token
  // `border-action-line` keeps both variants correct under their
  // respective tones.
  const dividerClass = isPrimary || variant === "on-dark" ? DIVIDER_DARK : DIVIDER_LIGHT;

  const body = (
    <>
      {/* Label cell. `flex-1` keeps the split-cell geometry honest on
          full-width buttons (the navbar CTAs, the drawer's full-width
          CTA, the order section's primary). Without it the label and
          arrow travel together as one centred clump on a stretched
          button. On a natural-width button `flex-1` is a no-op. */}
      <span
        className={cn(
          "flex flex-1 items-center justify-center py-4",
          LABEL_PAD_X,
        )}
      >
        {children}
      </span>

      {showArrow && (
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center justify-center",
            dividerClass,
            ARROW_CELL,
          )}
        >
          <ArrowUpRight className={cn(ARROW_BASE, ARROW_NUDGE)} />
        </span>
      )}
    </>
  );

  // A control, not a destination.
  if (href === undefined) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        data-cursor={cursor}
        data-cursor-label={cursorLabel}
        aria-label={ariaLabel}
        className={shared}
      >
        {body}
      </button>
    );
  }

  return (
    <a
      href={href}
      onClick={onClick}
      data-cursor={cursor}
      data-cursor-label={cursorLabel}
      aria-label={ariaLabel}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : undefined)}
      className={shared}
    >
      {body}
    </a>
  );
}

export default Button;
