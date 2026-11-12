import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const b = await chromium.launch();
const p = await b.newPage();
const results = [];
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
for (const file of (await fs.readdir("dist")).filter(
  (f) =>
    f.endsWith(".html") && f !== "home.html" && !f.includes("feedback") && !f.includes("wireframe"),
)) {
  for (const width of [390, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    await p.goto(`${base}/${file === "index.html" ? "" : file}`);
    await p.evaluate(() => {
      const nodes = [...document.querySelectorAll("body *")];
      const fonts = nodes.map((e) => parseFloat(getComputedStyle(e).fontSize));
      nodes.forEach((e, i) => (e.style.fontSize = fonts[i] * 2 + "px"));
    });
    const overflow = await p.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll("body *")]
        .filter(
          (el) => el.getBoundingClientRect().right > innerWidth + 3 && el.getClientRects().length,
        )
        .slice(0, 10)
        .map((el) => el.tagName + "." + el.className),
    }));
    results.push({ file, ...overflow });
  }
}
await fs.mkdir("outputs/release-verification", { recursive: true });
await fs.writeFile(
  "outputs/release-verification/enlargement.json",
  JSON.stringify(results, null, 2),
);
console.log(results.filter((r) => r.scroll > r.width));
await b.close();
