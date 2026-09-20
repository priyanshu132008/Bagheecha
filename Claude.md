# CLAUDE.md - Developer 1 (Frontend & Experience Architect)

## 1. Environment & Commands
- **Framework:** Next.js 16 (App Router, Turbopack default, React 19, TypeScript).
  This is *not* the Next.js in your training data — read `frontend/AGENTS.md` and the
  guides in `node_modules/next/dist/docs/` before writing code.
- **Styling:** Tailwind CSS v4. There is **no `tailwind.config.ts`** — tokens are
  CSS-first, declared in `app/globals.css` under `@theme inline`.
- **Development Server:** `npm run dev`
- **Production Build:** `npm run build`
- **Typecheck:** `npx tsc --noEmit`
- **E2E Testing:** `npx playwright test` (chromium, webkit, Pixel 7)

## 2. Design System & Theme Directives ("AUBERGINE & CREAM")

Supersedes "Alabaster & Charcoal". Those grounds were a *neutral* pair — warm
grey-white and near-black — which is the safest choice available, and safe is what a
template looks like. These are a *chosen* pair: a deep plum you could not mistake for
a framework default, and a cream warm enough to read as paper rather than screen.

- **Ground:** Warm Cream `#F9F6F0` (`cream`, sunk `#F1ECE1`) — the default, and the
  ground for every ordinary section. **Deep Plum / aubergine `#240B14`** (`plum`, sunk
  `#180710`) is the dark ground: the hero, the bar book, and every chapter after dark.
  **Soft Peach `#F4C5B9`** (`peach`) is a tinted panel for a figure or a quote — never
  a page ground; at 1.4:1 against cream it is a shift you feel, not a boundary you see.
- **Text:** Deep Plum `#240B14` on light · Pure White `#FFFFFF` on dark. White, not
  cream, on the dark ground: on plum the two measure 17.1:1 and 16.4:1, so this is not
  a contrast decision — white is what keeps a menu's 10px small caps crisp.
- **Accents, and there are two because one cannot do both jobs.**
  - **Vermillion `#D33F2E`** (`vermillion`) is the mark: category tags, rules, the
    hero's asterisk. It measures **4.31:1 on cream and 3.97:1 on plum** — so it clears
    AA for large text and for anything that is a shape rather than a word, and misses
    it for a 10px label by a hair. **Vermillion is never small text.**
  - **`--vermillion-ink #B8321F`** (5.54:1 on cream) is the only form small accent
    text may take, and it exists only on the light tone. There is no small accent text
    that clears 4.5:1 on plum, so on a dark ground `--accent-ink` falls back to
    **champagne** — which is a readable dark-ground accent at 10.9:1, and the honest
    answer to "I want this word in the accent".
  - **Champagne `#D6C5A5`** is a dark-surface accent only: 1.6:1 on cream. It is a
    rule, a fill and a dark-section label, never text on a light ground.

### The token architecture is three layers, and the middle one is the point
1. **Primitives** — `--alabaster`, `--charcoal`, `--champagne`. Never used directly.
2. **Semantic roles** — `--ink`, `--surface`, `--line`, `--action-*` — re-mapped by
   `[data-tone="light"|"dark"]` on the section.
3. **Utilities** — `text-ink`, `bg-surface`, `border-line`.

This is why a section changes tone by setting `data-tone` and nothing else. A
component that hardcodes `text-white` is broken on alabaster even though it renders.

### Text tokens — set by measurement, not by eye
| Token | Value | Use |
|---|---|---|
| `text-ink` | plum / white by tone | display headings, nav, primary labels |
| `text-ink-muted` | 74% alpha · 7.85:1 light, 10.31:1 dark | body copy, eyebrows |
| `text-ink-faint` | 70% alpha · 6.68:1 light, 7.02:1 dark | tertiary labels |

**`ink-faint` is the floor.** Anything quieter than 4.5:1 is not a colour decision,
it is a legibility bug — so it is deliberately not defined.

