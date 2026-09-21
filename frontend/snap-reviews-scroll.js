const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    document.getElementById("reviews")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(1000);

  // Scroll the inner review row to its far right to confirm all 4 cards exist
  await page.evaluate(() => {
    const scroller = document.querySelector("#reviews .overflow-x-auto");
    if (scroller) {
      scroller.scrollLeft = scroller.scrollWidth;
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/p6-reviews-end.png", fullPage: false });

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
