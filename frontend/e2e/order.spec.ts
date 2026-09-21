import { test, expect, type Page } from "@playwright/test";

/**
 * `#order` — the chapter that converts.
 *
 * The Turn 9 polish broke the previous joined `rounded-2xl` 50/50
 * plate into two standalone editorial cards and swapped their order
 * (Direct first/left, Swiggy second/right). The interesting things to
 * test are the ones that silently rot:
 *
 *  - the cards must remain standalone — a regression that re-joins
 *    them into one wrapper (the `overflow-hidden rounded-2xl` plate
 *    from before) would pass every per-card assertion and lose the
 *    shape of the brief;
 *  - Direct sits on the LEFT at `lg`, not on the right — the previous
 *    version put Swiggy on the left and a future "tidy-up" that swaps
 *    the cards back into source order would re-introduce the exact
 *    hierarchy the brief rejected;
 *  - the Direct CTA opens a `wa.me` link with the brief's verbatim
 *    opener ("Hi Bageecha, I'd like to place an order."). A
 *    regression to the structured `WHATSAPP_ORDER_HREF` template
 *    would land a guest in a six-field form they have not asked for;
 *  - the Swiggy CTA opens the partner URL with `?source=sharing`
 *    intact — a regression to a generic Swiggy search would lose
 *    the partner attribution the channel asks for;
 *  - the delivery-radius note only renders when `SITE.deliveryRadius`
 *    is non-empty. Today the field is `""` and the line is absent;
 *    a regression that hardcodes a string and drops the `isFilled`
 *    guard would render a placeholder the owner has not approved.
 *
 * `#order` carries its own `.eyebrow` per card (inside the cards, past
 * the rail). The hero-rail test in `e2e/hero.spec.ts` filters them
 * out via `x < 100` and asserts the rail count without them; we do not
 * re-assert it here, an extra rail-positioned eyebrow would already
 * be red in that spec.
 */

const SECTION = "#order";

/**
 * Load the page and wait for it to be *interactive*, not merely loaded.
 *
 * Same gate as `e2e/reviews.spec.ts:open()` — `networkidle`, because
 * motion-driven cards that have not yet snapped to their resting
 * positions can confuse the bounding-box assertions below.
 */
async function open(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
}

