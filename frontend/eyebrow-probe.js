const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const data = await page.evaluate(() =>
    Array.from(document.querySelectorAll("section .eyebrow")).map((el) => ({
      x: Math.round(el.getBoundingClientRect().x),
      text: el.textContent?.trim().slice(0, 50),
      sectionId: el.closest("section")?.id ?? null,
      cls: el.className.slice(0, 80),
    })),
  );
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
