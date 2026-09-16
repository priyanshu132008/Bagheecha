"use client";

import type { ReactNode } from "react";

import { ArrowUpRight } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * ActionButton — the site's single CTA primitive.
 *
 * Squared, hairline-ruled, split into two cells by a divider: label,
 * then arrow. Hovering drives the arrow diagonally out of its cell while
 * the label cell warms. No pill, no rounded capsule — a capsule reads as
 * a framework default and "generic" is the one thing this page cannot be.
 *
 * TONE-AWARE, WITHOUT A PROP. The colours come from the semantic layer
 * (`bg-action`, `text-action-ink`, `border-action-line`), which the
 * enclosing `[data-tone]` section re-maps. So the same component renders
 * plum-on-cream in a light section and champagne-on-plum in
 * the bar — or over the hero photograph — with no `variant="dark"`
 * threaded through call sites. Adding a colour prop here would mean
 * every caller has to know what surface it sits on, which is exactly the
 * knowledge the tone layer exists to remove.
 *
 * Three rules are baked in so no caller can forget them:
 *
 *  - **48px minimum height** at every size. A CTA that is hard to hit on
 *    a phone is not a luxury, it is a defect.
 *  - **One `solid` CTA per view.** It is the only filled element on the
 *    page; everything else is `outline`. If two solids ever appear
 *    together, one of them is wrong.
 *  - **All-caps, extreme tracking, small size** — the house label style.
 *
 * Renders an `<a>` when it has a destination, and a `<button>` when it
 * does not. Every CTA on this site is a link (anchor, `tel:`, `wa.me`,
 * Maps) rather than a JS-only handler, so it works with the keyboard,
 * with middle-click, and while JS is still loading — and that remains
 * the rule. The one documented exception is a **control**, not a
 * destination: the kitchen book's page turn has no URL to point at, and
 * the alternative was worse. Passing `href="#"` would have created a
 * dead anchor that scrolls to the top, writes a hash, and pushes a
 * history entry on every page turn — a link pretending to be a button,
 * which is a lie the browser then acts on.
 *
 * The arrow cell is dropped in the button form by default: an arrow
 * means "this goes somewhere else", and a page turn stays where it is.
 */

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const VARIANT = {
  /** Filled. One per view — the primary action. */
  solid: cn(
    "bg-action font-semibold text-action-ink",
    "hover:bg-action-hover",
    "shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-[0_10px_40px_-14px_rgba(0,0,0,0.45)]",
  ),
  /** Hairline outline. Secondary weight, quiet by default. */
  outline: cn(
    "bg-transparent font-medium text-ink",
    "ring-1 ring-action-line",
    "hover:bg-action-veil hover:ring-action-line-hover",
  ),
} as const;

const SIZE = {
  sm: "min-h-11 pl-5 text-[11px]",
  md: "min-h-12 pl-6 text-[11px]",
  lg: "min-h-14 pl-8 text-xs",
} as const;

/** The arrow cell. Square, hairline-separated, flush with the edge. */
const CELL = {
  sm: "size-11",
  md: "size-12",
  lg: "size-14",
} as const;

export type ActionButtonProps = {
  /** Omit to render a `<button>` — the control form. See the note above. */
  href?: string;
  children: ReactNode;
  variant?: keyof typeof VARIANT;
  size?: keyof typeof SIZE;
  /** Show the trailing arrow cell. Defaults to off for a control. */
  withArrow?: boolean;
  /** Cursor mood — `cta` swells the custom cursor ring. */
  cursor?: "cta" | "hover";
  /** Printed inside the cursor ring when the button is the subject. */
  cursorLabel?: string;
  className?: string;
  onClick?: () => void;
  /** Escape hatch for `target`/`rel` on outbound links. */
  external?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
};

export function ActionButton({
  href,
  children,
  variant = "solid",
  size = "md",
  withArrow,
  cursor = "cta",
  cursorLabel,
  className,
  onClick,
  external = false,
  disabled,
  "aria-label": ariaLabel,
}: ActionButtonProps) {
  const solid = variant === "solid";
  // A control gets no arrow unless a caller asks: the arrow is the
  // house's "this leaves the page" mark, and a page turn does not.
  const showArrow = withArrow ?? href !== undefined;

  const shared = cn(
    "group inline-flex items-stretch overflow-hidden",
    "uppercase tracking-[0.2em]",
    "transition-[background-color,box-shadow,color] duration-300",
    EASE,
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:pointer-events-none disabled:opacity-40",
    SIZE[size],
    VARIANT[variant],
    className,
  );

  const body = (
    <>
      {/* `flex-1` is what keeps the split-cell geometry honest when a
          caller stretches the button (`w-full` on a phone, the drawer
          CTA). Without it the label and arrow travel together as one
          centred clump and the arrow ends up floating in the middle of
          a full-width button instead of sitting flush in its cell. On a
          natural-width button there is no free space to take, so
          `flex-1` is a no-op and the cell hugs its label as before. */}
      <span className="flex flex-1 items-center justify-center py-4 whitespace-nowrap">
        {children}
      </span>

      {showArrow && (
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center justify-center border-l",
            // The divider has to read against the fill on `solid` and
            // against the page on `outline`, so it is not one token.
            solid ? "border-action-ink/25" : "border-action-line",
            CELL[size],
          )}
        >
          <ArrowUpRight
            className={cn(
              "size-3.5 transition-transform duration-300",
              EASE,
              "group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            )}
          />
        </span>
      )}
    </>
  );

  // A control, not a destination. `type="button"` matters: without it a
  // button inside a form submits it, which is the classic way a pager
  // reloads the page it was paging.
  if (href === undefined) {
    return (
      <button
        type="button"
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
