import type { ReactNode } from "react";

import { MaskReveal } from "@/components/motion/MaskReveal";
import Navbar from "@/components/nav/Navbar";
import Atmospheres from "@/components/sections/Atmospheres";
import Hero from "@/components/sections/Hero";
import Menu from "@/components/sections/Menu";
import { OrderOnline } from "@/components/sections/OrderOnline";
import { ReviewsCards } from "@/components/sections/ReviewsCards";
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
 * one is deep plum under the kitchen's own eight dishes, because a
 * magazine opens on a cover and then turns to paper. The earlier build
 * was black *end to end*, which is a different and much worse thing.
 *
 * THE RHYTHM IS DARK / LIGHT / LIGHT-OR-DARK / LIGHT / LIGHT / LIGHT /
 * LIGHT. The hero is the dark opening frame; `#menus` is the only
 * section that chooses its own ground after that, because it is the
 * only one holding two books — cream for the kitchen card, plum for the
 * bar card — and it flips between them under the reader's hand. Below
 * the menus the page is cream: the reviews marquee, the 50/50 order
 * section, and the two closing chapters.
 *
 * The governing rule is still a strict 12-column grid and a single
 * repeated section shape: a narrow label rail in columns 1–3, content
 * starting in column 5. Every section still *opens* on that shape,
 * `#menus` included. What changed with the menu is that a 358-line list
 * cannot live in columns 5–12, so its body drops the rail and uses the
 * full width below a masthead that keeps it.
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

/**
 * The closing chapters — a wider rail. The location and reservations
 * sections carry a massive display heading and a list of contact
 * numbers, and the original 12-col rail left 4 columns of dead space
 * beside the type. This variant widens the content column from col-5
 * to col-2 — content spans columns 2–11, so the heading can be set
 * huge without breaking the page edge.
 *
 * The eyebrow stays on the rail: it is the section label, and on a
 * grid the rail is what gives the page its first vertical line.
 */
function WideSection({
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
        <div className="col-span-12 lg:col-span-2">
          <MaskReveal as="p" className="eyebrow" duration={0.8}>
            {eyebrow}
          </MaskReveal>
        </div>

        <div className="col-span-12 lg:col-span-10">
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * The display sizes the closing chapters share.
 *
 * Phase 6 brought these down from the wordmark scale (`clamp(2.5rem,
 * 7.2vw, 6.5rem)`) to a refined editorial size (`text-4xl md:text-5xl`).
 * The earlier gigantism was making the bottom of the page read as a
 * billboard instead of a closing chapter — a 6.5rem heading is the
 * right size for a hero, not for a section that sits next to a phone
 * number a guest is trying to dial. Tight `tracking-[-0.02em]` keeps
 * the display face legible at the smaller size without losing the
 * editorial feel.
 */
const H2_MASSIVE =
  "font-display text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl";

/**
 * The contact-row typography. Closing-chapter contact rows get the
 * same display face as the heading, but at a single, restrained size
 * (`text-2xl`) so a phone number reads as information without
 * competing with the heading that introduces the section.
 */
const ROW =
  "font-display text-2xl leading-tight text-ink md:text-[1.7rem]";

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
            Reviews — boxless editorial spread on cream. Oversized
            Playfair-italic pull-quotes fade-swap one at a time, with
            vermillion stars in the byline and no card wrappers. Phase 9.
        --------------------------------------------------------------- */}
        <ReviewsCards />

        {/* --------------------------------------------------------------
            Order — 50/50 split, Swiggy on the left, direct delivery on
            the right. Phase 5.
        --------------------------------------------------------------- */}
        <OrderOnline />

        {/* --------------------------------------------------------------
            Location — already complete and useful.

            Phase 5 widened this section's content column. The heading
            is set at the wordmark scale so it carries the page home,
            and the contact rows are sized as display type so a phone
            number reads as something you can dial rather than a label
            you have to squint at. `WideSection` puts the eyebrow on
            the rail and the content in columns 2–11 — the type can
            breathe without breaking the page edge.
        --------------------------------------------------------------- */}
        <WideSection id="location" eyebrow="Find Us">
          <h2 className={H2_MASSIVE}>
            <MaskReveal className="text-balance">
              {LOCATION.name}, {LOCATION.locality}.
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
              boxing it would make it look like a promotional unit.
              The row typography is the display face so a phone number
              reads as information you can dial, not a label. */}
          <MaskReveal delay={0.24} duration={0.9}>
            <ul className="mt-10 border-t border-line">
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
                    className="group flex items-baseline gap-4 border-b border-line py-4 transition-colors duration-500 hover:border-line-strong md:py-5"
                  >
                    <span className="w-28 shrink-0 text-[10px] uppercase tracking-[0.28em] text-ink-faint md:w-32">
                      {row.label}
                    </span>
                    <span
                      className={`${ROW} transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-1`}
                    >
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
        </WideSection>

        {/* --------------------------------------------------------------
            Reserve — Phase 3 lands the booking flow here. Same wider
            rail as `#location` so the closing pair read as one book.
        --------------------------------------------------------------- */}
        <WideSection id="reserve" eyebrow="Reservations">
          <h2 className={H2_MASSIVE}>
            <MaskReveal className="text-balance">
              Save your table.
            </MaskReveal>
          </h2>

          <MaskReveal delay={0.12} duration={0.9}>
            <p className={`mt-6 ${LEDE}`}>
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
        </WideSection>
      </main>

      <MobileActionBar />
    </>
  );
}