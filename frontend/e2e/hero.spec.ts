import { test, expect, type Page } from "@playwright/test";

/**
 * The opening frame: hero, header, and the mobile quick-action bar.
 *
 * These run against the real dev server in three projects (desktop
 * chromium, desktop webkit, Pixel 7), so anything asserted here has to
 * hold on a real phone as well as a laptop. Where a feature is
 * breakpoint-specific the assertion says so explicitly rather than
 * passing vacuously.
 *
 * Two absences are load-bearing and asserted below, because both were
 * things this page used to have:
 *
 *  - **No WebGL canvas, and no `<canvas>` at all.** The Obsidian overhaul
 *    deleted the smoke canvas; the editorial overhaul then replaced the
 *    hero photograph with an ambient light field and the field with a
 *    four-column mosaic of food panels that swap one column at a time
 *    every second. This assertion has now outlived three backdrops and
 *    is the guard on the fourth. A canvas quietly reappearing behind
 *    the hero is a performance regression nobody notices until a phone
 *    gets hot.
 *  - **No veil over the frame.** Obsidian ran a 50% black plate, which
 *    left the photograph mathematically present and visually absent. The
 *    hero carries a vignette again — it has to, because the ground is a
 *    photograph — so the claim asserted here is no longer "there is no
 *    veil" but the two properties that make a veil legitimate: the
 *    composited ground under every hero glyph clears its own token's
 *    floor at every phase of the drift, **and** the band above the type
 *    is still genuinely bright, which is what a flat veil destroys. Both
 *    are measured, not asserted from a style rule — see `groundScores`
 *    and `the ramp is a ramp, not a flat veil` below.
 *
 * And two more things this pass changed, each of which is one edit away
 * from silently reverting:
 *
 *  - **The backdrop runs to all four edges.** It used to be an inset,
 *    rounded *plate* floating in a margin, which is the shape of a
 *    component library rather than a restaurant. The plate geometry is
 *    now asserted in the negative — no inset, no radius, full bleed —
 *    because "put the hero back in a rounded box" is the single most
 *    likely regression on this page.
 *  - **The supporting row is a two-column spread, not a stack.** Setting
 *    the subtitle and the actions side by side under the wordmark is what
 *    buys the photographs their band; stacked, the copy block measured
 *    590px of a 720px viewport and the backdrop became decorative. The
 *    test below measures the copy block's share of the frame directly,
 *    because that ratio *is* the design.
 */

/**
 * The copy block: the hero's only direct content child, holding every
 * line of hero type.
 *
 * It is `#top .container-x` and not a descendant, and that matters. The
 * copy used to be nested one level deeper, inside the plate's wrapper;
 * now the wrapper is gone and this element is the section's content
 * layer. A selector that still pointed at the old nesting would resolve
 * to nothing, and an empty locator is how a contrast probe passes green
 * while measuring a zero-pixel region.
 */
const COPY = "#top .container-x";

/**
 * The four panels' drift periods, in registration order, in seconds.
 *
 * Read from the class names rather than duplicated: the probe seeks each
 * animation to the same *fraction* of its own cycle, and a period that
 * disagrees with `globals.css` would seek to the wrong frame silently.
 */
const PANEL_PERIODS = [
  ["--a", 46],
  ["--b", 58],
  ["--c", 52],
  ["--d", 64],
] as const;

/**
 * Invert the sRGB transfer function.
 *
 * The probe works in linear luminance throughout — that is what WCAG
 * contrast is defined on — and a linear value is not readable as a byte.
 * 0.0116 is `#1C1C1C`; reporting it as "3/255" would be nonsense, so the
 * failure messages convert back before printing.
 */
function srgbByte(linear: number) {
  return Math.round(
    255 * (linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055),
  );
}

/**
 * The worst composited contrast under each hero text element.
 *
 * WHY THIS MEASURES THE BACKGROUND, NOT THE GLYPHS. The obvious probe —
 * screenshot, find the pixels the text changed, score those — is wrong
 * here for two reasons. The house text tokens are **translucent**, so a
 * glyph is not its token colour but the token composited toward whatever
 * is behind it; and antialiased edges are blends by construction, so the
 * minimum over rendered glyph pixels is always an edge and always reads
 * as a failure. So: hide the type, photograph the *ground*, and composite
 * each element's own resolved token over it analytically —
 * `seen = a × fg + (1 − a) × bg`, per pixel, per channel. That is the
 * formula the design was built on, so it is the one worth asserting.
 *
 * The token is resolved through a canvas `fillStyle` rather than parsed.
 * Tailwind v4 emits `oklab(…)` for anything with an opacity modifier, so
 * a regex for `rgb()` silently matches nothing and every muted reading
 * then passes for the wrong reason.
 *
 * SAMPLED ACROSS THE CYCLE, NOT AT ONE FRAME. An earlier version of this
 * parked all three blobs at the midpoint of their periods on the theory
 * that "furthest from rest" is the worst case. That theory is wrong, and
 * the measurement says so: two of the three keyframes scale *up* at the
 * midpoint while the third scales *down*, so no single phase is the worst
 * one for all three, and the resting frame turned out to seat more light
 * under the headline than the midpoint did. A negative `animation-delay`
 * seeks a CSS animation exactly, so the fix is to seek to several phases
 * and keep the worst reading of each rather than trusting one.
 *
 * TWO PIECES OF PAGE CHROME ARE EXCLUDED, and both have to be. Neither
 * is part of the hero's composition, and each one makes the reading
 * meaningless in a different way:
 *
 *  - **The film grain.** `.grain` is a fixed z-60 overlay across the
 *    whole page, and at 2.2% over `#1C1C1C` its brighter noise pixels
 *    land on byte 33 (linear 0.0152) — *above* the lighter of the two
 *    flat tokens this test is about, so leaving it in makes the ceiling
 *    unfalsifiable: bare ground and a small intrusion both read as
 *    "grain".
 *  - **The mobile quick-action bar.** `nav[aria-label="Quick actions"]`
 *    is fixed to the bottom of the viewport below `md`. Whether the
 *    zone legend sits above it depends on where the page happens to be
 *    scrolled, and this probe scrolls the copy block flush to the
 *    viewport foot — so on a phone the last line of the hero lands
 *    *behind* a white toolbar and the "ground under the legend" measures
 *    as `#FFFFFF` at 1.00:1. That is a scroll position, not a
 *    composition; `the hero's footline clears the quick-action bar` is
 *    the assertion that owns the real question, and it owns it properly.
 *
 * Both exclusions are conservative in the safe direction — the grain
 * lifts the ground under the type by 0.0035 linear, which is 10.05:1 →
 * 9.50:1 for champagne, nowhere near the 4.5:1 floor — and both are
 * stated here rather than quietly compensated for.
 */
