import Image from "next/image";

import { ActionButton } from "@/components/ui/ActionButton";
import { MaskRise } from "@/components/motion/MaskReveal";
import { FEATURED_DISHES } from "@/lib/constants/images";
import { RESERVE_HREF } from "@/lib/constants/site";

/**
 * Hero — the opening frame, full bleed.
 *
 * THE BOX IS GONE. This was a rounded plate inset from the page edges
 * with the display type crossing its lower lip — a considered
 * composition, and the wrong one: a rounded container floating in a
 * margin is the shape of a component library, and it made the first
 * thing a guest sees read as software rather than as a restaurant. The
 * backdrop now runs to all four edges and the type sits on it.
 *
 * THE BACKDROP IS THE FOUR KITCHEN PHOTOGRAPHS. Not one of them and not
 * a stock room: four upright panels, one plate each, drifting. It is the
 * most honest thing the page could open on — it is this kitchen's own
 * food, shot on a phone, and the guest's first impression is the product
 * rather than the decor. The panels are `aria-hidden` with empty `alt`:
 * as a backdrop they carry no information the `<h1>` does not, and their
 * real descriptions live on the four photographs in the kitchen band
 * below, where a reader meets them one at a time instead of four at once.
 *
 * WHY FOUR COLUMNS RATHER THAN A 2x2. Three of the four are portrait and
 * the fourth is square, so a two-by-two collage crops every one of them
 * landscape and beheads the subject. Four columns at 25% are already
 * portrait at any viewport — the shape they were shot in. On a phone it
 * falls to two columns and two rows for the same reason.
 *
 * WHAT KEEPS THE TYPE READABLE. The old plate earned its keep: because
 * the type crossed onto flat plum below it, the ground under the
 * headline was a known colour and contrast was a constant rather than a
 * per-frame gamble. A photograph offers no such guarantee — these are
 * food shots, and their brightest pixels are specular highlights at 1.0
 * linear, where white type measures 1:1. So the guarantee is rebuilt as
 * a layer: `.hero-vignette` in `globals.css`, a two-axis ramp whose
 * stops are chosen against those highlights and written out where they
 * can be read. `e2e/hero.spec.ts` measures the composited result per
 * pixel over the whole copy block, and that is the assertion the plate
 * used to carry.
 *
 * WHY THE RAMP DOES NOT USE THE OBVIOUS ONE-LINER. The brief suggested
 * `from-plum/90 via-black/40 to-transparent`. Measured, that puts the
 * eyebrow at roughly 0.36 alpha, which over a highlight is 2.5:1 — not
 * a design opinion, a failure. The ramp here holds 0.90 through the
 * point where the type starts and only then lets go, and it lets go
 * *above* the copy rather than through it, so the photographs stay
 * bright in the band where nothing is written.
 *
 * AND THE RAMP IS GUARDED FROM BOTH SIDES. Making it darker is always
 * available and always passes a contrast test, which is exactly why
 * `hero.spec.ts` also asserts the band above the type is still bright:
 * measured, mean 0.085-0.090 linear with a maximum of 1.0000, so a
 * specular highlight is arriving at full strength. A single `bg-plum/95`
 * plate over the whole frame would satisfy every contrast reading in
 * that file and fail that one — which is the "mathematically present,
 * visually absent" failure this page has already been rebuilt twice to
 * escape.
 *
 * THE TYPE IS THE DESIGN. One word, lowercase, at 10.5vw with tight
 * negative tracking, anchored bottom-left — a wordmark rather than a
 * headline with a subtitle under it. The asterisk is the only vermillion
 * on the first screen and it is `aria-hidden`: it is a mark, not a
 * character, and "bagheecha asterisk" is not the name of the restaurant.
 * The `sr-only` "Hotel" in front of it is, so the accessible name is the
 * real one.
 *
 * THE CTA IS A GHOST. Both actions are `outline`, so the first viewport
 * contains no solid button at all. That is deliberate: with a wordmark
 * this size, a filled block beside it is two things shouting. The house
 * rule is "never two solids"; it does not require one.
 *
 * LCP. Panel one carries `priority` and is preloaded; the other three are
 * `loading="eager"` — they are all in the first viewport, so lazy would
 * be a lie, but four `<link rel=preload>` tags for one backdrop is
 * bandwidth taken from the text. CLS stays zero because the static
 * imports give `next/image` their intrinsic sizes at build time.
 *
 * Type still arrives as a staged mask rise — each line climbing out from
 * under its own edge, which is what makes it read as a title sequence
 * rather than a page that finished loading. Reduced motion is not
 * branched on here; `<MotionConfig reducedMotion="user">` in the root
 * layout handles it inside Framer's animation layer, so the markup is
 * identical on both sides of hydration.
 */