test.describe("Order — two standalone cards", () => {
  test("the chapter renders two articles, not a joined rounded plate", async ({
    page,
  }) => {
    await open(page);

    // Two `<article>`s inside `#order`, one per card. A regression to
    // a single wrapper with two inner `<div>`s (the previous version's
    // shape) reads the same on the page but fails this — and that
    // shape is exactly the comparison-widget silhouette the brief
    // asks us to leave behind.
    const articles = page.locator(`${SECTION} article`);
    await expect(articles).toHaveCount(2);

    // Each card owns its chrome — its own border + its own radius.
    // The previous joined wrapper put `overflow-hidden rounded-2xl`
    // on the GRID, not on either half; the new cards put
    // `rounded-xs` (= 2px in Tailwind v4, the brief's "max 2px
    // radius") on each `article` and leave the grid square. If the
    // grid grows rounded chrome back, or the cards round themselves
    // into plates, this fails.
    for (let i = 0; i < 2; i += 1) {
      const card = articles.nth(i);
      const radius = await card.evaluate(
        (el) => window.getComputedStyle(el).borderTopLeftRadius,
      );
      // 2px at the brief's cap. Anything bigger means a plate crept
      // back (or `rounded-sm` snuck in, which is 4px in v4).
      expect(parseFloat(radius)).toBeLessThanOrEqual(2);
    }
  });

  test("Direct sits on the left, Swiggy on the right at lg", async ({
    page,
    isMobile,
  }) => {
    // The brief is explicit: Direct first/left, Swiggy second/right.
    // A future reorder that flips the source order (the obvious
    // "tidy-up") would put Swiggy back on the left and make the
    // third-party route look like the headline. This test pins the
    // left-to-right hierarchy at desktop.
    test.skip(!!isMobile, "the cards stack below lg");
    await open(page);

    const articles = page.locator(`${SECTION} article`);
    const leftX = await articles.nth(0).evaluate((el) =>
      Math.round(el.getBoundingClientRect().x),
    );
    const rightX = await articles.nth(1).evaluate((el) =>
      Math.round(el.getBoundingClientRect().x),
    );
    expect(leftX).toBeLessThan(rightX);

    // And the heading text pins which card is which — Direct carries
    // "Kitchen to your door.", Swiggy carries "Order on Swiggy.".
    await expect(articles.nth(0).locator("h3")).toHaveText(
      "Kitchen to your door.",
    );
    await expect(articles.nth(1).locator("h3")).toHaveText(
      "Order on Swiggy.",
    );
  });

  test("each card carries an eyebrow, an H3, a body, and a CTA", async ({
    page,
  }) => {
    await open(page);

    // Structural completeness — every card must have its four
    // elements. A regression that drops the eyebrow (the easy
    // thing to drop) would leave the card un-titled to a screen
    // reader.
    const articles = page.locator(`${SECTION} article`);
    for (let i = 0; i < 2; i += 1) {
      const card = articles.nth(i);
      await expect(card.locator(".eyebrow")).toBeVisible();
      await expect(card.locator("h3")).toBeVisible();
      await expect(card.locator("p")).not.toHaveCount(0);
      await expect(card.locator("a")).toBeVisible();
    }
  });

  test("the Direct CTA opens a wa.me link with the brief's opener", async ({
    page,
  }) => {
    await open(page);

    // `waLink("Hi Bageecha, I'd like to place an order.")` produces
    // a wa.me URL with the message encoded. A regression to the
    // structured `WHATSAPP_ORDER_HREF` template (Name / Address /
    // Order Details) would land a guest in a six-field form rather
    // than a friendly opener — and would silently cost conversions.
    const direct = page.locator(`${SECTION} article`).nth(0);
    const cta = direct.locator("a").first();
    const href = (await cta.getAttribute("href")) ?? "";
    expect(href).toMatch(/^https:\/\/wa\.me\/91\d{10}\?text=/);
    // The brief's opener, URL-encoded. Apostrophe is `%27`, comma is
    // `%2C`, space is `%20`.
    expect(href).toContain("Hi%20Bageecha");
    expect(href).toContain("place%20an%20order");
    // The CTA's visible label.
    await expect(cta).toContainText("Order on WhatsApp");
  });

  test("the Swiggy CTA opens the partner URL with source=sharing intact", async ({
    page,
  }) => {
    await open(page);

    const swiggy = page.locator(`${SECTION} article`).nth(1);
    const cta = swiggy.locator("a").first();
    const href = (await cta.getAttribute("href")) ?? "";
    // The partner asked for `?source=sharing` to attribute the
    // channel; a regression that shortens the URL would lose that
    // attribution and the partner's reporting.
    expect(href).toBe("https://www.swiggy.com/menu/1355572?source=sharing");
    await expect(cta).toContainText("Open Swiggy");
  });

  test("the delivery-radius note is hidden while the field is empty", async ({
    page,
  }) => {
    await open(page);

    // `SITE.deliveryRadius` is empty today (TODO(owner:)). The note
    // must hide itself via `isFilled()` rather than render a placeholder.
    // The note reads "Delivering within X." — if it appears at all the
    // guard has regressed. (When the owner fills the field, this test
    // needs to flip to a presence assertion; the comment in
    // `lib/constants/site.ts` notes the empty default.)
    const direct = page.locator(`${SECTION} article`).nth(0);
    await expect(direct.locator("text=Delivering within")).toHaveCount(0);
  });

  test("the Swiggy card uses the sand ground", async ({ page }) => {
    await open(page);

    // The new `--sand: #ede6da` primitive in globals.css. Plum type on
    // sand measures ~14:1, well above AA. A regression that drops back
    // to peach (the previous ground) or to cream (no contrast) breaks
    // either the visual rhythm or the contrast budget.
    const swiggy = page.locator(`${SECTION} article`).nth(1);
    const bg = await swiggy.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    // `rgb(237, 230, 218)` = #ede6da.
    expect(bg).toBe("rgb(237, 230, 218)");
  });
});
