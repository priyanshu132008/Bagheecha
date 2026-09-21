const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById("tab-bar")?.click());
  await page.waitForTimeout(1000);
  const data = await page.evaluate(() => {
    const panel = document.getElementById("menu-panel");
    const slots = panel?.querySelectorAll('[data-slot]') ?? [];
    const labels = Array.from(panel?.querySelectorAll("span.font-display") ?? [])
      .map((s) => ({ text: s.textContent?.trim(), cls: s.className.slice(0, 60) }));
    return { slotCount: slots.length, labels };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