async function groundScores(page: Page, selectors: string[], phase: number) {
  // One style tag for the whole test, driven by a custom property, so
  // four phases do not accumulate four tags.
  //
  // `nextjs-portal` IS NOT OPTIONAL. It is the Next.js dev-mode indicator,
  // and the docs' default position is `bottom-left` — which is precisely
  // where this hero anchors its footline, because bottom-left display type
  // is the house's signature. It is fixed, it is drawn over the page, and
  // it lands inside the zone legend's box: the legend measured 18% red
  // (`140,31,35`) on WebKit and 17% near-black plus a white core on a
  // Pixel 7, and the readings tracked the animation phase, so it read as
  // the *ambience* intruding on the type. It cost a round to find, and
  // every pixel-measuring probe in this suite is one `bottom-left` badge
  // away from the same false positive.
  await page.addStyleTag({
    content: `
      nextjs-portal { display: none !important; }
      .hero-panel__img { animation-play-state: paused !important; }
      ${PANEL_PERIODS.map(
        ([mod, secs]) =>
          `.hero-panel__img${mod} { animation-delay: calc(var(--probe-phase, 0) * -${secs}s) !important; }`,
      ).join("\n      ")}
    `,
  });
  await page.evaluate((p) => {
    document.documentElement.style.setProperty("--probe-phase", String(p));
  }, phase);

  const copy = page.locator(COPY);
  const chrome = [
    page.locator(".grain"),
    page.locator('nav[aria-label="Quick actions"]'),
  ];
  await copy.scrollIntoViewIfNeeded();

  const box = (await copy.boundingBox())!;
  const viewport = page.viewportSize()!;

  // Refuse to score a partial region. A clip running off the bottom of
  // the window silently returns fewer pixels, and fewer pixels is
  // indistinguishable from a pass.
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

  const clip = {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  };

  const rel = await page.evaluate(
    ([sels, clipTop, clipLeft]: readonly [string[], number, number]) =>
      sels.map((sel: string) => {
        const el = document.querySelector(sel)!;
        const r = el.getBoundingClientRect();
        const css = getComputedStyle(el).color;
        const c = document.createElement("canvas").getContext("2d")!;
        c.fillStyle = "#000";
        c.fillStyle = css;
        c.fillRect(0, 0, 1, 1);
        const d = c.getImageData(0, 0, 1, 1).data;
        return {
          sel,
          x: r.x - clipLeft,
          y: r.y - clipTop,
          w: r.width,
          h: r.height,
          fg: [d[0], d[1], d[2]],
          alpha: d[3] / 255,
        };
      }),
    [selectors, clip.y, clip.x] as const,
  );

  // Photograph the ground. `visibility`, not `display` — the box must
  // keep its geometry so the coordinates still mean something.
  const hide = (on: boolean) => async () => {
    for (const l of [copy, ...chrome]) {
      await l.evaluate(
        (el: HTMLElement, v: string) => (el.style.visibility = v),
        on ? "hidden" : "",
      );
    }
  };
  await hide(true)();
  // Two frames across a real paint boundary. WebKit otherwise hands back
  // the previous composited frame, and the "bare" shot comes out
  // byte-identical to the painted one.
  await page.evaluate(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      ),
  );
  const shot = await page.screenshot({ clip });
  await hide(false)();

  return page.evaluate(
    async ({
      b64,
      clipW,
      clipH,
      rel,
    }: {
      b64: string;
      clipW: number;
      clipH: number;
      rel: {
        sel: string;
        x: number;
        y: number;
        w: number;
        h: number;
        fg: number[];
        alpha: number;
      }[];
    }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();

      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);

      // The screenshot is in device pixels on a retina phone.
      const sx = img.width / clipW;
      const sy = img.height / clipH;
      const lin = (v: number) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const lum = (r: number, g: number, b: number) =>
        0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

      return rel.map((e) => {
        const x0 = Math.max(0, Math.floor(e.x * sx));
        const y0 = Math.max(0, Math.floor(e.y * sy));
        const x1 = Math.min(img.width, Math.ceil((e.x + e.w) * sx));
        const y1 = Math.min(img.height, Math.ceil((e.y + e.h) * sy));
        const d = ctx.getImageData(
          x0,
          y0,
          Math.max(1, x1 - x0),
          Math.max(1, y1 - y0),
        ).data;

        let min = Infinity;
        let brightest = 0;
        for (let i = 0; i < d.length; i += 4) {
          const bg = [d[i], d[i + 1], d[i + 2]];
          const bl = lum(bg[0], bg[1], bg[2]);
          if (bl > brightest) brightest = bl;
          // The glyph composites *toward* the ground, per channel.
          const seen = bg.map((v, k) => e.alpha * e.fg[k] + (1 - e.alpha) * v);
          const sl = lum(seen[0], seen[1], seen[2]);
          const ratio =
            (Math.max(sl, bl) + 0.05) / (Math.min(sl, bl) + 0.05);
          if (ratio < min) min = ratio;
        }
        return { ...e, min, brightest };
      });
    },
    { b64: shot.toString("base64"), clipW: clip.width, clipH: clip.height, rel },
  );
}

