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
    const imgs = panel ? Array.from(panel.querySelectorAll("img")) : [];
    return imgs.map((el) => {
      const src = (el.getAttribute("src") || "").split("/").pop()?.slice(0, 50) ?? "";
      const alt = el.getAttribute("alt") ?? "";
      const closest = el.closest("[id^='menu-cat-']")?.id ?? "(panel)";
      return { src, alt, closest };
    });
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