**Translucent tokens composite toward the surface, and over a photograph that means
per pixel.** `ink-muted` at 74% is *not* 74% of the contrast of `ink`: the glyphs mix
with whatever is behind them. Where the ground is a flat colour the token is a
constant; where it is a photograph, measure.

**The hero ramp splits at `md`, and that split is load-bearing.** The copy block
collapses from a two-column spread to a stack below `md`, so it grows from 418px of a
720px frame to 557px of an 839px one — and the eyebrow, the topmost and quietest
thing in the block, moves up with it. Measured against the desktop ramp at 412x839 the
eyebrow came back at **4.29:1**. So `@media (max-width: 767px)` carries a second,
stronger ramp. Do not "simplify" the two back into one: the desktop project stays
green while the mobile project silently fails, which is the worst kind of regression
because the CI you look at is the one that passed.

### Over a photograph, buy contrast locally and never with a flat veil
A flat veil is always available and always passes a contrast test — which is exactly
why it has to be guarded from the other side. The hero therefore asserts **both**
directions: that every glyph clears 4.5:1 at every phase of the drift, **and** that
the band above the type is still genuinely bright (`max > 0.4`, `mean > 0.035`).
Measured on the current build: mean 0.085–0.090 linear, max 1.0000. A `bg-plum/95`
plate over the whole hero would pass every contrast reading in the file and fail the
second test, which is the point of having it.

Mask only where glyphs actually sit, and aim each mask at what it protects. Two
measured lessons, both of which cost a round to learn:

- **A radial cannot mask a wide, short text block.** Reaching the end of a display
  line with useful strength forces the ellipse to still be strong well past it — the
  two constraints contradict. The right shape is a **horizontal ramp masked
  vertically** with `mask-image`.
- **Find where the type actually ends before sizing the ramp.** Measure the
  rightmost glyph pixel; do not guess from the column. The hero scrim was veiling
  100px of open sky past the last letterform.

The probe that measures all of this resolves a translucent colour through a canvas
`fillStyle` (Tailwind v4 emits `oklab(… / 0.85)`, so parsing `rgba()` matches nothing
and a "not transparent" assertion then passes for the wrong reason), scores only
pixels the glyph actually changed, and hard-fails rather than scoring an
out-of-viewport sample.

### Typography Hierarchy
- **Headlines** (`Playfair Display` → `font-display`): massive — `clamp(2.4rem, 6vw, 5.75rem)`,
  tight leading (`leading-[0.96]`), negative tracking (`tracking-[-0.03em]`).
- **UI Labels / Buttons / Eyebrows** (`Inter` → `font-sans`): all-caps, extreme tracking
  (`tracking-[0.2em]`–`tracking-[0.34em]`), tiny (`text-[10px]`–`text-xs`).

### Layout
- Strict **12-column grid**, one shared rail: section labels in columns 1–3, content
  from column 5. `e2e/hero.spec.ts` asserts the rail position of all six eyebrows
  and of each heading — if you move a section off the rail, move the test too. (Six,
  not five: the "From the kitchen" kicker inside `#menus` is an eyebrow *within* a
  section rather than at its head, which makes it the one that would drift.)
- **Three deliberate departures**, each asserted exactly rather than tolerated as
  drift:
  1. the hero's display type is anchored **bottom-left** and set at 10.5vw with tight
     negative tracking — a wordmark rather than a headline. Its supporting row is a
     two-column spread beneath it (subtitle left, actions right), not a stack;
  2. `#atmospheres` pins its copy against a gliding column of rooms, so its heading
     sits *on* the label rail instead of inset from it;
  3. `#menus` *opens* on the rail like every other section and then drops it — the
     list runs the full width beneath a masthead that keeps the rail, because 358
     printed lines inside columns 5–12 is a ribbon, and a menu you cannot scan is a
     menu people stop reading.
- **The hero is full bleed and has no rounded corners.** This is asserted in the
  *negative* by `e2e/hero.spec.ts` — inset ≤1px on both sides, radius ≤0, the backdrop
  covering the section to the pixel — because the page previously carried exactly the
  opposite and it was wrong. A rounded container inset from the page edges is the
  shape of a component library, and it made the first thing a guest sees read as
  software rather than as a restaurant. **Putting the hero back in a box is the single
  likeliest regression on this page**, and it is one wrapper div away at all times.