const ZONE_LEGEND = ["Terrace Lounge", "AC Fine Dining", "Classic Non-AC"];

/** The panel drift classes, in the order the dishes are registered. */
const DRIFT = ["a", "b", "c", "d"] as const;

export default function Hero() {
  return (
    <section
      id="top"
      data-tone="dark"
      className="relative flex min-h-dvh flex-col overflow-hidden bg-plum"
    >
      {/* -----------------------------------------------------------------
          The backdrop. Four panels, a hairline between each, each one a
          plate from the card below.

          `grid-cols-2 md:grid-cols-4` and not `h-full`: the grid is
          absolutely positioned and stretched by `inset-0`, so it takes
          the section's height at every viewport without the section ever
          being sized by it — which is what keeps `min-h-dvh` honest when
          the copy is short and the window is wide.

          The hairlines are `border-line`, so they are warm cream at 16%
          rather than a grey that would read as a seam in a screenshot.

          `pointer-events-none` because it is paint. It sits at z-0, so
          it is behind the type and a click on a button never reaches it
          — but the frame is mostly *not* type, and in the empty band
          above the copy this div is the topmost thing under the cursor.
          Left to `auto` it quietly owns every click, drag and text
          selection in that region, and `e2e/hero.spec.ts` asserts it.
      ------------------------------------------------------------------ */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="grid h-full grid-cols-2 md:grid-cols-4">
          {FEATURED_DISHES.map((dish, i) => (
            <div
              key={dish.label}
              className="relative overflow-hidden border-l border-line first:border-l-0"
            >
              <Image
                src={dish.src}
                alt=""
                fill
                {...(i === 0 ? { priority: true } : { loading: "eager" as const })}
                sizes="(min-width: 768px) 25vw, 50vw"
                placeholder="blur"
                className={`hero-panel__img hero-panel__img--${DRIFT[i]} object-cover`}
                style={{ objectPosition: dish.focal ?? "50% 50%" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* The ramp that makes the frame readable. `pointer-events-none` is
          load-bearing: it is a full-viewport layer between the
          photographs and every control on the page, and a version of it
          that takes pointer events is how "Reserve a Place" stops working
          for reasons no screenshot shows. `aria-hidden` because it is
          paint, not content. */}
      <div
        aria-hidden="true"
        className="hero-vignette pointer-events-none absolute inset-0 z-10"
      />

      {/* -----------------------------------------------------------------
          The copy block.

          `mt-auto` rather than `flex-1`, and the difference is not
          cosmetic: `flex-1` makes this box absorb the whole section, so
          its height stops describing the type and starts describing the
          viewport. `mt-auto` pins it to the foot and lets it size to its
          own content, which is what makes `#top .container-x` a
          meaningful box for the contrast probe to clip to — and what
          keeps the upper third of the frame genuinely open, which is
          where the photographs are.

          The mobile bottom padding is not symmetric with the desktop one
          on purpose: on a phone the fixed quick-action bar owns the last
          56px of the viewport, so the footline has to clear it.
      ------------------------------------------------------------------ */}
      <div className="container-x relative z-20 mt-auto pb-24 pt-6 md:pb-14 md:pt-8">
        <MaskRise delay={0.1} duration={0.8} className="eyebrow">
          Hotel Bagheecha &middot; Virar
        </MaskRise>

        {/* One word, and it is the whole composition. `text-balance` is
            deliberately absent — this must never wrap, and balancing a
            single word does nothing but invite the browser to try.

            The `sr-only` "Hotel" is load-bearing for the accessible name;
            the asterisk is hidden for the opposite reason. */}
        <h1 className="mt-4 font-display text-[clamp(3.2rem,10.5vw,9rem)] font-normal leading-[0.85] tracking-tighter text-ink">
          <MaskRise delay={0.18}>
            <span className="sr-only">Hotel </span>
            bagheecha
            <span aria-hidden="true" className="text-vermillion">
              *
            </span>
          </MaskRise>
        </h1>

        {/* ---------------------------------------------------------------
            The supporting row, and the reason the photographs are
            visible at all.

            Stacked under the wordmark — the obvious layout — the copy
            block measured 590px of a 720px viewport, which left the four
            panels a strip of about 130px at the top and made the whole
            backdrop decorative rather than seen. Setting the subtitle and
            the actions side by side under the wordmark instead of over
            each other takes 120px out of the block, and every one of
            those pixels goes back to the photographs.

            It is also the better page: a wordmark, a line of copy and a
            pair of buttons at three different x-positions is a magazine
            spread; the same three things stacked against the left margin
            is a template.

            Below `lg` there is no room for two columns and the row
            collapses to a stack, which is the same layout the whole page
            uses at that width.
        ---------------------------------------------------------------- */}
        <div className="mt-7 grid grid-cols-12 items-end gap-x-6 gap-y-7">
          <div className="col-span-12 lg:col-span-5">
            <MaskRise delay={0.46} duration={0.9}>
              <p className="max-w-md text-pretty text-[15px] leading-7 text-ink-muted md:text-base">
                The city&rsquo;s rooftop lounge, its family dining rooms, and a
                back bar that runs late &mdash; under one roof in Virar.
              </p>
            </MaskRise>
          </div>

          {/* Two ghosts, never a solid. See the note at the head of this
              file: with a wordmark this size, a filled block beside it is
              two things shouting. */}
          <div className="col-span-12 lg:col-span-6 lg:col-start-7 lg:justify-self-end">
            <MaskRise delay={0.56} duration={0.9}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:justify-end">
                <ActionButton
                  href={RESERVE_HREF}
                  variant="outline"
                  size="lg"
                  className="w-full justify-center sm:w-auto"
                >
                  Reserve a Place
                </ActionButton>
                <ActionButton
                  href="#menus"
                  variant="outline"
                  size="lg"
                  cursor="hover"
                  className="w-full justify-center sm:w-auto"
                >
                  Explore the Menu
                </ActionButton>
              </div>
            </MaskRise>
          </div>
        </div>

        {/* -----------------------------------------------------------------
            Footline. Closes the frame with a hairline: the three rooms
            named plainly on the left, the scroll cue on the right.

            The separators are vermillion — the accent doing the one job
            it is genuinely good at, which is being a mark rather than a
            word. They are `aria-hidden`, so the 3:1 graphical-object
            floor does not bind them, and at 0.7 alpha they clear it
            anyway.

            The cue is `md`-and-up only, the exact complement of the
            mobile action bar. Below `md` the bar owns the bottom strip
            of the screen and the cue would land underneath it — a cue
            half-eaten by a toolbar reads as a bug, and a phone hardly
            needs one: the content visibly runs past the fold.
        ------------------------------------------------------------------ */}
        <div className="mt-8 md:mt-12">
          <div aria-hidden="true" className="rule-hairline" />

          <div className="mt-4 grid grid-cols-12 items-center gap-x-6 gap-y-4">
            <ul className="col-span-12 flex flex-wrap items-center gap-x-5 gap-y-2 md:col-span-8">
              {ZONE_LEGEND.map((zone, i) => (
                <li key={zone} className="flex items-center gap-5">
                  {/* Separators are `sm`-and-up only. Below that the
                      legend wraps to two lines, and a diamond leading
                      the second line — separated from the word it was
                      meant to sit between — reads as a bullet point
                      nobody wrote. */}
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="hidden size-1 rotate-45 bg-vermillion/70 sm:block"
                    />
                  )}
                  <span className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
                    {zone}
                  </span>
                </li>
              ))}
            </ul>

            <div className="col-span-12 md:col-span-4 md:justify-self-end">
              <a
                href="#atmospheres"
                aria-label="Scroll to the atmospheres section"
                className="hidden items-center gap-3 text-ink transition-opacity duration-500 hover:opacity-70 md:inline-flex"
              >
                <span className="text-[9px] uppercase tracking-[0.32em]">
                  Scroll
                </span>
                <span className="relative h-10 w-px overflow-hidden bg-line-strong">
                  <span className="scroll-cue__mark absolute inset-x-0 top-0 h-4 bg-champagne" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
