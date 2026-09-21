const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Hero
  await page.screenshot({ path: "/tmp/hero.png", fullPage: false });

  // Scroll to bar
  await page.evaluate(() => {
      const el = document.getElementById("tab-bar");
      el?.click();
    });
  await page.waitForTimeout(1800);
  await page.evaluate(() => {
    document.getElementById("menu-cat-vodka")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "/tmp/bar-after.png", fullPage: false });

  // Reviews marquee
  await page.evaluate(() => {
    document.getElementById("reviews")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "/tmp/reviews.png", fullPage: false });

  // Order online
  await page.evaluate(() => {
    document.getElementById("order")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/order.png", fullPage: false });

  // Location
  await page.evaluate(() => {
    document.getElementById("location")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/location.png", fullPage: false });

  // Reserve
  await page.evaluate(() => {
    document.getElementById("reserve")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/reserve.png", fullPage: false });

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});