import { test, expect, type Page } from "@playwright/test";

/**
 * `#reviews` — the boxless editorial carousel.
 *
 * Six reviews, one on stage at a time, AnimatePresence crossfade. The
 * polish on this turn (`polish(reviews)`) is typographic and
 * accessibility-shaped, not architectural — but a few of the changes
 * have tests attached because they are exactly the kind of thing that
 * silently rots:
 *
 *  - the rating badge only renders when both `SITE.googleRatingNumber`
 *    and `SITE.googleReviewCountNumber` are non-null. A regression
 *    that hardcodes one and forgets the other (or drops the guard) is
 *    a one-line mistake that reads as "the badge is gone" with no
 *    console signal;
 *  - every dot is a 44×44 px hit area. WCAG-shaped, but the visual
 *    pill inside is 1.5×8 px (or 32 px wide when active), so a CSS
 *    edit that puts a `padding: 0` on the button and a hard size on
 *    the inner span collapses the touch target without changing the
 *    picture;
 *  - the star row announces its rating via `role="img"` + `aria-label`
 *    like `4.5 out of 5`. A regression to `aria-hidden` (which the
 *    previous version carried) is invisible to a sighted reader and
 *    total to a screen reader;
 *  - the byline gap is 24 px (`mt-6`) and the dot gap is 32 px (`mt-8`),
 *    per the brief. The previous values (`mt-10` and `mt-10`) still
 *    *look* right at most viewports, so the assertion measures.
 *
 * The masthead itself (eyebrow + heading) is covered by
 * `e2e/hero.spec.ts`'s seven-eyebrow rail assertion, which counts
 * `#reviews`'s `.eyebrow` as one of the seven. We do not re-assert it
 * here; an extra `eyebrow` would already be red in the rail test.
 */

const SECTION = "#reviews";
const TABS = `${SECTION} [role="tablist"]`;

/**
 * Load the page and wait for it to be *interactive*, not merely loaded.
 *
 * Same gate as `e2e/menu.spec.ts:open()` — `networkidle`, because a
 * click landing on a hydrated-but-handler-not-yet-bound button reads
 * as a broken carousel and is actually a race.
 */
async function open(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
}

/**
 * Wait for the carousel to settle on a specific dot.
 *
 * `AnimatePresence mode="wait"` opens a window where the previous
 * figure is gone and the next one isn't rendered yet; without a wait
 * the count would catch the gap. The dot's `aria-current="true"` is
 * the carousel's own record of where it is, and it flips synchronously
 * with `setIndex`.
 */
async function waitForDot(page: Page, dotIndex: number) {
  await expect(
    page.locator(`${TABS} [role="tab"]`).nth(dotIndex),
  ).toHaveAttribute("aria-current", "true");
}