- **Rounding is a system, not a mood.** A frame that stands on its own is a *plate*
  and is rounded (`rounded-2xl`, `md:rounded-3xl`) — the bar's three cinematic
  dividers. A frame that belongs to a column, or to the whole viewport, is square:
  the atmospheres glide, and the hero.
- Massive, deliberate whitespace *between* sections; tight grouping *within* them.
- No cards. No pills. No centred stacks floating in empty space.
- **The hero's bottom padding is asymmetric on purpose** (`pb-24` mobile, `pb-14`
  from `md`). On a phone the fixed 56px `MobileActionBar` owns the last strip of the
  viewport, so the zone-legend footline has to clear it; on desktop there is no bar.
  Symmetrising these two numbers is how the footline ends up under a toolbar, and it
  is one edit away at all times — `e2e/hero.spec.ts` measures it.

### Motion
- One curve, defined once: `--ease-luxe: cubic-bezier(0.32, 0.72, 0, 1)`.
- Cinematic scroll reveals: typography translates **up** out of its own mask
  (`MaskReveal` / `MaskRise`), like a title sequence.
- **`MaskReveal` observes the mask, not the span it animates.** The inner span rests
  at `translateY(110%)`, entirely outside its own `overflow-hidden` parent, so the
  browser gives it a zero-area intersection rect and an `IntersectionObserver` on it
  reports `isIntersecting: false` *forever* — the text can never appear. Putting
  `whileInView` on that span silently made every fully-clipped reveal permanent, on
  desktop and mobile alike, while `toContainText` tests kept passing because they
  match hidden text. Watch the mask (same box, never clipped, `ratio 1`) and drive
  the child from `useInView`. `e2e/hero.spec.ts` now walks the page and asserts every
  masked line actually arrived at rest.
- Reduced motion is handled centrally by `<MotionConfig reducedMotion="user">` in
  the root layout. **Do not branch on `useReducedMotion()` in a component** — it reads
  the media query during the first client render and causes a hydration mismatch.

## 3. Frontend Architecture Rules
- `"use client"` only where genuinely needed: Framer Motion wrappers, cursor tracking,
  the navbar. `Hero.tsx` is a **server component** — keep it that way.
- **No WebGL.** There is no canvas on this site; it was removed as part of the
  overhaul. Do not reintroduce one.
- **`backdrop-blur` only on fixed or sticky elements** (header, drawer, cursor).
  Never on scrolling content — it forces a continuous GPU repaint on mid-range
  Android. Dark gradient masks do the same legibility job for free.
- **Animate `transform` and `opacity` only.** Never `top` / `left` / `width` / `height`.
- **Images:** static imports so `next/image` derives intrinsic size and blurDataURL at
  build time (zero CLS). `priority` on the LCP image only; everything below the fold
  stays lazy. The hero's four panels are the one exception to "everything in the first
  viewport gets `priority`": panel one is preloaded and the other three are
  `loading="eager"`, because four `<link rel=preload>` tags for one backdrop is
  bandwidth taken from the text.
- **An infinite animation is CSS, never a JS loop.** `Hero.tsx` is a server component
  and must stay one, so it cannot hold a hook; and a Framer loop would have to read
  `prefers-reduced-motion` during render, which desyncs server and client markup. The
  global reduced-motion block neutralises a CSS animation for free. This is why the
  hero's panel drift and the scroll cue are both `@keyframes`.
- **An infinite animation's base style is its reduced-motion still.** The blanket
  rule sets `animation-duration: 0.01ms !important` and pins the iteration count, but
  never sets `animation-fill-mode` — so it stays `none`, and a stopped animation
  reverts to the element's **base** style, not to any keyframe. `scale(1.05)` is
  therefore declared on `.hero-panel__img` and the keyframes only perturb it; get this
  wrong and the still frame is an arbitrary mid-drift crop with a bare edge inside each
  panel. Every loop must also be closed (0% identical to 100%). `e2e/hero.spec.ts`
  asserts the resting *scale*, not merely that something stopped.