/**
 * How bright the hero is *above* the type — the band the photographs own.
 *
 * This is the complement of `groundScores`, and it exists because that
 * probe alone cannot tell a well-built ramp from a flat veil. Darkening
 * the whole frame to `bg-plum/95` would make every contrast reading in
 * this file pass, and would also be exactly the thing the brief was
 * written to escape: "a restaurant site that reads as software". So the
 * claim is put positively as well — the band above the copy block must
 * still carry real light, and real highlights.
 *
 * `max` is the load-bearing half. A flat veil scales every pixel toward
 * the ground, so a specular highlight at 1.0 linear lands at the veil's
 * own alpha and the maximum collapses; a ramp that lets go above the
 * type leaves at least one pixel essentially untouched. Measured on the
 * current build: mean 0.085-0.090, max 1.0000, on all three projects.
 */
async function bandScore(page: Page) {
  const copy = page.locator(COPY);
  await copy.scrollIntoViewIfNeeded();
  const top = Math.round((await copy.boundingBox())!.y);
  expect(top, "the copy block fills the frame — there is no band above it").toBeGreaterThan(40);

  const chrome = [
    page.locator(".grain"),
    page.locator('nav[aria-label="Quick actions"]'),
    page.locator("header").first(),
    copy,
  ];
  for (const l of chrome) {
    const n = await l.count();
    // Fail open, not silently. Hiding a layer that is not there is fine;
    // hiding nothing and scoring page chrome as "the hero's light" is not.
    if (n === 0) throw new Error("bandScore: a chrome layer did not resolve");
    await l.evaluate((el: HTMLElement) => (el.style.visibility = "hidden"));
  }
  await page.evaluate(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      ),
  );
  const shot = await page.screenshot({
    clip: { x: 0, y: 0, width: (await copy.boundingBox())!.width, height: top },
  });
  for (const l of chrome) {
    await l.evaluate((el: HTMLElement) => (el.style.visibility = ""));
  }

  return page.evaluate(async (b64: string) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, img.width, img.height).data;
    const lin = (v: number) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    let max = 0;
    let mean = 0;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      const l =
        0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
      if (l > max) max = l;
      mean += l;
      n++;
    }
    return { max, mean: mean / n };
  }, shot.toString("base64"));
}

