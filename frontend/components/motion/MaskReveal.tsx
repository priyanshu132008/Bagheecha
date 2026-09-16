"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * MaskReveal — the cinematic type reveal.
 *
 * Each line sits inside an `overflow-hidden` clip and translates up from
 * *below* its own box, so the type appears to rise out of the page edge
 * rather than fade in place. That is the difference between a slide
 * transition and a film title card, and it is the whole reason this
 * exists as a primitive rather than a one-off.
 *
 * Two rules are baked in so no caller can get them wrong:
 *
 *  - **The mask is the parent, the motion is the child.** Putting
 *    `overflow-hidden` on the animating element clips it against its own
 *    moving box, which produces a wipe instead of a rise.
 *  - **The clip box is padded, then pulled back.** `overflow-hidden`
 *    clips at the padding edge, so a tight `leading` on display type
 *    would slice the descender off "Rooftop" and the tail off "y". The
 *    allowance is `em`-relative so it scales with the type, and the
 *    matching negative margin means it costs no layout space. This is
 *    why no caller has to remember it.
 *  - **Reduced motion is not branched on here.** `useReducedMotion()`
 *    reads its media query during the first client render, so a
 *    component that changes its props on it renders different markup
 *    than the server did and React throws the subtree away. The root
 *    layout's `<MotionConfig reducedMotion="user">` handles it inside
 *    Framer's own animation layer, leaving markup identical.
 */

const EASE_LUXE = [0.32, 0.72, 0, 1] as const;

/** Descender room inside the clip, refunded by the negative margin. */
const CLIP = "block overflow-hidden pb-[0.18em] -mb-[0.18em]";

export type MaskRevealProps = {
  children: ReactNode;
  /** Seconds to wait before this line rises. */
  delay?: number;
  /** Duration of the rise. Longer is more cinematic; 0.9–1.3 reads best. */
  duration?: number;
  /** Element to render for the outer clip. */
  as?: ElementType;
  className?: string;
  /** Class for the inner moving element (colour, weight, leading). */
  innerClassName?: string;
};

export function MaskReveal({
  children,
  delay = 0,
  duration = 1.1,
  as: Tag = "span",
  className,
  innerClassName,
}: MaskRevealProps) {
  // The observer watches the MASK, not the thing it animates.
  //
  // This is the whole subtlety of the component, and getting it wrong is
  // silent. The inner span rests at `translateY(110%)`, which puts it
  // entirely outside its own `overflow-hidden` parent — so the browser
  // reports it as having a zero-area intersection rect, and an
  // `IntersectionObserver` (which is what `whileInView` is) reports
  // `isIntersecting: false` forever. The element can never come into view
  // because it is hidden, and it stays hidden because it never comes into
  // view. Measured: inner span `ratio 0`, `intersectionRect.height 0`;
  // the mask parent `ratio 1`, height 87.
  //
  // `whileInView` was on the inner span, so every masked element that
  // starts fully clipped — body copy, ledes, figcaptions, the location
  // rows — never revealed at all. It survived review because
  // `toContainText` assertions pass on hidden text and the effect looks
  // fine on anything tall enough to leave a sliver showing.
  //
  // The mask is the same box, is never clipped by its own child, and so
  // observes reliably. Watching it and driving the child from the result
  // keeps the timing identical and the markup unchanged.
  const mask = useRef<HTMLElement>(null);
  const inView = useInView(mask, {
    once: true,
    margin: "-8% 0px -12% 0px",
  });

  return (
    <Tag ref={mask as React.Ref<never>} className={cn(CLIP, className)}>
      <motion.span
        className={cn("block", innerClassName)}
        initial={{ y: "110%" }}
        animate={inView ? { y: "0%" } : undefined}
        transition={{ duration, delay, ease: EASE_LUXE }}
      >
        {children}
      </motion.span>
    </Tag>
  );
}

/**
 * MaskRise — the same mask, but playing immediately on mount instead of
 * on scroll. For the hero, which is already in view when the page opens:
 * `whileInView` would fire on the first frame and the entrance would be
 * lost to the paint.
 */
export function MaskRise({
  children,
  delay = 0,
  duration = 1.2,
  as: Tag = "span",
  className,
  innerClassName,
}: MaskRevealProps) {
  return (
    <Tag className={cn(CLIP, className)}>
      <motion.span
        className={cn("block", innerClassName)}
        initial={{ y: "112%" }}
        animate={{ y: "0%" }}
        transition={{ duration, delay, ease: EASE_LUXE }}
      >
        {children}
      </motion.span>
    </Tag>
  );
}
