import { test, expect, type Page } from "@playwright/test";

import { BAR, FOOD, MENU_LINE_COUNT } from "../lib/constants/menu";

/**
 * The four dishes the kitchen opens with.
 *
 * THIS NUMBER IS TRANSCRIBED, UNLIKE EVERY OTHER EXPECTATION IN THIS
 * FILE, and the reason is a hard constraint rather than a preference.
 * `lib/constants/images.ts` binds each dish to a `next/image` *static
 * import*, which is a webpack feature: importing that module from a
 * Playwright spec hands the raw bytes of a JPEG to Node's loader, which
 * fails with `Unexpected character` before a single test is collected.
 * The alternative — a second, image-free copy of the dish list — would
 * put the alt text in two places and defeat the point.
 *
 * So the count lives here, and the two things it guards are worth the
 * transcription: a fifth dish appearing in `FEATURED_DISHES` without
 * anyone deciding where it goes is a red test, and so is a blank alt.
 */
const DISH_COUNT = 4;

/**
 * `#menus` — the two books.
 *
 * This is the only section on the page that changes its own ground, and
 * the only one with a widget. Both are deliberate, and both are the kind
 * of thing that decays quietly:
 *
 *  - the toggle is a real `tablist`. Two `<button>`s that happen to sit
 *    next to each other would look identical and be unusable from a
 *    keyboard, so the roles, the roving `tabIndex`, the arrow keys and
 *    the `aria-controls`/`aria-labelledby` pair are all asserted;
 *  - the sliding indicator is **one** element that moves. Re-rendering a
 *    filled background into each tab in turn is the same picture and a
 *    different component — the `layoutId` is what makes the switch feel
 *    like a physical object, so the test counts the fill rather than
 *    looking at it;
 *  - the ground flips cream → plum. A regression to a dark kitchen, or a
 *    bar that stayed light, is the pivot undone;
 *  - the kitchen carries **exactly four images** — the property's own
 *    photographs of its own dishes, one per chapter, above the printed
 *    card and never inside it. This assertion was inverted from "no
 *    images at all" when the client supplied the dishes; the `figure`
 *    ban that sat beside it survives untouched, because a new `figure`
 *    here breaks the bar book's structural count as well;
 *  - the bar's three back-bar frames are *dividers between lists*, not a
 *    gallery at the top. That is a structural claim, so it is asserted
 *    structurally — each frame sits between two categories.
 *
 * The data is imported rather than transcribed a second time. A menu is
 * the one place where a test that hardcodes its expectations is worse
 * than no test: it would pass while the page showed last week's prices.
 */

const SECTION = "#menus";
const TABS = `${SECTION} [role="tablist"]`;
const PANEL = "#menu-panel";

/**
 * Load the page and wait for it to be *interactive*, not merely loaded.
 *
 * `page.goto` resolves on `load`, which says the HTML and its bundle have
 * arrived — not that React has hydrated. On this page the menu alone is
 * 358 rows, and under parallel workers a click could land on a real,
 * visible, enabled toggle button with no handler bound yet: the tab
 * stayed `aria-selected`, the ground stayed light, and five seconds later
 * the test failed looking exactly like a broken toggle. It was never the
 * toggle. The tests that happened to make an assertion or two before
 * clicking never lost the race; the ones that clicked straight out of
 * `goto` lost it about one run in two.
 *
 * Waiting for network idle is the honest gate — by then the client
 * bundle has been fetched and executed — and unlike a retry loop it
 * cannot paper over a click that is genuinely swallowed.
 */
async function open(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
}

function tab(page: Page, id: "kitchen" | "bar") {
  return page.locator(`#tab-${id}`);
}

/**
 * A bar category's measure matrix — the `md`-and-up rendering.
 *
 * Every bar category renders its pours **twice**: a five-column matrix
 * for wide screens and a labelled stack for phones, with one of the two
 * `display: none` at any width. Both are in the DOM at all times, so a
 * bare `#menu-cat-vodka li` matches rows from both and reads a wall of
 * zero-width rectangles off the hidden one. The matrix is first in
 * document order.
 */
function matrix(page: Page, id: string) {
  return page.locator(`#menu-cat-${id} ul`).first();
}

/** The narrow rendering of the same category. */
function stack(page: Page, id: string) {
  return page.locator(`#menu-cat-${id} ul`).last();
}

/** Flip the section to the bar and wait for the ground to follow. */
async function openBar(page: Page) {
  await tab(page, "bar").click();
  await expect(page.locator(SECTION)).toHaveAttribute("data-tone", "dark");
  await expect(page.locator("#menu-cat-vodka")).toBeVisible();
}

