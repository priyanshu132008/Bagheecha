const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const data = await page.evaluate(() =>
    ["#menus h2", "#location h2", "#reserve h2", "#reviews h2", "#order h2"].map((sel) => {
      const el = document.querySelector(sel);
      return { sel, x: Math.round(el?.getBoundingClientRect().x ?? 0) };
    }),
  );
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