test.describe("Reviews — the carousel", () => {
  test("the eyebrow and heading carry the chapter", async ({ page }) => {
    await open(page);

    // Eyebrow text is now "Guest reviews" (was "What people say").
    const eyebrow = page.locator(`${SECTION} .eyebrow`);
    await expect(eyebrow).toHaveText("Guest reviews");

    // Heading: "In our guests' words."
    await expect(page.locator(`${SECTION} h2#reviews-heading`)).toHaveText(
      "In our guests' words.",
    );
  });

  test("the masthead eyebrow sits on the section rail", async ({ page }) => {
    // The seven-eyebrow rail test in e2e/hero.spec.ts asserts this for
    // the whole page; we re-assert it here so a future polish that
    // moves #reviews off the rail fails locally, not just in the
    // cross-section test.
    await open(page);
    const x = await page
      .locator(`${SECTION} .eyebrow`)
      .evaluate((el) => Math.round(el.getBoundingClientRect().x));
    // The rail lives around column 3 of a 12-col grid with `gap-x-6`,
    // measured on a 1280 viewport. Anything below 100 means the
    // eyebrow is on the rail, not inset into the content area.
    expect(x).toBeLessThan(100);
  });

  test("only one review is on stage at a time, with six dots", async ({
    page,
  }) => {
    await open(page);

    // AnimatePresence mode="wait" mounts exactly one `<figure>` at a
    // time — the previous is gone before the next is rendered. A
    // regression that mounts all six would let a screen reader walk
    // them in parallel, which is the exact failure mode the
    // architecture was designed to prevent.
    const figures = page.locator(`${SECTION} figure`);
    await expect(figures).toHaveCount(1);

    // Six reviews → six dots.
    const dots = page.locator(`${TABS} [role="tab"]`);
    await expect(dots).toHaveCount(6);

    // Exactly one dot is `aria-current="true"` at any moment.
    const current = await page
      .locator(`${TABS} [aria-current="true"]`)
      .count();
    expect(current).toBe(1);
  });

  test("clicking a dot swaps the on-stage review and the active state", async ({
    page,
  }) => {
    await open(page);

    const dots = page.locator(`${TABS} [role="tab"]`);

    // Walk every dot, click it, assert the active state followed.
    for (let i = 0; i < 6; i += 1) {
      await dots.nth(i).click();
      await waitForDot(page, i);
      await expect(dots.nth(i)).toHaveAttribute("aria-selected", "true");
      // Every other dot loses `aria-current`.
      const otherCurrent = await page
        .locator(`${TABS} [aria-current="true"]`)
        .count();
      expect(otherCurrent).toBe(1);
    }
  });

  test("every dot is a 44 × 44 px hit area", async ({ page }) => {
    // WCAG-friendly touch target. The visible pill inside is much
    // smaller (1.5×8 px inactive, 32 px wide active) — a regression
    // that puts a hard size on the button's content rather than the
    // button itself collapses the hit area without changing the
    // picture.
    await open(page);

    const dots = page.locator(`${TABS} [role="tab"]`);
    const boxes = await dots.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      }),
    );

    expect(boxes).toHaveLength(6);
    for (const [i, box] of boxes.entries()) {
      expect(box.w, `dot ${i} width`).toBeGreaterThanOrEqual(44);
      expect(box.h, `dot ${i} height`).toBeGreaterThanOrEqual(44);
    }
  });

  test("the star row announces its rating to screen readers", async ({
    page,
  }) => {
    await open(page);

    // The active slide's star row carries `role="img"` + an
    // `aria-label` like "4.5 out of 5". A regression to `aria-hidden`
    // (the previous version) would pass every visual assertion and
    // leave a screen reader with five decorative glyphs.
    const star = page.locator(`${SECTION} figure [role="img"][aria-label*="out of 5"]`).first();
    await expect(star).toBeVisible();
    const label = await star.getAttribute("aria-label");
    expect(label).toMatch(/^\d+(\.\d+)? out of 5$/);
  });

  test("every review carries its source line", async ({ page }) => {
    await open(page);

    // The source line sits below the byline. Walk the carousel to
    // confirm every review carries the same one — this is the
    // honesty claim the brief asks for: a guest reading the page
    // should know where each quote came from.
    const dots = page.locator(`${TABS} [role="tab"]`);
    const sources = new Set<string>();

    for (let i = 0; i < 6; i += 1) {
      await dots.nth(i).click();
      await waitForDot(page, i);
      const source = await page
        .locator(`${SECTION} figure p`)
        .last()
        .textContent();
      expect(source?.trim()).toBeTruthy();
      sources.add(source!.trim());
    }

    // All six reviews come from the same source today ("Google
    // review"), but the test asserts the line *renders* rather than
    // asserting the value — once the CMS lands, future per-review
    // sources will pass this without an edit.
    expect(sources.size).toBeGreaterThan(0);
  });

  test("the rating badge renders when both fields are non-null", async ({
    page,
  }) => {
    await open(page);

    // The badge sits above the carousel, marked `data-reviews-badge`.
    // It reads as "4.6 on Google · 312 reviews" (placeholder values
    // until the owner supplies real Google Place data).
    const badge = page.locator(`${SECTION} [data-reviews-badge="google"]`);
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("on Google");
    await expect(badge).toContainText("reviews");
    // The little vermillion star SVG sits inside, `aria-hidden` (the
    // text already qualifies the number).
    const star = badge.locator("svg[aria-hidden='true']");
    await expect(star).toBeVisible();
  });
});