/** Perceived luminance of a computed `rgb(...)` string. */
function luminance(rgb: string) {
  const [r, g, b] = rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The desktop index — four categories, the active one opened to its groups. */
function rail(page: Page) {
  return page.locator('nav[aria-label="Menu categories"]');
}

/** One category's `<li>` in that index: its button, then its group buttons. */
function railItem(page: Page, categoryIndex: number) {
  return rail(page).locator("> ul > li").nth(categoryIndex);
}

/**
 * Turn to a page and wait until it has actually arrived.
 *
 * The wait is not politeness. The page turn is an `AnimatePresence` in
 * `mode="wait"`, so between the click and the new page there is a window
 * where the old rows have gone and the new ones are not there yet — a
 * bare `count()` taken in that window reads zero and looks like a lost
 * page. Gating on the heading is the honest signal: the panel's `<h3>`
 * is the page's own title, so when it reads the group's name the turn is
 * finished.
 */
async function turnTo(page: Page, categoryIndex: number, groupIndex: number) {
  const cat = FOOD[categoryIndex];
  const group = cat.groups[groupIndex];
  const li = railItem(page, categoryIndex);

  // The category opens its groups; only the active `<li>` has them, so
  // this is also what makes `.nth(groupIndex + 1)` mean anything.
  await li.getByRole("button").first().click();
  await li.getByRole("button").nth(groupIndex + 1).click();

  await expect(page.locator(`#menu-cat-${cat.id} h3`)).toHaveText(group.name);
  return { cat, group };
}

/**
 * The phone's compact index — a scrolling rail of the four categories,
 * pinned under the header. Not a landmark and not the same element as
 * the desktop index: `menu.spec.ts` counts `li`s under
 * `nav[aria-label="Menu categories"]` and reads each count badge off
 * `span[1]`, so a second `nav` with that label would double the count and
 * a second set of group buttons inside it would push the wrong span into
 * slot one.
 *
 * IT USED TO BE LOCATED STRUCTURALLY — `div:has(> ul)`, "the only box in
 * the panel that is a div with a `<ul>` of its own". That stopped being
 * true the moment the kitchen grew its four-dish band: the band's grid
 * is also a `<ul>` inside a `div`, and the structural locator silently
 * matched *it* instead — a locator that resolves to the wrong element is
 * worse than one that resolves to nothing, because the assertions
 * downstream then measure a rail that is not a rail. Hence the
 * `data-menu-rail` hook in `Menu.tsx`: a stable name, so a future `<ul>`
 * in this panel cannot hijack the phone index again.
 */
function compactRail(page: Page) {
  return page.locator(`${PANEL} [data-menu-rail="mobile"]`);
}

/**
 * The phone's pager: the counter between PREV and NEXT, at the foot of
 * the panel. It is `lg:hidden`, so on a laptop this resolves to nothing
 * and its own test skips.
 */
function pagerCounter(page: Page) {
  return page.locator(`${PANEL} > div > div > div > section + div > span`);
}

/**
 * The bar's atmosphere plate — the framed back-bar shot in the left rail.
 *
 * Located as the panel's one `aria-hidden` `<div>`, which is not a
 * guess: the plate is the only box on either book that is hidden from
 * the accessibility tree, because it is the only element either book
 * renders that carries no fact. Every other `aria-hidden` in the panel
 * is a `<span>` (the caption scrims) or an `<svg>` (the glyphs).
 */
function plate(page: Page) {
  return page.locator(`${PANEL} div[aria-hidden="true"]`);
}

/**
 * The plate's caption — the last `span` in each crossfading layer.
 *
 * `.last()` is not sloppy here, it is the point: while a crossfade is in
 * flight there are two layers, and `AnimatePresence` appends the
 * incoming one, so the last label in the DOM is the one arriving. Read
 * at rest it is simply the only one.
 */
function plateLabel(page: Page) {
  return plate(page).locator("> div > span:last-child").last();
}

/** How many columns the browser actually laid the current page out in. */
async function pageColumns(page: Page) {
  return page.locator(`${PANEL} section > div > div > ul`).evaluate((el) => {
    const c = getComputedStyle(el.parentElement!).columnCount;
    return c === "auto" ? 1 : Number(c);
  });
}

test.describe("Menus — the toggle", () => {
  test("is a tablist, not two buttons that look like one", async ({ page }) => {
    await open(page);

    const list = page.locator(TABS);
    await expect(list).toHaveAttribute(
      "aria-label",
      "Menu — the kitchen or the bar",
    );
    await expect(list.getByRole("tab")).toHaveCount(2);

    // The kitchen is the card the page opens on.
    await expect(tab(page, "kitchen")).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, "bar")).toHaveAttribute("aria-selected", "false");

    // Both tabs drive the same panel, and the panel names itself from
    // whichever tab is current — so a screen reader announcing the panel
    // says "The Kitchen", not "tabpanel".
    await expect(tab(page, "kitchen")).toHaveAttribute(
      "aria-controls",
      "menu-panel",
    );
    await expect(tab(page, "bar")).toHaveAttribute(
      "aria-controls",
      "menu-panel",
    );
    const panel = page.locator(PANEL);
    await expect(panel).toHaveAttribute("role", "tabpanel");
    await expect(panel).toHaveAttribute("aria-labelledby", "tab-kitchen");

    await openBar(page);
    await expect(page.locator(PANEL)).toHaveAttribute(
      "aria-labelledby",
      "tab-bar",
    );
  });

  test("keeps one tab in the tab order, not two", async ({ page }) => {
    await open(page);
    // Roving `tabIndex`: Tab reaches the group once, arrows move within
    // it. Two tab stops for one control is the classic half-built toggle.
    await expect(tab(page, "kitchen")).toHaveAttribute("tabindex", "0");
    await expect(tab(page, "bar")).toHaveAttribute("tabindex", "-1");

    await openBar(page);
    await expect(tab(page, "kitchen")).toHaveAttribute("tabindex", "-1");
    await expect(tab(page, "bar")).toHaveAttribute("tabindex", "0");
  });

  test("arrow keys move between the two books", async ({ page }) => {
    await open(page);
    await tab(page, "kitchen").focus();

    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "bar")).toHaveAttribute("aria-selected", "true");
    // ...and focus travels with it, so the next Tab does not go backwards.
    await expect(tab(page, "bar")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(tab(page, "kitchen")).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, "kitchen")).toBeFocused();
  });

  test("the indicator is one element that moves", async ({ page }) => {
    await open(page);
    const list = page.locator(TABS);
    const fill = list.locator("span.bg-action");

    // One fill, in the selected tab, and none in the other.
    await expect(fill).toHaveCount(1);
    await expect(tab(page, "kitchen").locator("span.bg-action")).toHaveCount(1);
    await expect(tab(page, "bar").locator("span.bg-action")).toHaveCount(0);

    // It is still one element afterwards — a component that re-rendered
    // the fill into each tab in turn would be indistinguishable in a
    // screenshot and is the thing this guards.
    await openBar(page);
    await expect(fill).toHaveCount(1);
    await expect(tab(page, "bar").locator("span.bg-action")).toHaveCount(1);
    await expect(tab(page, "kitchen").locator("span.bg-action")).toHaveCount(0);
  });

  test("only one book is mounted at a time", async ({ page }) => {
    await open(page);
    // 358 printed lines across two books. Rendering both and hiding one
    // would double the section's DOM to save nothing.
    await expect(page.locator("#menu-cat-starters")).toBeAttached();
    await expect(page.locator("#menu-cat-vodka")).toHaveCount(0);

    await openBar(page);
    await expect(page.locator("#menu-cat-vodka")).toBeAttached();
    await expect(page.locator("#menu-cat-starters")).toHaveCount(0);
  });
});

