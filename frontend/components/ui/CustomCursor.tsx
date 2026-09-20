"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CustomCursor — an eased tracer with three moods (default / hover / cta).
 *
 * WHY THIS WAS REWRITTEN (polish brief G6, 2026-09-20). The previous
 * version drove the cursor position with a `requestAnimationFrame` loop
 * that consumed pointer events to compute the eased follow. That had two
 * failure modes that the brief calls out:
 *
 *  1. **Stuck at the top-left corner.** The `pos` start was `(-100, -100)`
 *     and the ring only updated after a `pointermove` had fired. On
 *     devices where the very first dispatched event wasn't a pointer
 *     move (some tablets, browser zoom changes, programmatic scrolls),
 *     the loop kept redrawing the `-100` start position. The
 *     `translate(-50%, -50%)` then clipped that off-screen start to
 *     the page corner, and the cursor appeared stuck.
 *  2. **Two cursors at once.** The gated cleanup set
 *     `delete document.documentElement.dataset.cursor` between mount
 *     and effect. React 18's Strict Mode (and a few fast refresh
 *     routines) mounts the component twice; the first cleanup ran
 *     while the second was still rendering, briefly revealing the
 *     native cursor alongside the custom ring.
 *
 * The fix is to drive **position** with CSS variables that an event
 * listener writes directly, and to drive **mood** with React state that
 * is updated only when the subject under the cursor changes. No
 * animation loop, no off-screen start position, no race between
 * mount and cleanup.
 *
 * Reliability:
 *
 *  - Gated on `(pointer: fine)` so the cursor never appears on a
 *    touch device.
 *  - Gated on `prefers-reduced-motion: no-preference` so the cursor
 *    does not load its weight on a system that has asked for stillness.
 *  - The element starts at `(0, 0)` on `documentElement`. On the
 *    first `pointermove` the variables are written and the cursor
 *    lands where the pointer is. Until then, the ring sits hidden
 *    (opacity 0) so no off-screen ghost is visible.
 *  - Cleanup unsets the dataset, removes the variables, and removes
 *    the listeners, in that order. Strict Mode runs the effect twice;
 *    both cleanups correctly tear down.
 *  - Native cursor is hidden via the existing CSS rule gated by
 *    `[data-cursor="tracing"]` in `globals.css`. One source of cursor,
 *    one source of truth.
 */

type Mood = "default" | "hover" | "cta";

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, textarea, select, label, [data-cursor], [data-cursor-label]";

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const [mood, setMood] = useState<Mood>("default");
  const [label, setLabel] = useState<string | null>(null);

  /**
   * Enable gate resolved at mount. `matchMedia` queries are evaluated
   * synchronously the first time, so the initial render can take the
   * right branch without an effect-driven `setState` cascade. This is
   * the form React 19 / Next 16 recommend for media-query gating, and
   * the `react-hooks/set-state-in-effect` rule explicitly allows it.
   */
  const finePointer =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches;
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const enabled = finePointer && !reducedMotion;

  /* ── enable gate (mount + Strict-Mode-cleanup safe) ──────────── */
  useEffect(() => {
    if (!enabled) return;

    document.documentElement.dataset.cursor = "tracing";
    return () => {
      delete document.documentElement.dataset.cursor;
      // Strip the CSS variables on cleanup so a subsequent mount with
      // different state does not see stale values.
      document.documentElement.style.removeProperty("--cx");
      document.documentElement.style.removeProperty("--cy");
    };
  }, [enabled]);

  /* ── position + mood: event-driven, no loop ─────────────────── */
  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      // Write position directly. CSS variables resolve per element,
      // so the ring's transform picks up the new value on the next
      // style recompute — no React render needed, no jank, no rAF.
      document.documentElement.style.setProperty("--cx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--cy", `${e.clientY}px`);

      // Reveal the ring on the first real pointer event so it never
      // appears at the off-screen start before the pointer moves.
      if (ringRef.current) ringRef.current.style.opacity = "1";

      // Subject under the pointer. Default → not interactive;
      // `hover`/`cta` → from the closest interactive element.
      const target = e.target as Element | null;
      const hit =
        target instanceof Element ? target.closest(INTERACTIVE_SELECTOR) : null;
      const explicit = hit?.getAttribute("data-cursor");
      const nextLabel = hit?.getAttribute("data-cursor-label") ?? null;
      const next: Mood = !hit
        ? "default"
        : explicit === "cta"
          ? "cta"
          : "hover";

      // Only update when the value actually changed; pointermove fires
      // hundreds of times per scroll, and React state is the cost.
      setMood((prev) => (prev === next ? prev : next));
      setLabel((prev) => (prev === nextLabel ? prev : nextLabel));
    };

    const onLeave = () => {
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const grow = mood !== "default";
  const glow =
    mood === "cta"
      ? "0 0 32px rgba(255, 255, 255, 0.4)"
      : mood === "hover"
        ? "0 0 22px rgba(255, 255, 255, 0.18)"
        : "none";

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[70] flex items-center justify-center rounded-full opacity-0 mix-blend-difference transition-[width,height,background-color,border-color,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform"
      style={{
        // The translate keeps the ring centred on the pointer; the
        // CSS variables are written by the `pointermove` listener.
        // `transform: translate3d(var(--cx), var(--cy), 0) translate(-50%, -50%)`
        // is the canonical "centre under the cursor" form.
        transform:
          "translate3d(var(--cx, 0), var(--cy, 0), 0) translate(-50%, -50%)",
        width: grow ? "3.25rem" : "2.25rem",
        height: grow ? "3.25rem" : "2.25rem",
        border:
          mood === "cta"
            ? "1px solid rgba(255, 255, 255, 0.9)"
            : "1px solid rgba(255, 255, 255, 0.4)",
        backgroundColor:
          mood === "cta" ? "rgba(255, 255, 255, 0.14)" : "transparent",
        boxShadow: glow,
      }}
    >
      {label && (
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white">
          {label}
        </span>
      )}
    </div>
  );
}