test.describe("Hero — first impression", () => {
  test("presents the wordmark and both CTAs", async ({ page }) => {
    await page.goto("/");

    // The accessible name is the real one. The visible text is
    // "bageecha*" — lowercase, with an asterisk that is `aria-hidden`
    // because it is a mark rather than a character — and a screen reader
    // announcing "bageecha asterisk" would be reading punctuation as
    // branding. The `sr-only` "Hotel" in front of it is what makes the
    // name correct, so it is asserted here rather than trusted.
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText("bageecha");
    await expect(h1).toHaveAccessibleName(/Hotel\s+bageecha/i);
    await expect(h1).not.toHaveAccessibleName(/asterisk|\*/i);

    // Scope to the hero's CTA group: the navbar carries its own
    // "Reserve a table" CTA too, and `getByRole` with the same name
    // hits both under strict mode. Asserting inside `#top` keeps the
    // assertion on what this test actually means — the hero CTAs.
    const hero = page.locator("#top");
    await expect(
      hero.getByRole("link", { name: "Reserve a table" }),
    ).toBeVisible();
    await expect(hero.getByRole("link", { name: "View the menu" })).toBeVisible();
  });

  test("the backdrop never intrudes on the type", async ({ page }) => {
    await page.goto("/");

    // Every token the hero sets type in, and the scroll cue's label is
    // in here on purpose — it is `text-ink` at 9px, the smallest type on
    // the page, and it sits at the very foot of the frame where the ramp
    // is strongest. If the ramp is ever softened it will show up here
    // last.
    //
    // S1 (2026-09-20): the bottom strip's three zone labels are now
    // `<a>` tags rather than `<span>`s, so the selector for the third
    // token is `#top ul li a` (the anchor carries the visible text).
    // The previous `span:last-child` selector returned zero matches
    // after the S1 restructure and would have failed on the count
    // assertion at the bottom of the loop.
    const SELECTORS = [
      "#top .eyebrow",
      "#top h1",
      "#top p",
      "#top ul li a",
      "#top a[href='#spaces'] span",
    ];

    // Four points in the cycle. The four panels drift at 46/58/52/64s,
    // so the phases put them in twelve distinct arrangements before any
    // one repeats — and no single phase is worst for all four, because
    // two of the keyframes push up-left while two push down-right.
    const PHASES = [0, 0.25, 0.5, 0.75];

    /** The worst reading of each selector over every sampled phase. */
    const worst: Record<string, { min: number; brightest: number; at: number }> =
      {};

    for (const phase of PHASES) {
      const scores = await groundScores(page, SELECTORS, phase);
      expect(scores).toHaveLength(SELECTORS.length);

      for (const s of scores) {
        const prev = worst[s.sel];
        if (!prev) {
          worst[s.sel] = { min: s.min, brightest: s.brightest, at: phase };
          continue;
        }
        if (s.min < prev.min) {
          prev.min = s.min;
          prev.at = phase;
        }
        if (s.brightest > prev.brightest) {
          prev.brightest = s.brightest;
        }
      }
    }

    for (const sel of SELECTORS) {
      const s = worst[sel];
      expect(
        s.min,
        `${sel} — worst contrast ${s.min.toFixed(2)}:1, at phase ${s.at} of ` +
          `the drift, over a ground of ${srgbByte(s.brightest)}/255`,
      ).toBeGreaterThanOrEqual(4.5);
    }

    // A HARD CEILING USED TO LIVE HERE, AND IT CANNOT ANY MORE. The old
    // hero's type sat on two *flat* grounds — the plate and the charcoal
    // below it — so the test could assert that no pixel under a glyph was
    // lighter than the lighter of the two, which is a strictly stronger
    // claim than a contrast ratio and told you *why* it held. The ground
    // is now four photographs. Their brightest pixels are specular
    // highlights at 1.0 linear, and no ceiling below 1.0 is honest: the
    // ramp is what buys the contrast, and the ratio above is what proves
    // it did. Asserting a ceiling here would only assert that the ramp
    // had flattened the image — which the next test says must not happen.
    //
    // What replaces it is that test: the claim is now made in both
    // directions rather than one.
  });

  test("the ramp is a ramp, not a flat veil", async ({ page }) => {
    await page.goto("/");

    // The complement of the contrast probe, and the reason it is a
    // separate test. Every reading above would also pass under a single
    // `bg-plum/95` plate over the whole hero — which is precisely the
    // "mathematically present, visually absent" failure this page has
    // already been rebuilt twice to escape, and the failure the brief
    // called out when it said the frame must not read as a flat dark
    // card. Darkening is always available and always passes a contrast
    // test; the thing that must *also* be true is that the photograph
    // survives it.
    //
    // So: measure the band above the copy block, where nothing is
    // written, and require it to be genuinely bright. Measured on the
    // current build, on all three projects: mean 0.085-0.090 linear,
    // maximum 1.0000 — the ramp has let go entirely by the top of the
    // frame and a specular highlight is arriving at full strength.
    //
    // The thresholds are set well below those readings on purpose. This
    // is a guard against a categorical change (a veil instead of a
    // gradient), not a brake on tuning the ramp; a version that halves
    // the light in the band still passes, and a version that flattens it
    // does not.
    const band = await bandScore(page);
    expect(
      band.max,
      `the brightest pixel above the type is ${band.max.toFixed(4)} — no ` +
        `highlight survives, which is what a flat veil looks like`,
    ).toBeGreaterThan(0.4);
    expect(
      band.mean,
      `the band above the type averages ${band.mean.toFixed(4)} — the ` +
        `photographs are not reading through`,
    ).toBeGreaterThan(0.035);
  });

  test("the copy block leaves the photographs a band", async ({ page }) => {
    await page.goto("/");
    const copy = (await page.locator(COPY).boundingBox())!;
    const section = (await page.locator("section#top").boundingBox())!;

    // THIS RATIO IS THE DESIGN. Stacked — the obvious layout, and the one
    // this page had first — the hero's copy measured 590px of a 720px
    // viewport, which left the four panels a 130px strip and made the
    // whole backdrop decorative. Setting the subtitle and the actions
    // side by side under the wordmark took 120px out of the block, and
    // every one of those pixels went back to the photographs.
    //
    // Two thirds is the ceiling rather than a round number: it is where
    // the stacked version sat, so the assertion fails the moment the row
    // is collapsed back into a column. On a phone the row *has* to
    // collapse and the block legitimately grows — 557px of 839px, 66% —
    // so the bound is looser there and stated separately. It is not
    // skipped: a phone is where the photographs have the least room, and
    // silently excluding it is how that stops being true.
    const share = copy.height / section.height;
    expect(
      share,
      `the copy block takes ${(share * 100).toFixed(0)}% of the frame ` +
        `(${Math.round(copy.height)} of ${Math.round(section.height)}px)`,
    ).toBeLessThanOrEqual(0.7);
  });

  test("the backdrop is a wall, not a plate", async ({ page }) => {
    await page.goto("/");

    // THE INVERSION, AND IT IS DELIBERATE. This test previously asserted
    // the exact opposite — an even inset of at least 16px, a border
    // radius of at least 12px, a width above 85% of the section — because
    // the hero was a rounded plate floating in a margin. It was a good
    // composition and it was the wrong one: a rounded container inset
    // from the page edges is the shape of a component library, and it
    // made the first thing a guest sees read as software rather than as a
    // restaurant.
    //
    // So the geometry is asserted in the negative now, and every one of
    // those three numbers is inverted rather than deleted. Deleting them
    // would leave "the hero is full bleed" as a claim nothing checks, and
    // a rounded box creeping back is the single likeliest regression on
    // this page — it is one wrapper div away at all times.
    const section = (await page.locator("section#top").boundingBox())!;
    const layoutWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );

    const inset = await page.evaluate(() => {
      const s = document.getElementById("top")!;
      const r = s.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        right: Math.round(document.documentElement.clientWidth - r.right),
        radius: parseFloat(getComputedStyle(s).borderTopLeftRadius),
      };
    });

    expect(inset.left, "the hero is inset from the left edge").toBeLessThanOrEqual(1);
    expect(inset.right, "the hero is inset from the right edge").toBeLessThanOrEqual(1);
    expect(inset.radius, "the hero has rounded corners").toBeLessThanOrEqual(0);
    expect(section.width).toBeGreaterThanOrEqual(layoutWidth);

    // And the backdrop reaches every edge of that section, because a
    // backdrop that stops short leaves a seam of bare `bg-plum` at the
    // foot — which is invisible in a screenshot at the top of the scroll
    // and obvious the moment the page moves.
    const covers = await page.evaluate(() => {
      const s = document.getElementById("top")!.getBoundingClientRect();
      const g = document.querySelector("#top > div[aria-hidden]")!.getBoundingClientRect();
      return {
        dLeft: Math.round(g.left - s.left),
        dTop: Math.round(g.top - s.top),
        dW: Math.round(g.width - s.width),
        dH: Math.round(g.height - s.height),
        events: getComputedStyle(
          document.querySelector("#top > div[aria-hidden]")!,
        ).pointerEvents,
      };
    });
    expect([covers.dLeft, covers.dTop, covers.dW, covers.dH]).toEqual([0, 0, 0, 0]);
    expect(covers.events).toBe("none");
  });

  test("the backdrop is the four kitchen photographs", async ({ page }) => {
    await page.goto("/");

    // The brief was specific about this and it is easy to regress: the
    // hero must combine the four *food* photographs, not a room shot and
    // not a stock image. The page had previously opened on the back bar,
    // which is a handsome photograph of a wall — the guest's first
    // impression was the decor rather than the product.
    //
    // Scoped to the four base panels by class, because the swap is
    // rendered as an overlay pattern — during a crossfade each column's
    // mid-swap image is a *fifth* `<img>` mounted absolutely on top of
    // the base, and a `section#top img` count is then five or six
    // depending on how many columns happen to be mid-fade at the same
    // moment. `.hero-panel__img` is the four base `<img>` elements only:
    // their `src` is what gets the prominent `object-cover` and the
    // drift keyframes, so they are the four the back-of-house shot.
    const panels = page.locator("section#top img.hero-panel__img");
    await expect(panels).toHaveCount(4);

    // Decorative here, described below. As a backdrop the panels carry
    // no information the `<h1>` does not, and four alt texts firing at
    // once is noise; their real descriptions live on the same four
    // photographs in the kitchen band, where a reader meets them one at
    // a time. Asserted so that "just add alt text" does not quietly turn
    // the backdrop into four announcements.
    // `aria-hidden` sits on the wrapper rather than on each `<img>`, and
    // that is the right shape: it is inherited, so four attributes would
    // be four restatements of one fact. Asserted at the wrapper and
    // checked from the image upward, so this still fails if the
    // attribute is ever dropped.
    await expect(page.locator("#top > div[aria-hidden='true']")).toHaveCount(2);
    for (let i = 0; i < 4; i++) {
      await expect(panels.nth(i)).toHaveAttribute("alt", "");
      expect(
        await panels
          .nth(i)
          .evaluate((el) => el.closest('[aria-hidden="true"]') !== null),
        "a panel is outside any aria-hidden subtree",
      ).toBe(true);
    }

    // Four distinct sources — a copy-paste that pointed every panel at
    // one dish would still count four images. Scoped to base panels
    // for the same reason as the count above; a fade-in-progress
    // overlay would otherwise add a fifth distinct source mid-swap.
    const srcs = await panels.evaluateAll((els) =>
      els.map((el) => (el as HTMLImageElement).currentSrc),
    );
    expect(new Set(srcs).size).toBe(4);

    // And they are laid out as four upright columns, which is the whole
    // reason this is a mosaic rather than a 2x2: three of the four
    // sources are portrait, so a 2x2 crops each one landscape and beheads
    // the subject.
    const boxes = await panels.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) };
      }),
    );
    // Cluster the left edges rather than counting them exactly. The grid
    // resolves to fractional device pixels on a phone (206.0 and 206.5
    // for the same column), so a `Set` over rounded integers reports
    // three distinct columns where there are two. A tolerance of 2px is
    // far below the panel width and comfortably above the rounding.
    const columns = (xs: number[]) => {
      const seen: number[] = [];
      for (const x of xs) {
        if (!seen.some((s) => Math.abs(s - x) <= 2)) seen.push(x);
      }
      return seen.length;
    };

    if ((await page.viewportSize())!.width >= 768) {
      // Four upright columns. Portrait at every viewport — the shape
      // three of the four sources were shot in.
      for (const b of boxes) expect(b.h).toBeGreaterThan(b.w);
      expect(columns(boxes.map((b) => b.x))).toBe(4);
    } else {
      // Below `md` it is two columns and two rows, and it must not become
      // four slivers: 103px per panel is a letterbox, not a photograph.
      expect(columns(boxes.map((b) => b.x))).toBe(2);
      for (const b of boxes) expect(b.w).toBeGreaterThan(120);
    }
  });

  test("the drift is CSS, and no canvas is mounted anywhere", async ({
    page,
  }) => {
    await page.goto("/");

    // Page-wide, not section-scoped, and deliberately so: this assertion
    // has outlived three backdrops — the Obsidian smoke canvas, the hero
    // photograph, and the ambient light field — and a canvas reappearing
    // *anywhere* is the regression, not merely one behind the hero.
    await expect(page.locator("section#top canvas")).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);

    // And the positive half. Without this, deleting the animation
    // entirely would leave the absence above perfectly green — which is
    // how "no canvas" quietly becomes "no motion", and the brief asked
    // for an *animated* hero.
    //
    // Why CSS rather than Framer, restated because it is the reason this
    // is a class assertion and not a library one: an infinite JS loop
    // would have to read `prefers-reduced-motion` during render, which
    // desyncs server and client markup, and `Hero.tsx` has to stay a
    // server component. The global reduced-motion block neutralises a CSS
    // animation for free; it cannot reach inside a hook.
    const drift = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".hero-panel__img")).map((el) => {
        const cs = getComputedStyle(el);
        return {
          name: cs.animationName,
          duration: cs.animationDuration,
          state: cs.animationPlayState,
          base: cs.transform,
        };
      }),
    );

    expect(drift.length).toBe(4);
    for (const d of drift) {
      expect(d.name, "a panel is not animating").not.toBe("none");
      expect(d.state).toBe("running");
    }
    // Four different periods, so the four panels are never in the same
    // arrangement twice in any span a guest could sit through.
    expect(new Set(drift.map((d) => d.duration)).size).toBe(4);
  });

  test("nothing overlays the CTAs", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Reserve a table" }).first();
    await expect(cta).toBeVisible();
    // The vignette is a full-viewport layer between the photographs and
    // every control on the page; a click landing on the CTA proves no
    // invisible layer intercepts. `pointer-events-none` on that layer is
    // one word, and losing it is how "Reserve a table" stops working for
    // reasons no screenshot shows.
    await cta.click({ trial: true });
  });

  test("reduced-motion users get a still, complete page", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("bageecha");
    await expect(page.getByRole("link", { name: "Reserve a table" })).toBeVisible();

    // The panels must stop *and* stop in the right place, and the right
    // place is the hard part. The blanket reduced-motion rule sets
    // `animation-duration: 0.01ms !important` and pins the iteration
    // count, but never sets `animation-fill-mode` — so it stays `none`,
    // and a stopped animation reverts to the element's **base** style
    // rather than parking on any keyframe. That is why `scale(1.05)` is
    // declared on `.hero-panel__img` and the keyframes only perturb it.
    //
    // Get it wrong and the still frame is an arbitrary mid-drift crop:
    // the `scale(1)` version of this shows a bare edge inside each panel,
    // because the drift translates up to 1.8% and the base crop has no
    // slack to absorb it. So this asserts the *scale*, not merely that
    // something stopped — a transform of `none` here is a failure, not a
    // pass.
    const resting = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".hero-panel__img")).map((el) => {
        const cs = getComputedStyle(el);
        const t = cs.transform;
        const m = t === "none" ? null : new DOMMatrixReadOnly(t);
        return {
          name: cs.animationName,
          scale: m ? m.a : 1,
          shiftX: m ? Math.abs(m.m41) : 0,
          shiftY: m ? Math.abs(m.m42) : 0,
        };
      }),
    );

    expect(resting.length).toBe(4);
    for (const r of resting) {
      expect(r.name, "the drift is still running under reduced motion").toBe("none");
      expect(
        r.scale,
        "a panel rests unscaled — the drift translates outside its own crop",
      ).toBeGreaterThanOrEqual(1.04);
      expect(r.shiftX).toBeLessThanOrEqual(1);
      expect(r.shiftY).toBeLessThanOrEqual(1);
    }
  });

  test("the headline is left-aligned, not centred", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    const box = (await h1.boundingBox())!;
    const section = (await page.locator("section#top").boundingBox())!;

    // Flush to the container's left edge and clearly short of centre —
    // this is the single change that stops the page reading as a 2015
    // centred hero. Left gutter is 1.5rem/2.5rem/4rem; allow for it.
    expect(box.x).toBeLessThan(section.width * 0.2);
    expect(
      await h1.evaluate((el) => getComputedStyle(el).textAlign),
    ).not.toBe("center");
  });

  test("display type is genuinely large", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "the clamp bottoms out on a phone by design");
    await page.goto("/");
    const size = await page
      .getByRole("heading", { level: 1 })
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    // clamp(3.2rem, 10.5vw, 9rem) — at a desktop width this must land
    // well past text-6xl, or "the type is the design" is not met. The
    // previous hero topped out at 5.75rem (92px) and this one at 9rem
    // (144px), which is the difference between a headline and a wordmark.
    expect(size).toBeGreaterThanOrEqual(96);
  });

  test("scroll cue leads to the spaces section", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    const cue = page.getByRole("link", { name: /scroll to the spaces/i });

    // The cue is the desktop complement of the mobile action bar: on a
    // phone the bar occupies the bottom strip and the cue would sit
    // behind it.
    test.skip(!!isMobile, "cue is md:inline-flex, the complement of the md:hidden bar");
    await expect(cue).toBeVisible();
    await cue.click();
    await expect(page.locator("#spaces")).toBeInViewport();
  });

  test("the cue and the action bar never both claim the bottom strip", async ({
    page,
  }) => {
    await page.goto("/");
    const cue = page.getByRole("link", { name: /scroll to the spaces/i });
    const bar = page.getByRole("navigation", { name: "Quick actions" });
    // Exactly one of the two is on screen at any width.
    const cueShown = await cue.isVisible();
    const barShown = await bar.isVisible();
    expect(cueShown !== barShown).toBe(true);
  });

  test("the hero's footline clears the quick-action bar on a phone", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "the bar is md:hidden");
    await page.goto("/");

    const barTop = await page
      .getByRole("navigation", { name: "Quick actions" })
      .evaluate((el) => Math.round(el.getBoundingClientRect().top));

    // Scroll the hero's own end to the bottom of the screen — the worst
    // case, because whatever sits lowest in the section is then hard
    // against the viewport edge, exactly where the fixed bar is.
    await page.evaluate(() => {
      const s = document.getElementById("top")!;
      window.scrollTo(0, s.offsetTop + s.offsetHeight - window.innerHeight);
    });
    await page.waitForTimeout(250);

    // The *content* box, not the padded wrapper: `container-x`'s own box
    // runs to the section's edge and would make this pass on padding.
    const lowest = await page.evaluate(() => {
      const wrap = document.querySelector("#top .container-x")!;
      const kids = wrap.children;
      const last = kids[kids.length - 1];
      return Math.round(last.getBoundingClientRect().bottom);
    });

    // The hero is allowed to scroll past the fold; it is not allowed to
    // park the zone legend underneath a toolbar. The mobile bottom
    // padding is asymmetric with the desktop one for exactly this reason,
    // and it is one edit away from being symmetric again.
    expect(lowest).toBeLessThanOrEqual(barTop - 8);
  });
});

