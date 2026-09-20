"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import { NAV_LINKS, WHATSAPP_RESERVATION_HREF } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/**
 * Navbar — a razor-thin, edge-to-edge header that changes tone.
 *
 * The floating glass pill is gone. A capsule detached from the top of a
 * page is a SaaS convention; an editorial site runs its navigation the
 * full width of the frame, on a single hairline, and lets the
 * photography show through it.
 *
 * THE BAR HAS TWO TONES, AND THAT IS THE WHOLE TRICK. At rest it sits on
 * the hero photograph, which is dark, so it renders cream on transparent.
 * Past 24px of scroll it frosts and sits on cream, so it renders
 * plum. Rather than thread a `dark` prop through the links and the
 * button, the header simply switches its `data-tone` and the semantic
 * layer does the rest — the wordmark, the links, the underline, the
 * hamburger rules and the CTA all re-map at once. Adding a new element
 * to the bar costs nothing.
 *
 * Two things here are load-bearing and easy to break:
 *
 *  - **The bar carries `z-50`.** The drawer is `z-40` and is a *sibling*
 *    inside this header's stacking context, so the header's own z-index
 *    does nothing for the bar. Without it the drawer paints over the
 *    hamburger-turned-X and swallows the tap that would close it —
 *    leaving a touch user no way out but a nav link.
 *  - **The drawer's tone is pinned to `light`.** It inherits `data-tone`
 *    from the header otherwise, which means the overlay would come out
 *    dark whenever the page happened to be scrolled to the top — a
 *    different-looking menu depending on scroll position.
 *  - **Reduced motion is not branched on.** `MotionConfig` in the root
 *    layout handles it. See `MaskReveal.tsx` for why the hook cannot be
 *    used here.
 */

const EASE_LUXE = [0.32, 0.72, 0, 1] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  /* Density only — no geometry is read, so this never thrashes layout.
     A scroll listener is used rather than Framer's `useScroll` because
     the value is a boolean, not an animated transform: re-rendering on a
     coarse threshold is cheaper than driving a motion value for a
     colour change CSS can already transition. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Scroll spy — the active section is marked in the nav. The band is
     pulled in from both edges so a section counts as "current" only
     while it crosses the middle of the viewport, which keeps exactly one
     link lit instead of two fighting at a boundary. */
  useEffect(() => {
    const els = NAV_LINKS.map((l) => document.getElementById(l.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* Freeze the page behind the open drawer, and let Escape close it. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      data-tone={scrolled ? "light" : "dark"}
      className="fixed inset-x-0 top-0 z-50"
    >
      {/* The bar. `relative z-50` keeps it above the drawer. */}
      <div
        className={cn(
          "relative z-50 border-b transition-colors duration-500",
          EASE_LUXE,
          scrolled
            ? "border-line bg-cream/85 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Primary"
          className="container-x flex h-16 items-center justify-between md:h-20"
        >
          {/* Wordmark — tracked-out display caps, no ornament. */}
          <a
            href="#top"
            aria-label="Hotel Bagheecha — back to top"
            className="font-display text-base uppercase leading-none tracking-[0.34em] text-ink transition-opacity duration-300 hover:opacity-70 md:text-lg"
          >
            Bagheecha
          </a>

          {/* Desktop links */}
          <ul className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = active === link.href;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "group relative block py-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors duration-300",
                      isActive ? "text-ink" : "text-ink-faint hover:text-ink",
                    )}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-px origin-left bg-ink transition-transform duration-300",
                        EASE_LUXE,
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100",
                      )}
                    />
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            {/* `outline`, deliberately. The hero owns the one solid CTA
                in the first viewport — two filled buttons competing at
                the top of the fold is the giveaway of an assembled
                page. */}
            <ActionButton
              href={WHATSAPP_RESERVATION_HREF}
              variant="secondary"
              size="sm"
              external
              data-testid="nav-book"
              className="hidden md:inline-flex"
            >
              Book a Table
            </ActionButton>

            {/* Hamburger → X. The two rules rotate into a cross rather
                than fading out. */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="-mr-2 flex size-12 items-center justify-center text-ink md:hidden"
            >
              <span className="relative block h-3 w-6">
                <span
                  className={cn(
                    "absolute left-0 h-px w-6 bg-ink transition-transform duration-300",
                    EASE_LUXE,
                    open ? "top-1.5 rotate-45" : "top-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 h-px w-6 bg-ink transition-transform duration-300",
                    EASE_LUXE,
                    open ? "top-1.5 -rotate-45" : "top-3",
                  )}
                />
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* -----------------------------------------------------------------
          Mobile drawer. AnimatePresence is what lets the exit animation
          actually run; without it the overlay unmounts instantly.
      ------------------------------------------------------------------ */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            key="drawer"
            data-tone="light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_LUXE }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-cream/97 px-6 backdrop-blur-2xl md:hidden"
          >
            <ul className="flex flex-col">
              {NAV_LINKS.map((link, i) => (
                <li key={link.href} className="overflow-hidden">
                  <motion.a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    transition={{
                      duration: 0.6,
                      delay: 0.06 + i * 0.05,
                      ease: EASE_LUXE,
                    }}
                    className="block py-3 font-display text-5xl leading-tight text-ink"
                  >
                    {link.label}
                  </motion.a>
                </li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: EASE_LUXE }}
              className="mt-12"
            >
              <ActionButton
                href={WHATSAPP_RESERVATION_HREF}
                size="lg"
                external
                onClick={() => setOpen(false)}
                className="w-full justify-center"
              >
                Book a Table
              </ActionButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
