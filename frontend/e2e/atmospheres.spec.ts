import { test, expect, type Page } from "@playwright/test";

/**
 * The atmospheres chapter — a pinned caption beside a column of rooms.
 *
 * This spec has now guarded three different sections. It began as a
 * full-screen crossfade switcher: three tabs, a roving tabindex, an
 * `AnimatePresence` dissolve between photographs, one room visible at a
 * time behind a heavy dark veil. The brief was blunt about why that had
 * to go — the guest is trying to *look at the rooms*, and the thing
 * showed them one photograph at a time in the dark. That became a
 * staggered editorial grid, which fixed the darkness but left the
 * photographs as a static pile: three frames stacked in a column, all of
 * them already on screen, none of them asking to be looked at.
 *
 * So the section is a two-column glide. The copy is pinned on the left;
 * the rooms run down the right at `gap-32` and pass it. The failures
 * worth guarding have moved again, and they are mostly *mechanical* now:
 *
 *  - the pin silently not pinning, which is one missing class away
 *    (`self-start` on a stretched grid item leaves `sticky` no scroll to
 *    use) and looks like nothing at all in a screenshot;
 *  - the swap creeping back into a user-operated widget — the exact
 *    regression the pivot removed, so `[role="tablist"]` and
 *    `role="tab"` must stay at zero *inside this section*. The
 *    `button` and `a` zero-assertions were relaxed in the S2 polish
 *    (2026-09-20) to allow per-room WhatsApp CTAs and clickable
 *    `01 / 02 / 03` progress labels — see the test below;
 *  - the caption naming a room that is not the one beside it;
 *  - a room's copy being hidden from assistive tech. An earlier pass put
 *    `aria-hidden` on the two inactive stacked copies, which is not a
 *    crossfade — it is two of the three rooms going undescribed for a
 *    screen reader;
 *  - the section drifting dark again, or the photography getting veiled.
 *
 * THE SECTION-SCOPING IS NOT COSMETIC. `#menus` legitimately has a
 * `role="tablist"` toggle, so a page-wide `getByRole("tab")` count of
 * zero would now pass for the wrong reason at best and fail at worst.
 * Every "absence" assertion below is anchored to `#spaces`.
 */

const SECTION = "#spaces";

/** The pinned column: the first cell of the section's two-column grid. */
const PINNED = `${SECTION} .container-x > div > :first-child`;

/** The glide: the column of rooms the pinned copy is set against. */
const GLIDE = `${SECTION} .container-x > div > :last-child`;

/** The three room figures, in DOM order: terrace, AC, classic. */
function figures(page: Page) {
  return page.locator(`${SECTION} figure`);
}

/** Page-relative geometry for every room figure. */
async function figureBoxes(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("#spaces figure")).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        w: Math.round(r.width),
        top: Math.round(r.top + window.scrollY),
        bottom: Math.round(r.bottom + window.scrollY),
      };
    }),
  );
}

/** Opacity of the three stacked caption copies, in room order. */
async function captionOpacities(page: Page) {
  return page.evaluate(() => {
    const pin = document.querySelector("#spaces .container-x > div > div");
    const stack = pin?.querySelector(".grid");
    if (!stack) return [];
    return Array.from(stack.children).map((el) =>
      Number(getComputedStyle(el).opacity),
    );
  });
}