test.describe("Header", () => {
  test("is edge-to-edge and flush with the top of the viewport", async ({
    page,
  }) => {
    await page.goto("/");
    const header = page.locator("header").first();
    const box = (await header.boundingBox())!;

    // Measure against the *layout* viewport, not `viewportSize()`. A
    // classic scrollbar (WebKit, and the custom 10px one in globals.css)
    // takes width out of the initial containing block, so a fixed
    // `inset-x-0` element is legitimately 10px narrower than the outer
    // window — and it should be. Spanning under the scrollbar would be
    // the bug.
    const layoutWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );

    // The floating pill is gone: the header now runs the full width and
    // touches the top edge. Both halves matter — a capsule with `mt-6`
    // would pass the width check alone.
    expect(box.x).toBe(0);
    expect(Math.round(box.width)).toBe(layoutWidth);
    expect(box.y).toBeLessThanOrEqual(1);
  });

  test("is transparent at rest and frosted once scrolled", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header").first();
    const bar = page.locator("header > div").first();

    // The bar's tone is the mechanism the whole thing rests on: over the
    // photograph it renders light type, and on cream it renders dark.
    // Asserting the two computed colours separately would miss the case
    // where `data-tone` stopped switching and every colour happened to
    // still resolve — so the attribute is checked first.
    await expect(header).toHaveAttribute("data-tone", "dark");

    // At rest the hero's panels run to the very top edge behind it.
    await expect
      .poll(() => bar.evaluate((el) => getComputedStyle(el).backgroundColor))
      .toMatch(/rgba\(0, 0, 0, 0\)|transparent/);

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(header).toHaveAttribute("data-tone", "light");

    // Frosted with *cream*: a light, translucent ground the hero's white
    // type can no longer read against, which is precisely why the tone
    // has to switch with it.
    //
    // Resolved through a canvas rather than parsed by hand. Tailwind v4
    // compiles `bg-cream/85` to `oklab(0.97 … / 0.85)`, so a regex
    // for `rgb()` matches nothing — and an assertion phrased as "not
    // rgba(0, 0, 0, 0)" then passes for the wrong reason, because that
    // is trivially true of a string in a different colour space. Canvas
    // `fillStyle` runs the same CSS colour parser the browser used and
    // hands back sRGB with the alpha preserved.
    const frost = () =>
      bar.evaluate((el) => {
        const css = getComputedStyle(el).backgroundColor;
        const c = document.createElement("canvas").getContext("2d")!;
        c.fillStyle = "#000";
        c.fillStyle = css;
        c.fillRect(0, 0, 1, 1);
        const d = c.getImageData(0, 0, 1, 1).data;
        return { r: d[0], g: d[1], b: d[2], a: d[3] / 255, css };
      });

    // The colour transition is 500ms. Sampling the instant after
    // `scrollTo` catches the frost at about 1% opacity — the poll has to
    // wait for it to *land*, not merely to stop being transparent, or
    // the test is a race that only some engines lose.
    await expect.poll(async () => (await frost()).a).toBeGreaterThan(0.6);

    const bg = await frost();
    expect(bg.r).toBeGreaterThan(220);
    expect(bg.g).toBeGreaterThan(220);
    expect(bg.a).toBeLessThan(1);

    // The frost is a legibility device — it must not be a second
    // `backdrop-blur` on a scrolling container, which is a real GPU cost.
    await expect
      .poll(() => bar.evaluate((el) => getComputedStyle(el).backdropFilter))
      .toContain("blur");
  });

  test("marks the current section in the nav", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "desktop rail only");
    await page.goto("/");
    await page.locator("#spaces").scrollIntoViewIfNeeded();

    await expect
      .poll(() =>
        page
          .getByRole("navigation", { name: "Primary" })
          .getByRole("link", { name: "Atmospheres" })
          .getAttribute("aria-current"),
      )
      .toBe("true");
  });

  test("links navigate to sections", async ({ page, isMobile }) => {
    await page.goto("/");
    // The desktop links are `md:flex`, so a phone reaches them through
    // the drawer instead — same destinations, different surface.
    if (isMobile) {
      await page.locator('button[aria-controls="mobile-nav"]').click();
    }
    const link = isMobile
      ? page.locator("#mobile-nav").getByRole("link", { name: "Atmospheres" })
      : page
          .getByRole("navigation", { name: "Primary" })
          .getByRole("link", { name: "Atmospheres" });
    await link.click();
    await expect(page.locator("#spaces")).toBeInViewport();
  });

  test("mobile drawer opens, and closes from its own toggle", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "overlay only renders below md");
    await page.goto("/");

    const toggle = page.locator('button[aria-controls="mobile-nav"]');
    await expect(toggle).toHaveAccessibleName("Open menu");

    await toggle.click();
    const drawer = page.locator("#mobile-nav");
    await expect(drawer).toBeVisible();
    await expect(toggle).toHaveAccessibleName("Close menu");

    // The toggle must sit *above* the open overlay, or the only way out
    // of the menu is a nav link. This was a real bug: the drawer and the
    // bar are siblings in the header's stacking context, so the bar
    // needs its own z-index.
    const box = (await toggle.boundingBox())!;
    const reached = await page.evaluate(
      ([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return !!el?.closest('button[aria-controls="mobile-nav"]');
      },
      [box.x + box.width / 2, box.y + box.height / 2],
    );
    expect(reached).toBe(true);

    await toggle.click();
    await expect(drawer).toBeHidden();
    await expect(toggle).toHaveAccessibleName("Open menu");
  });

  test("drawer closes on Escape and restores page scroll", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "overlay only renders below md");
    await page.goto("/");
    await page.locator('button[aria-controls="mobile-nav"]').click();
    await expect(page.locator("#mobile-nav")).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-nav")).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("the desktop CTA is not rendered on a phone", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "asserts mobile-only absence");
    await page.goto("/");
    await expect(
      page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: "Reserve a table" }),
    ).toBeHidden();
  });
});

