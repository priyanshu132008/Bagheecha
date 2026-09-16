import type { ReactNode } from "react";

import { MaskReveal } from "@/components/motion/MaskReveal";
import Navbar from "@/components/nav/Navbar";
import Atmospheres from "@/components/sections/Atmospheres";
import Hero from "@/components/sections/Hero";
import Menu from "@/components/sections/Menu";
import { ActionButton } from "@/components/ui/ActionButton";
import MobileActionBar from "@/components/ui/MobileActionBar";
import { CONTACT, LOCATION } from "@/lib/constants/site";

/**
 * The page.
 *
 * THE LIGHT IS STILL THE POINT, WITH ONE OPENING FRAME THAT IS NOT.
 * Appetite is a daylight response, and a restaurant that looks like a
 * terminal is a restaurant you scroll past — so the page proper is warm
 * cream. But a hero is not the page: it is the title sequence, and this
 * one is deep plum under the kitchen's own four dishes, because a
 * magazine opens on a cover and then turns to paper. The earlier build
 * was black *end to end*, which is a different and much worse thing.
 *
 * THE RHYTHM IS DARK / LIGHT / LIGHT-OR-DARK / LIGHT / LIGHT. The hero
 * is the dark opening frame; `#menus` is the only section that chooses
 * its own ground after that, because it is the only one holding two books
 * — cream for the kitchen card, plum for the bar card — and it flips
 * between them under the reader's hand. It still opens and closes light,
 * so the page comes back up to close on the practical business of finding
 * and booking the place. A dark section at the very end would leave the
 * visitor in a room with no exit.
 *
 * The governing rule is still a strict 12-column grid and a single
 * repeated section shape: a narrow label rail in columns 1–3, content
 * starting in column 5, and column 4 left empty as a gutter. Every
 * section still *opens* on that shape, `#menus` included. What changed
 * with the menu is that a 358-line list cannot live in columns 5–12, so
 * its body drops the rail and uses the full width below a masthead that
 * keeps it.
 *
 * So there are three deliberate departures, all asserted rather than
 * tolerated as drift: `#atmospheres` pins its copy against a column of
 * rooms that glides past it, so its heading sits *on* the label rail; the
 * hero's display type is anchored bottom-left and set at 10.5vw under a
 * two-column supporting row; and `#menus` runs a full-width sticky-index
 * layout under a rail-aligned masthead.
 *
 * Every dark/light distinction is expressed by `data-tone` rather than
 * by passing colours down, so the sections below are written once.
 *
 * `section-pad` is deliberately enormous (6–11rem per side). The
 * whitespace is the luxury here; the content is the punctuation.
 */

/** The repeated section shape. Rail left, content on the grid. */
function Section({
  id,
  eyebrow,
  tone = "light",
  children,
}: {
  id: string;
  eyebrow: string;
  tone?: "light" | "dark";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-tone={tone}
      className="section-pad bg-surface transition-colors duration-500"
    >
      <div className="container-x grid grid-cols-12 gap-x-6 gap-y-8">
        <div className="col-span-12 lg:col-span-3">
          <MaskReveal as="p" className="eyebrow" duration={0.8}>
            {eyebrow}
          </MaskReveal>
        </div>

        <div className="col-span-12 lg:col-span-8 lg:col-start-5">
          {children}
        </div>
      </div>
    </section>
  );
}

/** The one display size every section heading shares. Tone-aware. */
const H2 =
  "font-display text-[clamp(1.9rem,4.2vw,3.5rem)] font-normal leading-[1.06] tracking-[-0.025em] text-ink";

const LEDE = "max-w-xl text-pretty text-[15px] leading-7 text-ink-muted";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="flex flex-1 flex-col">
        <Hero />

        <Atmospheres />

        {/* --------------------------------------------------------------
            Menus — the two books. This is the one section that changes
            ground while you are looking at it: cream for the kitchen
            card, plum for the bar card. See `Menu.tsx`.
        --------------------------------------------------------------- */}
        <Menu />

        {/* --------------------------------------------------------------
            Location — already complete and useful.
        --------------------------------------------------------------- */}
        <Section id="location" eyebrow="Find Us">
          <h2 className={H2}>
            <MaskReveal className="text-balance">
              {LOCATION.name}, {LOCATION.locality}
            </MaskReveal>
          </h2>

          <MaskReveal delay={0.12} duration={0.9}>
            <p className={`mt-7 ${LEDE}`}>
              {LOCATION.region}. Directions open straight in your maps app —
              turn-by-turn from wherever you are.
            </p>
          </MaskReveal>

          {/* Contact rows. Hairline-divided rather than a boxed card:
              a table of ways to reach the hotel is information, and
              boxing it would make it look like a promotional unit. */}
          <MaskReveal delay={0.24} duration={0.9}>
            <ul className="mt-12 border-t border-line">
              {[
                {
                  label: "Call",
                  value: CONTACT.call.display,
                  href: CONTACT.call.href,
                  external: false,
                },
                {
                  label: "Call — alternate",
                  value: CONTACT.callAlt.display,
                  href: CONTACT.callAlt.href,
                  external: false,
                },
                {
                  label: "WhatsApp",
                  value: `+91 ${CONTACT.whatsapp.local}`,
                  href: CONTACT.whatsapp.href,
                  external: true,
                },
              ].map((row) => (
                <li key={row.label}>
                  <a
                    href={row.href}
                    data-cursor="hover"
                    {...(row.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : undefined)}
                    className="group flex items-baseline justify-between gap-6 border-b border-line py-5 transition-colors duration-500 hover:border-line-strong"
                  >
                    <span className="text-[10px] uppercase tracking-[0.24em] text-ink-faint">
                      {row.label}
                    </span>
                    <span className="font-display text-lg text-ink transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-1 md:text-xl">
                      {row.value}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </MaskReveal>

          <MaskReveal delay={0.32} duration={0.9}>
            <div className="mt-10">
              <ActionButton
                href={LOCATION.directionsHref}
                variant="outline"
                size="lg"
                external
              >
                Get Directions
              </ActionButton>
            </div>
          </MaskReveal>
        </Section>

        {/* --------------------------------------------------------------
            Reserve — Phase 3 lands the booking flow here.
        --------------------------------------------------------------- */}
        <Section id="reserve" eyebrow="Reservations">
          <h2 className={H2}>
            <MaskReveal className="text-balance">Save your table.</MaskReveal>
          </h2>

          <MaskReveal delay={0.12} duration={0.9}>
            <p className={`mt-7 ${LEDE}`}>
              Tell us the date, the time and how many are coming, and we will
              hold it — terrace, AC room, or the classic dining hall. A table
              for two and a party of twenty are the same phone call.
            </p>
          </MaskReveal>

          {/* The only solid button this far down the page. By the time
              this is on screen the hero's is long gone, so it is still
              the single high-contrast element in view. */}
          <MaskReveal delay={0.24} duration={0.9}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <ActionButton
                href={CONTACT.whatsapp.href}
                size="lg"
                external
                className="w-full justify-center sm:w-auto"
              >
                Reserve on WhatsApp
              </ActionButton>
              <ActionButton
                href={CONTACT.call.href}
                variant="outline"
                size="lg"
                cursor="hover"
                className="w-full justify-center sm:w-auto"
              >
                Call the Hotel
              </ActionButton>
            </div>
          </MaskReveal>
        </Section>

        {/* No spacer for the mobile action bar: `section-pad` already
            leaves 6rem of bottom padding at the narrowest breakpoint,
            which clears the 56px bar with room to spare. */}
      </main>

      <MobileActionBar />
    </>
  );
}
