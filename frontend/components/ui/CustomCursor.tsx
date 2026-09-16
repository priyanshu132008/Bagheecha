"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CustomCursor — an eased tracer with three moods.
 *
 *  default            small hairline ring drifting behind an instant dot
 *  data-cursor="hover"  ring grows and picks up a soft bloom
 *  data-cursor="cta"    ring fills with translucent light (primary CTAs)
 *  data-cursor-label="View"  prints a word inside the ring (imagery etc.)
 *
 * IT INVERTS ITSELF. The ring is drawn white and composited with
 * `mix-blend-difference`, so it resolves to near-black over cream
 * (|249−255| = 6) and near-white over plum (|36−255| = 219 on the red
 * channel, the lightest of the three) without knowing anything about
 * what it is over. The alternative — a `dark` variant chosen per section
 * — would need the cursor to know the tone of every element it crosses,
 * including mid-scroll and over photographs, and would be wrong at every
 * boundary.
 *
 * Note the consequence for the bloom: the box-shadow inverts along with
 * everything else, so the "glow" reads as a soft dark halo on light
 * ground and a soft light one on dark. That is the correct behaviour for
 * a difference blend and is why the alphas below are low.
 *
 * Untagged interactive elements (a, button, inputs) fall back to the
 * "hover" mood automatically, so nothing on the page feels dead.
 *
 * Mounts only on `pointer: fine` devices, and never for users who prefer
 * reduced motion — they keep the native cursor. The rAF loop writes
 * transforms directly to the DOM; React state changes only when the
 * mood actually changes.
 */

type Mood = "default" | "hover" | "cta";

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, textarea, select, label, [data-cursor], [data-cursor-label]";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [mood, setMood] = useState<Mood>("default");
  const [label, setLabel] = useState<string | null>(null);

  /* Enable only where a mouse can actually be replaced. */
  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!finePointer || reducedMotion) return;

    setEnabled(true);
    // CSS in globals.css hides the native cursor for this mode
    document.documentElement.dataset.cursor = "tracing";
    return () => {
      delete document.documentElement.dataset.cursor;
    };
  }, []);

  /* The tracer loop. */
  useEffect(() => {
    if (!enabled) return;

    const pos = { x: -100, y: -100 };
    const ring = { x: -100, y: -100 };
    let shown = false;
    let raf = 0;

    const detect = (target: Element | null) => {
      const hit =
        target instanceof Element ? target.closest(INTERACTIVE_SELECTOR) : null;
      const explicit = hit?.getAttribute("data-cursor");
      const nextLabel = hit?.getAttribute("data-cursor-label") ?? null;
      // anything interactive gets at least the hover bloom; explicit
      // attributes escalate: "hover" → bloom, "cta" → filled white
      const next: Mood = !hit
        ? "default"
        : explicit === "cta"
          ? "cta"
          : "hover";
      setMood((prev) => (prev === next ? prev : next));
      setLabel((prev) => (prev === nextLabel ? prev : nextLabel));
    };

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!shown) {
        shown = true;
        if (dotRef.current) dotRef.current.style.opacity = "1";
        if (ringRef.current) ringRef.current.style.opacity = "1";
      }
      detect(e.target as Element | null);
    };

    const onOver = (e: PointerEvent) => detect(e.target as Element | null);

    const onLeave = () => {
      shown = false;
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    const onDown = () =>
      ringRef.current?.style.setProperty("--press", "0.78");
    const onUp = () => ringRef.current?.style.setProperty("--press", "1");

    let last = performance.now();
    const loop = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      // sub-pixel eased follow — the ring "traces" behind the pointer
      const k = 1 - Math.pow(0.0012, delta);
      ring.x += (pos.x - ring.x) * k;
      ring.y += (pos.y - ring.y) * k;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(var(--press))`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
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
    <>
      {/* instant dot. `mix-blend-difference` + white resolves to near-black
          on cream and near-white on plum — see the header note. */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[70] size-1.5 rounded-full bg-white opacity-0 mix-blend-difference transition-opacity duration-300 will-change-transform"
      />
      {/* eased tracing ring. Same blend; the label rides inside the ring's
          stacking context, so it inverts with it. */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[70] flex items-center justify-center rounded-full opacity-0 mix-blend-difference transition-[width,height,background-color,border-color,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform"
        style={{
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
    </>
  );
}