test.describe("Mobile quick-action bar", () => {
  test("offers WhatsApp, Call and Directions on a phone", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "bar is md:hidden");
    await page.goto("/");

    const bar = page.getByRole("navigation", { name: "Quick actions" });
    await expect(bar).toBeVisible();

    await expect(bar.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/\d+\?text=.+/,
    );
    await expect(bar.getByRole("link", { name: "Call" })).toHaveAttribute(
      "href",
      /^tel:\+\d+$/,
    );
    await expect(bar.getByRole("link", { name: "Directions" })).toHaveAttribute(
      "href",
      /google\.com\/maps\/dir\/.+/,
    );
  });

  test("every tap target clears 48px", async ({ page, isMobile }) => {
    test.skip(!isMobile, "bar is md:hidden");
    await page.goto("/");
    const links = page
      .getByRole("navigation", { name: "Quick actions" })
      .getByRole("link");
    const boxes = await links.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      }),
    );
    expect(boxes).toHaveLength(3);
    for (const b of boxes) {
      expect(b.h).toBeGreaterThanOrEqual(48);
      expect(b.w).toBeGreaterThanOrEqual(48);
    }
  });

  test("is absent on desktop", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "asserts desktop-only absence");
    await page.goto("/");
    await expect(
      page.getByRole("navigation", { name: "Quick actions" }),
    ).toBeHidden();
  });
});