test.describe("Menus — the ground", () => {
  test("the kitchen is cream and the bar turns the lights off", async ({
    page,
  }) => {
    await open(page);
    const section = page.locator(SECTION);

    await expect(section).toHaveAttribute("data-tone", "light");
    const light = await section.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    // Warm cream #F9F6F0, not the neutral alabaster #F7F5F0 it replaced.
    // The difference is three points of red and one of blue, which is
    // invisible in a screenshot and is the entire point of the overhaul:
    // a chosen ground reads as paper, a neutral one reads as a default.
    expect(light).toBe("rgb(249, 246, 240)");
    expect(luminance(light)).toBeGreaterThan(200);

    // The flip is animated, not a cut. `data-tone` re-maps every semantic
    // token at once, so this one property is the whole colour system.
    await expect
      .poll(() => section.evaluate((el) => getComputedStyle(el).transitionDuration))
      .toContain("0.5s");

    await openBar(page);

    // Polled, not read once. `data-tone` flips the instant the outgoing
    // list finishes its exit, and the colour then *starts* its 500ms
    // transition — so a single read lands a few percent of the way there
    // and reports alabaster. This is the same trap the header's frost
    // test documents.
    await expect
      .poll(() =>
        section.evaluate((el) => getComputedStyle(el).backgroundColor),
      )
      .toBe("rgb(36, 11, 20)");
    expect(luminance("rgb(36, 11, 20)")).toBeLessThan(60);
  });

  test("type follows the ground, and stays legible on both", async ({
    page,
  }) => {
    await open(page);

    const dish = page
      .locator("#menu-cat-starters li.items-baseline span")
      .first();
    const pour = matrix(page, "vodka").locator("li span").first();

    // Read a dish name on alabaster: dark type.
    const onLight = await dish.evaluate((el) => getComputedStyle(el).color);
    expect(luminance(onLight)).toBeLessThan(90);

    // Text colour transitions with the ground, so it is polled for the
    // same reason the background is.
    await openBar(page);
    await expect
      .poll(async () => luminance(await pour.evaluate(
        (el) => getComputedStyle(el).color,
      )))
      .toBeGreaterThan(180);

    // And the section's own transition is what carries the change.
    await expect(page.locator(SECTION)).toHaveCSS(
      "transition-duration",
      "0.5s",
    );
  });

  test("the kitchen opens with the four real dishes, and nothing else", async ({
    page,
  }) => {
    await open(page);

    // THIS TEST IS THE OPPOSITE OF THE ONE IT REPLACES, and deliberately
    // rather than reluctantly. It used to assert that the kitchen carried
    // *no* images — "the brief was explicit: purely typographic. A
    // photograph creeping into the food card is the whole section
    // reverting to a gallery." That brief was real and it was superseded:
    // the property shot four of its own dishes and sent them in, and the
    // client asked for them to be shown. An inverted assertion is not a
    // relaxed one — it is the same guard pointing the other way, and it
    // still fails if a *twenty-third* photograph appears.
    //
    // Exactly four, from the registry rather than transcribed, so
    // adding a fifth dish to `FEATURED_DISHES` without deciding where it
    // goes is a red test rather than a silent layout change.
    await expect(page.locator(`${PANEL} img`)).toHaveCount(DISH_COUNT);

    // The ban on `<figure>` survives the inversion untouched, and it is
    // the half that matters. A `<figure>` in this panel is not a styling
    // choice: `menu.spec.ts` walks `#menu-panel` for `"section, figure"`
    // and expects `BAR.length + 3`, so one new `figure` both inflates
    // that count and breaks an unrelated assertion in the bar book. The
    // dishes are framed in a plain `div` for exactly that reason.
    await expect(page.locator(`${PANEL} figure`)).toHaveCount(0);

    // Every one of the four has a real description. These are content,
    // not backdrop — the same four files appear `alt=""` in the hero and
    // are described here, which is where a reader meets them one at a
    // time. A blank alt on the visible card is the regression.
    for (let i = 0; i < DISH_COUNT; i++) {
      const img = page.locator(`${PANEL} img`).nth(i);
      const alt = await img.getAttribute("alt");
      expect(alt, `dish ${i} has no alt text`).toBeTruthy();
      expect((alt ?? "").length).toBeGreaterThan(30);
    }

    // And they are *above* the printed card, not inside it. The dishes
    // head the chapter; illustrating the price list itself is how a
    // restaurant menu turns into a delivery app, and it is one nesting
    // edit away at all times.
    for (let i = 0; i < DISH_COUNT; i++) {
      expect(
        await page
          .locator(`${PANEL} img`)
          .nth(i)
          .evaluate((el) => el.closest("section[id^='menu-cat-']") === null),
        `dish ${i} is inside a menu category section`,
      ).toBe(true);
    }
  });
});

