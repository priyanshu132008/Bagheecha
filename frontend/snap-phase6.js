const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Hero — capture the second frame so we see a different plate
  await page.screenshot({ path: "/tmp/p6-hero-1.png", fullPage: false });
  await page.waitForTimeout(5500);
  await page.screenshot({ path: "/tmp/p6-hero-2.png", fullPage: false });

  // Reviews cards row
  await page.evaluate(() => {
    document.getElementById("reviews")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/p6-reviews.png", fullPage: false });

  // Order online
  await page.evaluate(() => {
    document.getElementById("order")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/p6-order.png", fullPage: false });

  // Location
  await page.evaluate(() => {
    document.getElementById("location")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/p6-location.png", fullPage: false });

  // Reserve
  await page.evaluate(() => {
    document.getElementById("reserve")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/p6-reserve.png", fullPage: false });

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