- **CTAs** use `ActionButton` — squared split-cell, 48px minimum height, all-caps.
  Exactly **one** `solid` CTA per view; everything else is `outline`. Two solids
  competing in the first viewport is what makes a page look assembled rather than
  art-directed.
- **Z-index** comes from the scale documented in `globals.css`. Never invent `z-[9999]`.

## 4. Accessibility (non-negotiable)
- Every CTA is a real `<a>` (anchor, `tel:`, `wa.me`, Maps) — works with the keyboard,
  with middle-click, and before JS loads.
- **`#spaces` has no `role="tablist"` and must not grow one.** It used to be a
  full-screen `role="tablist"` crossfade that showed one room at a time behind a heavy
  dark veil, which is precisely what the pivot removed. All three rooms are now in one
  scrolling column beside a pinned caption; a guest deciding where to sit reads, they
  do not operate a tablist. `e2e/atmospheres.spec.ts` still asserts the absence of
  `[role="tablist"]` and `role="tab"` *inside `#spaces`*, because a tablist creeping
  back is the exact regression that caused the redesign.

  **Editorial override (S2, 2026-09-20):** `#spaces` carries two intentional groups
  of interactive elements that are *not* a switcher:

  - Three per-room WhatsApp CTAs — `Reserve the terrace / AC room / classic room` —
    in the pinned column at `lg`, and one inside each figure's figcaption below `lg`.
    All point at `WHATSAPP_RESERVATION_HREF` (the pre-filled template already names
    `Preferred Seating (Terrace/AC/Classic)`, so the `wa.me` URL is byte-identical
    to the rest of the site).
  - A clickable `01 / 02 / 03` progress rail in the pinned column at `lg`, three
    buttons with a 44 px hit area each. Clicking one smooth-scrolls to the
    corresponding figure (the same `id` the hero's bottom strip deep-links to).

  The e2e spec relaxes the `button` and `a` zero-assertions to `>= 0` (removed) and
  `>= 3` respectively, and keeps the `tablist`/`tab` zero-assertions hard. The shape
  of the original pivot regression — a tablist — is still caught; the new anchors
  and buttons are not.

  **Every "absence" assertion is scoped to `#spaces`, and that scoping is load-
  bearing.** `#menus` has a `role="tablist"` of its own — the Kitchen/Bar toggle —
  and it is supposed to. A page-wide `getByRole("tab")` count of zero would pass for
  the wrong reason today and fail the moment the menu is touched. When adding an
  absence assertion, anchor it to the section, never to `page`.
- **A caption that changes on scroll must change *opacity only* — never `aria-hidden`.**
  The pinned atmospheres caption renders all three rooms stacked in one grid cell and
  crossfades between them. An earlier pass marked the two inactive copies `aria-hidden`,
  which is not a crossfade: it is two of the three rooms going undescribed for a screen
  reader. The duplication that *would* follow is handled at the source instead — the
  figure's index-and-name strip is decorative reinforcement and carries `aria-hidden`
  itself. Exactly one heading and one body per room, at every width.
- **The menu toggle's tablist owns its panel.** `role="tablist"` / `role="tab"` with a
  roving `tabIndex`, arrow-key handling, `aria-controls` pointing at the live panel and
  `aria-labelledby` pointing back at the tab. The panel is a *single* mounted subtree
  that changes content, not two books crossfading — so there is never a second copy of
  the menu in the DOM for a screen reader to read twice.
- Where a control *is* interactive, hover may preview but must never be the only way
  to operate it.
- Text contrast is **measured against the actual composited background**, not assumed
  from the token. Over a photograph, compute per-pixel:
  `seen = a × fg + (1 − a) × bg`, then `contrast(seen, bg)`. Sampling text that is
  below the fold returns transparent black and reads as a perfect pass — always
  scroll the section into view first, and hard-fail on an out-of-viewport sample.

## 5. Work Scope Boundary
- Focus **100% on UI/UX, motion, and responsive design**.
- Connect form inputs to mock states or pass structured payloads to the API endpoints
  managed by Dev 2.