test.describe("Menus — the kitchen list", () => {
  test("renders every category and every line the card printed", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the index is lg-only; the phone's pager is below");
    await open(page);

    // The lede's line count is derived from the same arrays the list is
    // built from, so a dish added to the data and not the page — or the
    // reverse — cannot pass.
    await expect(page.locator(SECTION)).toContainText(
      `${MENU_LINE_COUNT} lines`,
    );

    // Every page, in order, asserting each one carries exactly its own
    // group's rows and nothing else. This is a stronger claim than the
    // flat total it replaces: the flat total would still pass if the book
    // showed one group twice and dropped another, and paging is exactly
    // the mechanism that could do that.
    let seen = 0;
    let pages = 0;

    for (const [ci, cat] of FOOD.entries()) {
      for (const [gi, group] of cat.groups.entries()) {
        const turned = await turnTo(page, ci, gi);
        expect(turned.group.id).toBe(group.id);
        pages += 1;

        // Exactly one category is mounted at a time — the other three are
        // not hidden, they are absent. Hiding them would make the page
        // turn a `display` toggle and leave 358 rows in the DOM.
        for (const other of FOOD) {
          await expect(page.locator(`#menu-cat-${other.id}`)).toHaveCount(
            other.id === cat.id ? 1 : 0,
          );
        }

        const rows = await page.locator(`${PANEL} li.items-baseline`).count();
        expect(rows, `${cat.name} › ${group.name}`).toBe(group.items.length);
        seen += rows;
      }
    }

    expect(pages).toBe(FOOD.reduce((n, c) => n + c.groups.length, 0));
    expect(seen).toBe(MENU_LINE_COUNT - BAR.reduce((n, c) => n + c.items.length, 0));
  });

  test("the index counts what is actually in each category", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the sidebar is lg-only; the phone gets a rail");
    await open(page);

    const badges = await page
      .locator('nav[aria-label="Menu categories"] li')
      .evaluateAll((els) =>
        els.map((el) => ({
          name: el.querySelector("span")!.textContent!.trim(),
          count: Number(el.querySelectorAll("span")[1].textContent),
        })),
      );

    expect(badges).toHaveLength(FOOD.length);
    for (const [i, badge] of badges.entries()) {
      const expected = FOOD[i].groups.reduce((n, g) => n + g.items.length, 0);
      expect(badge.name).toBe(FOOD[i].name);
      expect(badge.count).toBe(expected);
    }
  });

  test("prices are right-aligned in a column, not set on a dotted leader", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the index and multi-column are lg-only");
    await open(page);

    // Every price on a page shares one right edge *per column* — that is
    // what makes a page scannable. A ragged edge here means the alignment
    // came from `text-align` on a wrapping box rather than from the row.
    //
    // One edge per column rather than one overall, because the long pages
    // are set in two or three columns and a column's right edge is
    // necessarily left of the next one's. Asserting a single edge would
    // be asserting that multi-column is off, which is not the claim. The
    // claim is that the edges are *exactly* as many as there are columns:
    // one extra value means at least one row is out of line.
    let total = 0;
    const reached = new Set<number>();

    for (const [ci, cat] of FOOD.entries()) {
      for (const [gi, group] of cat.groups.entries()) {
        await turnTo(page, ci, gi);

        const edges = await page
          .locator(`#menu-cat-${cat.id} li > span.shrink-0`)
          .evaluateAll((els) =>
            els.map((el) => Math.round(el.getBoundingClientRect().right)),
          );

        expect(edges, `${cat.name} › ${group.name}`).toHaveLength(
          group.items.length,
        );

        const cols = await pageColumns(page);
        reached.add(cols);
        expect(
          new Set(edges).size,
          `${cat.name} › ${group.name} — ${edges.length} rows in ${cols} column(s)`,
        ).toBe(cols);

        total += edges.length;
      }
    }

    // Every tier is actually exercised. This is not decoration: a column
    // count that silently collapsed back to one would satisfy the loop
    // above perfectly — every page would have exactly one right edge and
    // exactly one column — while the book went back to being a ribbon.
    // The claim has to include that the tiers are reached, or the test
    // cannot tell the two worlds apart.
    expect(total).toBeGreaterThan(20);
    expect(reached).toEqual(new Set([1, 2, 3, 4]));
  });

  test("a dish with no printed price asks instead of guessing", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the index and multi-column are lg-only");
    await open(page);

    // The seafood list prices by the size of the fish, which the card
    // writes as "APS". That group is page six of Starters, so finding it
    // means turning to it — which is also the only way the claim can be
    // made at all now that one page is mounted at a time.
    const seafood = FOOD[0].groups.findIndex((g) => g.items.some((i) => i.onRequest));
    expect(seafood).toBeGreaterThan(-1);
    const { cat, group } = await turnTo(page, 0, seafood);
    const panel = page.locator(`#menu-cat-${cat.id}`);

    await expect(panel).toContainText("Ask");
    await expect(panel).toContainText("Priced by size");

    // ...and exactly the rows the card left blank are the ones asking.
    // Nothing was invented to fill the gap, which is the point: an
    // invented figure is how a guest orders something nobody priced.
    const unpriced = group.items.filter((i) => i.onRequest).length;
    const asking = await panel
      .locator("li.items-baseline")
      .evaluateAll(
        (els) =>
          els.filter((el) => el.textContent?.trim().endsWith("Ask")).length,
      );
    expect(asking).toBe(unpriced);
    expect(asking).toBeGreaterThan(0);
  });

  test("the index turns the page, and only the open page is in the DOM", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the sidebar is lg-only; the phone gets a rail");
    await open(page);

    // The index used to be a table of contents that jumped down a long
    // scroll. It is now the book's thumb-index, and the difference is not
    // cosmetic: the whole point of paging is that the pages you are not
    // reading are *not there*. A menu that kept all four chapters mounted
    // and hid three with `display: none` would look identical, pass every
    // text assertion, and still hand a screen reader 358 rows to walk.
    const starters = FOOD[0];
    const first = starters.groups[0];
    const later = starters.groups[starters.groups.length - 1];

    await expect(page.locator(`#menu-cat-${starters.id} h3`)).toHaveText(
      first.name,
    );
    await expect(page.locator(`${PANEL} li.items-baseline`)).toHaveCount(
      first.items.length,
    );

    await turnTo(page, 0, starters.groups.length - 1);

    // The page that was open is gone, and the new one is whole.
    await expect(page.locator(`${PANEL} li.items-baseline`)).toHaveCount(
      later.items.length,
    );
    await expect(
      page.locator(`${PANEL} li.items-baseline`).filter({ hasText: first.items[0].name }),
    ).toHaveCount(0);

    // `aria-current` is the index's own record of where you are, and it
    // has to have followed the turn — twice over, because the category
    // `li` marks itself current and so does the group button inside it.
    const current = await rail(page).locator('[aria-current="true"]').allTextContents();
    expect(current).toHaveLength(2);
    expect(current[0]).toContain(starters.name);
    expect(current[1]).toContain(later.name);

    // Clicking a *category* opens its front page, which is the other half
    // of the index's contract.
    const chinese = FOOD[2];
    await railItem(page, 2).getByRole("button").first().click();
    await expect(page.locator(`#menu-cat-${chinese.id} h3`)).toHaveText(
      chinese.groups[0].name,
    );
    await expect(page.locator(`#menu-cat-${starters.id}`)).toHaveCount(0);

    // And nothing was written to the URL. There is nowhere to navigate
    // to: the index is a control, not a link, and a dead anchor would put
    // a hash and a history entry behind every page turn.
    expect(new URL(page.url()).hash).toBe("");
  });

  test("every page fits the viewport it is turned to in", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "measured at the desktop viewport, where paging happens");
    await open(page);

    // The whole reason the book pages at all is that 358 printed lines in
    // one ribbon is a menu people stop reading. Paging into a page that
    // still has to be scrolled would be the same ribbon with extra
    // clicks — so this asserts the actual claim: turn to any of the 22
    // pages, seat it under the header, and the foot of it is on screen.
    //
    // The worst case is Veg Main Course at 35 items, which is the one
    // page allowed three columns. If a future edit changes a threshold,
    // this is what notices.
    const viewport = page.viewportSize()!;
    const worst: { page: string; bottom: number } = { page: "", bottom: 0 };

    for (const [ci, cat] of FOOD.entries()) {
      for (let gi = 0; gi < cat.groups.length; gi += 1) {
        const { group } = await turnTo(page, ci, gi);
        const section = page.locator(`#menu-cat-${cat.id}`);

        // Seat the page exactly where a reader arriving from the index
        // finds it: the section's own `scroll-margin-top`, which is the
        // header's height. `instant` because `html` sets
        // `scroll-behavior: smooth` and a smooth scroll would be measured
        // mid-flight.
        await section.evaluate((el) => {
          const offset = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
          window.scrollTo({
            top: window.scrollY + el.getBoundingClientRect().top - offset,
            behavior: "instant",
          });
        });
        await page.evaluate(
          () =>
            new Promise<void>((r) =>
              requestAnimationFrame(() => requestAnimationFrame(() => r())),
            ),
        );

        const box = await section.boundingBox();
        expect(box, `${cat.name} › ${group.name}`).not.toBeNull();

        if (box!.y + box!.height > worst.bottom) {
          worst.page = `${cat.name} › ${group.name}`;
          worst.bottom = Math.round(box!.y + box!.height);
        }
      }
    }

    expect(
      worst.bottom,
      `${worst.page} runs to ${worst.bottom}px in a ${viewport.height}px viewport`,
    ).toBeLessThanOrEqual(viewport.height);
  });

  test("on a phone the pager walks the whole book and stops at both ends", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "the pager is `lg:hidden`; a laptop uses the index");
    await open(page);

    // The compact rail carries the four categories and nothing else — the
    // 22 groups are not reachable from it, because a 22-item horizontal
    // scroll is not an answer. So on a phone the book's own PREV/NEXT is
    // the *only* way from page one to page twenty-two, and if it does not
    // work the last 21 pages of the menu simply do not exist for anyone
    // reading on a handset. That makes it worth walking in full rather
    // than spot-checking.
    for (const cat of FOOD) {
      const names = cat.groups.map((g) => g.name);
      await compactRail(page)
        .getByRole("button", { name: cat.name, exact: true })
        .click();
      await expect(page.locator(`#menu-cat-${cat.id} h3`)).toHaveText(names[0]);

      for (const [i, name] of names.entries()) {
        await expect(
          page.locator(`#menu-cat-${cat.id} h3`),
          `${cat.name} page ${i + 1}`,
        ).toHaveText(name);
        await expect(pagerCounter(page)).toHaveText(
          `${String(i + 1).padStart(2, "0")} / ${String(names.length).padStart(2, "0")}`,
        );

        const prev = page.getByRole("button", { name: /^Previous page:/ });
        const next = page.getByRole("button", { name: /^Next page:/ });

        // The ends of the book are dead ends, and they have to say so.
        // An enabled PREV on page one is a control that does nothing,
        // which reads as a broken button rather than as the front cover.
        if (i === 0) await expect(prev).toBeDisabled();
        else await expect(prev).toBeEnabled();
        if (i === names.length - 1) await expect(next).toBeDisabled();
        else await expect(next).toBeEnabled();

        // ...and NEXT goes to the page its own label promised.
        if (i < names.length - 1) {
          await expect(next).toHaveAttribute(
            "aria-label",
            `Next page: ${names[i + 1]}`,
          );
          await next.click();
        }
      }
    }
  });

  test("the masthead keeps the rail and the list drops it", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the rail collapses below lg");
    await open(page);

    // The deliberate exception, asserted exactly. `#menus` *opens* on the
    // shared rail like every other section — label in columns 1–3,
    // display type from column 5 — and then the list underneath runs off
    // it, because 358 printed lines inside columns 5–12 is a ribbon, and
    // a menu you cannot scan is a menu people stop reading.
    const { label, h2, body } = await page.evaluate(() => {
      const x = (sel: string) =>
        Math.round(document.querySelector(sel)!.getBoundingClientRect().x);
      return {
        label: x("#menus .eyebrow"),
        h2: x("#menus h2"),
        body: x("#menu-cat-starters h3"),
      };
    });

    // The label is at the container's left edge and the heading is inset
    // from it — the shared rail, unchanged.
    expect(h2).toBeGreaterThan(label);

    // The list starts left of the heading it belongs to. Note this is
    // *not* `body === label`: the body grid runs a wider gutter than the
    // masthead's, so its first column does not land on the label rail
    // either. It clears it, which is the claim worth making — the list
    // has its own column for the sticky index rather than being squeezed
    // beside the heading.
    expect(body).toBeLessThan(h2);
    expect(body).toBeGreaterThan(label);
  });
});