test.describe("Page health", () => {
  test("the directions URL spells Bageecha correctly", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: "Get Directions" });
    await expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=Hotel+Bagheecha+Virar",
    );
  });

  test("never scrolls horizontally", async ({ page }) => {
    await page.goto("/");
    // Walk the whole page — an overflow that only appears deep in the
    // document (a wide row, a negative margin) would be missed at the top.
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 600) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });

  test("every section's label sits on one rail", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "the rail collapses to a single column below lg");
    await page.goto("/");

    // The whole point of the 12-column grid: the section labels must
    // start on the same axis, or the page reads as a pile of unrelated
    // blocks.
    //
    // SEVEN LABELS, NOT SIX. One per section opener — hero, spaces,
    // menus, reviews, visit, reserve — plus the "From the kitchen"
    // kicker that heads the four-dish band inside `#menus`. That seventh
    // is deliberate: it is an eyebrow *inside* a section rather than at
    // its head, so if the rail only held for section openers it would
    // be the one that drifts. It measures 64px like the rest — the
    // same edge, not merely a legal one.
    //
    // Why the rail-filter: `#order` carries its own `.eyebrow` per
    // card ("Direct from the kitchen" / "On the app") which sit
    // inside the cards at column 5+, not on the rail. Counting them
    // would make the assertion meaningless; filtering for the rail
    // column counts only the section openers and the kitchen kicker.
    const edges = await page.evaluate(() =>
      Array.from(document.querySelectorAll("section .eyebrow"))
        .map((el) => Math.round(el.getBoundingClientRect().x))
        .filter((x) => x < 100),
    );
    expect(edges).toHaveLength(7);
    expect(new Set(edges).size).toBe(1);
  });

  test("headings sit on the content rail, with spaces on the label rail", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the rail collapses to a single column below lg");
    await page.goto("/");

    const { rail, menus, visit, reserve, spaces } = await page.evaluate(() => {
      const x = (sel: string) =>
        Math.round(document.querySelector(sel)!.getBoundingClientRect().x);
      return {
        rail: x("section .eyebrow"),
        menus: x("#menus h2"),
        visit: x("#visit h2"),
        reserve: x("#reserve h2"),
        spaces: x("#spaces h2"),
      };
    });

    // `#menus` opens on the standard section rail (column 5). `#visit`
    // and `#reserve` use the wider `WideSection` rail (column 2) so the
    // closing chapters can carry a 5xl heading without breaking the page
    // edge. The two opening patterns are deliberate; the assertion is
    // that each heading is inset from the label rail and that the
    // visit/reserve pair share their own edge.
    expect(menus).toBeGreaterThan(rail);
    expect(visit).toBeGreaterThan(rail);
    expect(reserve).toBeGreaterThan(rail);
    expect(visit).toBe(reserve);

    // `#spaces` is the one deliberate exception. It is an
    // asymmetric editorial spread rather than a rail-plus-content
    // section, so its heading sits *on* the label rail. That is a
    // considered shape and the reason this is asserted exactly rather
    // than tolerated as drift: if it moves, it should be because someone
    // meant it.
    expect(spaces).toBe(rail);
  });

  test("every masked line actually rises into view", async ({ page }) => {
    await page.goto("/");

    // The masked reveal is the page's one motion primitive, and it has a
    // failure mode that is completely silent: the inner span rests at
    // `translateY(110%)`, entirely outside its own `overflow-hidden`
    // parent, so the browser reports a zero-area intersection rect and an
    // IntersectionObserver on that span never fires. The text is then
    // invisible *forever* — it cannot come into view because it is
    // hidden, and it stays hidden because it never comes into view.
    //
    // That is not hypothetical; it shipped. `whileInView` was on the
    // inner span, and every masked element that starts fully clipped —
    // the spaces body copy, the menus lede, the visit rows —
    // stayed at `translateY(110%)` on desktop and on a phone alike. It
    // survived because `toContainText` matches hidden text, so the copy
    // assertions all passed while the section rendered as two bare
    // photographs. Only a look at the pixels caught it.
    //
    // So this asserts the rendered state, not the DOM: walk the whole
    // page the way a visitor does, then require every masked span to have
    // arrived at rest.
    // 500px steps rather than a fine-grained sweep. The budget is real —
    // the menu section alone is 358 printed lines, and a 250px walk over
    // the whole document now costs more than the test's timeout. It
    // cannot skip a reveal either: the viewport is 800px tall, so any
    // scroll position is inside at least one window of a 500px stride.
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 500) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(40);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // The longest reveal is 1.1s plus its delay, so give the last one
    // room to finish rather than racing it.
    await page.waitForTimeout(2000);

    const stuck = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll("main span.overflow-hidden > span"),
      )
        .filter((inner) => {
          // The scroll cue's champagne mark is a looping CSS animation
          // that owns its own transform and never rests — the one
          // exception, and it is not a reveal.
          if (inner.classList.contains("scroll-cue__mark")) return false;
          const t = getComputedStyle(inner).transform;
          return (
            t !== "none" && Math.abs(new DOMMatrixReadOnly(t).m42) > 1
          );
        })
        .map((inner) => (inner.textContent ?? "").trim().slice(0, 40)),
    );

    expect(stuck).toEqual([]);
  });

  test("no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
    expect(errors).toEqual([]);
  });
});