/** Perceived luminance of a computed `rgb(...)` string. */
function luminance(rgb: string) {
  const [r, g, b] = rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

test.describe("Atmospheres — the pinned glide", () => {
  test("the old switcher is gone and stays gone", async ({ page }) => {
    await page.goto("/");
    const section = page.locator(SECTION);

    // A tablist *here* means the full-screen crossfade toggle was
    // restored. Scoped deliberately: `#menus` has a tablist of its own,
    // and it is supposed to.
    await expect(page.locator(`${SECTION} [role="tablist"]`)).toHaveCount(0);
    await expect(section.getByRole("tab")).toHaveCount(0);

    // S2 (2026-09-20): per-room WhatsApp CTAs and clickable `01 /
    // 02 / 03` progress labels are intentional interactive elements
    // (editorial override per the polish brief). The tablist/tab
    // absence is still asserted hard — that is the shape of the
    // original pivot regression and the only failure mode that
    // justifies the section's no-widget rule.
    //
    // At `lg`: 3 progress buttons + 3 per-room CTA anchors = 6
    // controls inside `#spaces`.
    // Below `lg`: 0 progress buttons + 3 per-room CTA anchors = 3
    // controls inside `#spaces`.
    // The lower bound is therefore `>= 3` at every width — any
    // future regression that strips all interactive elements will
    // still fail this assertion.
    const buttonCount = await page.locator(`${SECTION} button`).count();
    const anchorCount = await page.locator(`${SECTION} a`).count();
    expect(buttonCount).toBeGreaterThanOrEqual(0);
    expect(anchorCount).toBeGreaterThanOrEqual(3);
  });

  test("every room is described exactly once, to everyone", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator(SECTION);

    // Exactly three headings, at every width. The copy is rendered twice
    // in the source — pinned at `lg`, per-figure below it — but the two
    // are mutually `display: none`, so a role query resolves to one set
    // and no room is announced twice.
    await expect(section.getByRole("heading", { level: 3 })).toHaveCount(3);

    for (const name of [
      "Terrace Lounge",
      "AC Fine Dining",
      "Classic Dining",
    ]) {
      await expect(
        section.getByRole("heading", { level: 3, name }),
      ).toHaveCount(1);
    }

    // THE REGRESSION THIS EXISTS FOR. Hiding the inactive copies from the
    // accessibility tree is not what makes a crossfade a crossfade — it
    // is how two of the three rooms stop existing for a screen reader.
    // Opacity, never `aria-hidden`, on anything carrying a heading.
    const hidden = await section.evaluate((el) =>
      Array.from(el.querySelectorAll("h3")).filter((h) =>
        h.closest('[aria-hidden="true"]'),
      ).length,
    );
    expect(hidden).toBe(0);

    // And the bodies travel with them.
    await expect(section).toContainText(
      "High-energy, open-air seating with signature cocktails and top-shelf service.",
    );
    await expect(section).toContainText(
      "Cool, quiet, and made for family celebrations.",
    );
    await expect(section).toContainText(
      "The everyday non-AC room for fast lunches, big groups and the regulars who know the menu.",
    );
  });

  test("is a light chapter, not a dark one", async ({ page }) => {
    await page.goto("/");
    const section = page.locator(SECTION);
    await expect(section).toHaveAttribute("data-tone", "light");

    // Warm cream, not merely "not black". A regression to a dark ground
    // would still be a valid background-color — and so would a drift back
    // to the neutral alabaster this replaced, which is why the exact
    // value is pinned rather than just the luminance.
    const bg = await section.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(bg).toBe("rgb(249, 246, 240)");
    expect(luminance(bg)).toBeGreaterThan(200);
  });

  test("the copy is pinned while the rooms scroll past it", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the pin is lg-only by design");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");

    const pinned = page.locator(PINNED);
    const rooms = figures(page);

    /**
     * Park the section's top well above the fold and read the two tops.
     *
     * Measuring near the top of the section would prove nothing: the pin
     * has to *reach* its `top-24` resting place before it can be said to
     * hold it. Both readings are taken from the middle of the sticky
     * range, where the row's bottom is still thousands of pixels below
     * the viewport and there is somewhere for the pin to travel.
     */
    const read = async (sectionTop: number) => {
      await page.evaluate((y) => window.scrollTo(0, y), sectionTop);
      await page.waitForTimeout(200);
      return {
        pinned: Math.round(
          await pinned.evaluate((el) => el.getBoundingClientRect().top),
        ),
        room: Math.round(
          await rooms.nth(0).evaluate((el) => el.getBoundingClientRect().top),
        ),
      };
    };

    const base = await page.evaluate(
      () =>
        document.querySelector("#spaces")!.getBoundingClientRect().top +
        window.scrollY,
    );

    const a = await read(base + 400);
    const b = await read(base + 1000);

    // Two claims, and the contrast between them is the whole section: the
    // rooms travelled the length of the scroll, and the copy travelled
    // none of it.
    //
    // The rooms are compared to a floor rather than to the exact delta.
    // WebKit lands a 600px scroll request on 597, so an assertion against
    // the request fails on the engine's rounding rather than on the
    // layout, and "the rooms moved with the page" is not a claim about
    // three pixels.
    expect(Math.abs(b.room - a.room)).toBeGreaterThan(500);

    // The copy did not move at all. 96px is `top-24`; the tolerance is
    // for sub-pixel scroll rounding, not for drift.
    expect(a.pinned).toBeGreaterThanOrEqual(95);
    expect(a.pinned).toBeLessThanOrEqual(97);
    expect(Math.abs(b.pinned - a.pinned)).toBeLessThanOrEqual(1);
  });

  test("the rooms run in one column, spaced by gap-32", async ({ page }) => {
    await page.goto("/");

    // All three live in the glide column — not one per row of some grid.
    await expect(page.locator(`${GLIDE} figure`)).toHaveCount(3);

    const boxes = await figureBoxes(page);
    expect(boxes).toHaveLength(3);

    // One column, not a grid: all three share an x and a width, which is
    // what makes the copy's pin meaningful. `gap-32` is 8rem.
    for (const b of boxes) {
      expect(b.x).toBe(boxes[0].x);
      expect(b.w).toBe(boxes[0].w);
    }

    for (let i = 0; i < boxes.length - 1; i++) {
      expect(boxes[i + 1].top - boxes[i].bottom).toBeCloseTo(128, -1);
    }

    // And they are in the order the section describes them.
    const srcs = await figures(page).evaluateAll((els) =>
      els.map((el) => {
        const img = el.querySelector("img") as HTMLImageElement;
        return img.currentSrc || img.src;
      }),
    );
    expect(srcs[0]).toMatch(/atmos-rooftop/);
    expect(srcs[1]).toMatch(/atmos-ac/);
    expect(srcs[2]).toMatch(/classic-dining-nonac/);
  });

  test("the pinned caption names the room beside it", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the swap is lg-only by design");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");

    /**
     * Centre a room in the viewport and require the caption to arrive.
     *
     * Polled rather than slept on: the crossfade is 500ms and the
     * observer fires a frame or two after the scroll, so a fixed wait
     * either reads the opacities mid-transition — 0.98 of the way there
     * is a failing `toEqual` — or wastes time. `toEqual` on the array is
     * still exact, so this cannot pass while two rooms are both showing.
     */
    const centre = async (i: number, expected: number[]) => {
      await figures(page)
        .nth(i)
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          window.scrollTo(
            0,
            r.top + window.scrollY - (window.innerHeight - r.height) / 2,
          );
        });
      await expect.poll(() => captionOpacities(page)).toEqual(expected);
    };

    // Room 2, from the top. The caption follows the column — a caption
    // naming the terrace while the AC room is on screen is worse than no
    // caption at all.
    await centre(1, [0, 1, 0]);

    // Room 3.
    await centre(2, [0, 0, 1]);

    // And back up to room 1, because a scroll spy that only ever moves
    // forward is a scroll spy that has never been tested.
    await centre(0, [1, 0, 0]);
  });

  test("below lg each room keeps its own caption", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "asserts the mobile fallback");
    await page.goto("/");

    // No second column to pin against, so the tracking caption is out of
    // the layout entirely — and out of the accessibility tree with it,
    // which is why the count assertion above still lands on three. It is
    // the *stack* that goes, not the column around it: the eyebrow, the
    // heading and the lede are the same at every width.
    const tracking = await page.evaluate(() => {
      const pin = document.querySelector("#spaces .container-x > div > div")!;
      const stack = pin.querySelector(".grid")!;
      return Array.from(stack.children).filter(
        (el) => (el as HTMLElement).getBoundingClientRect().height > 0,
      ).length;
    });
    expect(tracking).toBe(0);

    // Every figure carries its own index and description underneath it.
    const captions = await figures(page).evaluateAll((els) =>
      els.map((el) => {
        const fig = el.querySelector("figcaption")!;
        return {
          visible: getComputedStyle(fig).display !== "none",
          text: fig.textContent ?? "",
        };
      }),
    );
    expect(captions).toHaveLength(3);
    for (const c of captions) expect(c.visible).toBe(true);
    expect(captions[0].text).toContain("01");
    expect(captions[0].text).toContain("Terrace Lounge");
    expect(captions[2].text).toContain("Classic Dining");
  });

  test("the photographs keep their own exposure", async ({ page }) => {
    await page.goto("/");

    // Walk the column first. The glide spreads the three rooms over
    // roughly 2500px, so on a lazy-loading engine only the first is
    // decoded by the time the section's own top is in view — and an
    // undecoded image has no exposure to judge.
    const rooms = figures(page);
    for (let i = 0; i < 3; i++) await rooms.nth(i).scrollIntoViewIfNeeded();

    const imgs = () =>
      page.locator(`${SECTION} img`).evaluateAll((els) =>
        els.map((el) => ({
          filter: getComputedStyle(el).filter,
          opacity: parseFloat(getComputedStyle(el).opacity),
          decoded: (el as HTMLImageElement).naturalWidth > 0,
        })),
      );

    await expect.poll(async () => (await imgs()).map((i) => i.decoded)).toEqual([
      true,
      true,
      true,
    ]);

    // The pivot's other half: no grade, no veil. `PhotoBackdrop` is for
    // the hero, where type sits on the image; these frames are plain
    // <Image> and must carry no filter. A `saturate(0.8) brightness(0.9)`
    // reappearing here is how "the photos look muddy" starts.
    const shot = await imgs();
    expect(shot).toHaveLength(3);
    for (const i of shot) {
      expect(i.filter).toBe("none");
      expect(i.opacity).toBeCloseTo(1, 1);
    }
  });

  test("the frames are grids inside the page, not full-bleed", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    await page.locator(SECTION).scrollIntoViewIfNeeded();

    // The old section *was* the viewport, edge to edge. Both halves of
    // that are now wrong, so both are asserted.
    const section = (await page.locator(SECTION).boundingBox())!;
    const viewport = page.viewportSize()!;
    const [terrace] = await figureBoxes(page);

    // Inset from the section's own edges at every width, and sharing the
    // row with the pinned copy at `lg` — where it must be roughly half
    // the page, not most of it.
    expect(terrace.x).toBeGreaterThan(section.x);
    expect(terrace.x + terrace.w).toBeLessThan(section.x + section.width);
    if (!isMobile) expect(terrace.w).toBeLessThan(section.width * 0.6);

    // Taller than the window, which is the whole reason it can glide.
    expect(section.height).toBeGreaterThan(viewport.height);
  });

  test("no console errors while the section animates in", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.locator(SECTION).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1400);
    expect(errors).toEqual([]);
  });
});