test.describe("Menus — the bar list", () => {
  test("pours are a matrix: one row per spirit, one column per measure", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "below md the matrix stacks with labelled measures");
    await open(page);
    await openBar(page);

    const cat = BAR.find((c) => c.id === "vodka")!;
    const rows = matrix(page, "vodka").locator("li");
    await expect(rows).toHaveCount(cat.items.length);

    // One cell per listed size, plus the name.
    const widths = await rows.first().evaluate((el) =>
      Array.from(el.children).map((c) =>
        Math.round(c.getBoundingClientRect().width),
      ),
    );
    expect(widths).toHaveLength(cat.sizes.length + 1);

    // The measure columns share one x per column across every row — the
    // whole reason this is not a list of prose. Compared as right edges,
    // because the figures are right-aligned within the column.
    const columns = await rows.evaluateAll((els) =>
      els.map((el) =>
        Array.from(el.children)
          .slice(1)
          .map((c) => Math.round(c.getBoundingClientRect().right)),
      ),
    );

    for (let col = 0; col < cat.sizes.length; col++) {
      const edges = new Set(columns.map((row) => row[col]));
      expect(edges.size).toBe(1);
    }

    // No pour name is cut off, across the whole book — not just the list
    // being measured above.
    //
    // This is the price of the rail. The bar's lists share their grid
    // with the atmosphere plate, so three columns that used to hold
    // names now hold a photograph, and a name cell 40px too narrow would
    // print "Royal Challen…" on a card that spells it out. The name cell
    // carries `truncate`, which is the right safety valve for a 412px
    // phone and exactly the wrong thing to rely on at 1280px — it fails
    // silently, in the one place a menu cannot afford to be wrong.
    const names = page.locator(`${PANEL} section ul li > span:first-child`);
    // Counted first, and counted against the data. `expect([])` on an
    // empty locator is the trap this file has already been bitten by
    // once: a selector that matches nothing reports zero clipped names
    // and passes green while testing nothing at all.
    await expect(names).toHaveCount(
      BAR.reduce((n, c) => n + c.items.length, 0),
    );
    const clipped = await names.evaluateAll((els) =>
      els
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => el.textContent?.trim()),
    );
    expect(clipped).toEqual([]);
  });

  test("a size the bar does not stock prints as a dash, never a zero", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the dash is a matrix-cell device");
    await open(page);
    await openBar(page);

    // A blank column on the card is a real absence — no 750ml Bombay
    // Sapphire — and a zero would be a price. Read off the data so the
    // assertion survives a re-transcription of the card.
    const expected = BAR.flatMap((c) => c.items.map((i) => i.prices))
      .flat()
      .filter((p) => p === null).length;
    // Counted across the whole book rather than one category, because the
    // blanks are scattered and the number is what ties the page to the
    // card. The stacked rendering prints no dashes at all, so this is
    // unaffected by which of the two is on screen.
    const blanks = await page
      .locator(`${PANEL} ul li span`)
      .evaluateAll(
        (els) => els.filter((el) => el.textContent?.trim() === "—").length,
      );
    expect(blanks).toBe(expected);
    expect(blanks).toBeGreaterThan(0);

    // And the names match the data, so this is the bar card and not a
    // kitchen row that happens to contain an em dash.
    for (const cat of BAR) {
      await expect(page.locator(`#menu-cat-${cat.id}`)).toBeAttached();
    }
  });

  test("below md the same figures stack with their measures labelled", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "asserts the narrow rendering");
    await open(page);
    await openBar(page);

    // The matrix is a smear at 412px: five columns of numbers and a name
    // do not fit, so each pour stacks instead — more markup, far less
    // squinting. The figures are the same single-source data, which is
    // why the sizes are read off the data here rather than typed in.
    //
    // Measured as rendered width, not as `display`. Both `<ul>`s are
    // present, and the hidden one reports `display: block` because the
    // `display: none` sits on its *wrapper* — reading the property off
    // the list itself says nothing about whether it is on screen.
    const widths = await page
      .locator("#menu-cat-vodka ul")
      .evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().width)),
      );
    expect(widths).toHaveLength(2);
    expect(widths[0]).toBe(0);
    expect(widths[1]).toBeGreaterThan(0);

    const first = stack(page, "vodka").locator("li").first();
    await expect(first).toContainText(BAR[0].items[0].name);

    // Only the sizes the bar actually stocks for this pour — the stack
    // drops the blanks entirely rather than printing a dash in a
    // labelled pair that has no second half.
    const shown = BAR[0].items[0].prices
      .map((price, i) => (price === null ? null : BAR[0].sizes[i]))
      .filter((s): s is string => s !== null);
    expect(shown.length).toBeGreaterThan(0);
    for (const size of shown) await expect(first).toContainText(size);
  });

  test("the back-bar frames divide the lists rather than opening them", async ({
    page,
  }) => {
    await open(page);
    await openBar(page);

    const figures = page.locator(`${PANEL} figure`);
    await expect(figures).toHaveCount(3);

    // The captions, in order, are the three frames the brief asked for.
    const labels = await figures.evaluateAll((els) =>
      els.map((el) => el.querySelector("figcaption")!.textContent!.trim()),
    );
    expect(labels).toEqual(["The Shelf", "The Back Bar", "Cocktails & Mixers"]);

    // A divider, not a gallery — asserted as structure rather than as
    // the presence of three images, because "three pictures at the top"
    // is exactly the shape the brief replaced.
    const walk = await page.evaluate(() =>
      Array.from(
        document.getElementById("menu-panel")!.querySelectorAll(
          "section, figure",
        ),
      ).map((el) =>
        el.tagName === "FIGURE"
          ? "figure"
          : el.getAttribute("id")!.replace("menu-cat-", ""),
      ),
    );

    const frames = walk.flatMap((w, i) => (w === "figure" ? [i] : []));
    expect(frames).toHaveLength(3);
    expect(walk).toHaveLength(BAR.length + 3);

    // No frame opens the book — that would be a hero image.
    expect(frames[0]).toBeGreaterThan(0);
    // And none of them sits directly under another: each one follows a
    // category, which is what makes it a divider rather than a strip.
    for (const i of frames) expect(walk[i - 1]).not.toBe("figure");
    // Two of the three sit *between* two lists. The third closes the
    // book, which is deliberate — the bar ends on the glassware and
    // mixers rather than trailing off in beer prices.
    expect(frames.filter((i) => i < walk.length - 1)).toHaveLength(2);

    // And the frame itself is a plate: rounded, full width, cinematic.
    const box = await figures.first().evaluate((el) => {
      const frame = el.firstElementChild as HTMLElement;
      const r = frame.getBoundingClientRect();
      return {
        radius: parseFloat(getComputedStyle(frame).borderTopLeftRadius),
        ratio: r.width / r.height,
      };
    });
    expect(box.radius).toBeGreaterThanOrEqual(12);

    // Cinematic, and widening as the screen does: 16:10 on a phone where
    // the frame is already short, 21:9 from `md` up where it is a band
    // across the page.
    expect(box.ratio).toBeGreaterThanOrEqual(1.55);

    // "Full width" means the width of the *list*, not of the panel, and
    // that distinction became real when the bar grew a rail at `xl`: the
    // lists and their dividers now share nine columns while the plate
    // takes three. Comparing against the panel would fail there;
    // comparing against the list is the claim the comment above actually
    // makes, and it holds at every width.
    const widths = await page.evaluate(() => {
      const panel = document.getElementById("menu-panel")!;
      const frame = panel.querySelector("figure")!.firstElementChild!;
      const list = panel.querySelector("section")!;
      return {
        frame: Math.round(frame.getBoundingClientRect().width),
        list: Math.round(list.getBoundingClientRect().width),
      };
    });
    expect(widths.frame).toBe(widths.list);
  });

  test("the caption sits on its own scrim, not on the photograph", async ({
    page,
  }) => {
    await open(page);
    await openBar(page);

    // Averaging over a dark frame is not a contrast measurement — a
    // highlight behind a letterform is what makes a label unreadable.
    const caption = await page
      .locator(`${PANEL} figcaption`)
      .first()
      .evaluate((el) => {
        const frame = el.parentElement!;
        const spans = Array.from(frame.querySelectorAll("span"));
        return {
          color: getComputedStyle(el.querySelector("span")!).color,
          scrims: spans.filter((s) =>
            getComputedStyle(s).backgroundImage.includes("gradient"),
          ).length,
        };
      });

    expect(caption.scrims).toBe(1);
    expect(luminance(caption.color)).toBeGreaterThan(200);
  });

  test("the atmosphere plate follows the list you are reading", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the rail is xl-only; a phone has no column to spare");
    await open(page);
    await openBar(page);

    const label = plateLabel(page);

    // It opens on the first list's frame, so the rail is never a hole.
    await expect(plate(page)).toBeVisible();
    await expect(label).toHaveText("The Shelf");

    // Watch for the moment two layers are stacked. This is the whole
    // difference between a crossfade and a swap, and it is invisible to
    // every other kind of assertion: a component that conditionally
    // rendered one `<Image>` would show the same picture, pass the same
    // label check, and change in a single frame. `AnimatePresence`
    // mounts the incoming layer before unmounting the outgoing one, so
    // the child count goes to two — and a hard swap can never exceed one.
    await page.evaluate(() => {
      const w = window as unknown as { __maxPlateLayers?: number };
      w.__maxPlateLayers = 0;
      const root = document.querySelector('#menu-panel div[aria-hidden="true"]')!;
      new MutationObserver(() => {
        w.__maxPlateLayers = Math.max(w.__maxPlateLayers ?? 0, root.children.length);
      }).observe(root, { childList: true });
    });

    // Gin's list is a different frame from Vodka's, and neither is the
    // one showing, so the label has to change twice over.
    await page.locator("#menu-cat-gin").hover();
    await expect(label).toHaveText("The Long Wall");

    const layers = await page.evaluate(
      () => (window as unknown as { __maxPlateLayers?: number }).__maxPlateLayers,
    );
    expect(layers, "the plate swapped in one frame instead of crossfading").toBe(2);

    // Keyboard, not just pointer. The section is focusable for exactly
    // this reason, and `onFocus` has to reach the same state `onPointerEnter`
    // does or the rail is a mouse-only flourish.
    await page.locator("#menu-cat-vodka").focus();
    await expect(label).toHaveText("The Shelf");

    // And the plate is staging, not content: it is out of the
    // accessibility tree, and it never takes a click or a hover away
    // from the list beside it.
    const plateAttrs = await plate(page).evaluate((el) => ({
      hidden: el.getAttribute("aria-hidden"),
      events: getComputedStyle(el.parentElement!).pointerEvents,
    }));
    expect(plateAttrs.hidden).toBe("true");
    expect(plateAttrs.events).toBe("none");
  });

  test("every bar list is marked by a drawn glyph, not a picture", async ({
    page,
  }) => {
    await open(page);
    await openBar(page);

    // A hand-drawn mark is the only kind of illustration this house
    // allows, and it has to be in the markup rather than an image file:
    // nine `<img>`s would be nine more requests and nine more things to
    // re-export when a category moves.
    const marks = await page.evaluate(() =>
      Array.from(document.getElementById("menu-panel")!.querySelectorAll("section")).map(
        (s) => {
          const marks = s.querySelectorAll("header svg");
          const box = marks[0]?.getBoundingClientRect();
          return {
            id: s.getAttribute("id")!.replace("menu-cat-", ""),
            count: marks.length,
            tag: marks[0]?.tagName,

            ariaHidden: marks[0]?.getAttribute("aria-hidden"),
            size: box ? Math.round(box.width) : 0,
          };
        },
      ),
    );

    expect(marks.map((m) => m.id)).toEqual(BAR.map((c) => c.id));
    for (const m of marks) {
      expect(m.tag, m.id).toBe("svg");
      expect(m.count, m.id).toBe(1);
      // `aria-hidden` is baked into the glyph primitive; a screen reader
      // should hear "Gin", not "juniper sprig, image".
      expect(m.ariaHidden, m.id).toBe("true");
      // A mark under 16px is a smudge on a charcoal ground and one over
      // 28 stops being a mark and becomes an illustration.
      expect(m.size, m.id).toBeGreaterThanOrEqual(16);
      expect(m.size, m.id).toBeLessThanOrEqual(28);
    }

    // And the panel holds exactly the four photographs it should — the
    // three dividers and the plate — so no glyph is quietly an `<img>`.
    await expect(page.locator(`${PANEL} img`)).toHaveCount(4);
  });

  test("the bar's rows arrive on scroll and settle flat", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "asserts the matrix, which is md and up");
    await open(page);
    await openBar(page);

    // Each list renders its pours twice — the matrix and the narrow
    // stack — so the count is the book twice over. Read from the data,
    // because a hardcoded number here would survive a lost category.
    const total = BAR.reduce((n, c) => n + c.items.length, 0);
    await expect(page.locator(`${PANEL} section ul li`)).toHaveCount(total * 2);

    // Walk the whole book so every list has actually been through the
    // viewport. Stepping by less than the viewport height is what makes
    // this a walk rather than a set of jumps: `once: true` fires on the
    // way past, and a jump over a list would leave it unobserved — the
    // same trap `MaskReveal` documents, where a reveal that never
    // intersects simply never arrives.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 500) {
      await page.evaluate(
        (v) => window.scrollTo({ top: v, behavior: "instant" }),
        y,
      );
      await page.evaluate(
        () => new Promise<void>((r) => requestAnimationFrame(() => r())),
      );
    }

    /**
     * A row still carrying a transform, or not yet at full opacity.
     *
     * This is the assertion the price matrix cannot make on its own. A
     * row resting at `translateY(14px)` would still report one right
     * edge per column, still read the same numbers, and still be in the
     * DOM — it would just be sitting 14 pixels below where it belongs,
     * forever. The stagger has to *finish*.
     */
    const inFlight = () =>
      page.locator(`${PANEL} section ul li`).evaluateAll((els) =>
        els.filter((el) => {
          const c = getComputedStyle(el);
          if (Number(c.opacity) !== 1) return true;
          const m =
            c.transform === "none"
              ? new DOMMatrixReadOnly()
              : new DOMMatrixReadOnly(c.transform);
          return Math.round(m.m41) !== 0 || Math.round(m.m42) !== 0;
        }).length,
      );

    // 0.45s of rise plus up to 0.3s of capped delay, times the last list
    // to be reached. Polled rather than slept, so a slow machine is not
    // a failure and a fast one is not a two-second wait.
    await expect
      .poll(inFlight, { timeout: 10_000, message: "rows still in flight" })
      .toBe(0);

    // And nothing stayed flat at zero: the count that settled equals the
    // count that exists.
    await expect(
      page.locator(`${PANEL} section ul li`).evaluateAll(
        (els) => els.filter((el) => Number(getComputedStyle(el).opacity) === 1).length,
      ),
    ).resolves.toBe(total * 2);
  });
});

test.describe("Menus — page health", () => {
  test("no console errors across both books", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));

    await open(page);
    await page.locator(SECTION).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    await openBar(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);

    expect(errors).toEqual([]);
  });
});
