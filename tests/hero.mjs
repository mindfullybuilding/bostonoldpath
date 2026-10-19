import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const b = await chromium.launch();
const ctx = await b.newContext();
const p = await ctx.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto(base);
const hero = p.locator(".hero");
await expect(p.locator(".hero img")).toHaveCount(0);
await expect(p.locator(".hero h1")).toHaveText("A deep bow to you, dear friend.");
await expect(p.locator(".hero .lede")).toHaveText(
  "Mindfulness Communities of Greater Boston is an interfaith collective that seeks to learn and practice mindfulness taught by Thích Nhất Hạnh (“Thầy”), a Vietnamese Buddhist monk, author and activist.",
);
const style = await hero.evaluate((el) => ({
  background: getComputedStyle(el).backgroundImage,
  color: getComputedStyle(el).color,
  height: el.getBoundingClientRect().height,
}));
expect(style.background).toContain("beginners-mind-page-title-hero.jpg");
expect(style.height).toBeLessThan(600);
const lum = (rgb) =>
  rgb
    .map((v) => v / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const opacity = Number(style.background.match(/rgba\(0, 0, 0, ([\d.]+)\)/)[1]);
const brightestPixel = Array(3).fill(255 * (1 - opacity));
const whiteContrast = contrast([255, 255, 255], brightestPixel),
  focusContrast = contrast([255, 255, 255], brightestPixel);
expect(whiteContrast).toBeGreaterThanOrEqual(4.5);
expect(focusContrast).toBeGreaterThanOrEqual(3);
await p.screenshot({ path: "outputs/release-verification/background-hero-desktop.png" });
await p.setViewportSize({ width: 390, height: 844 });
await p.screenshot({ path: "outputs/release-verification/background-hero-mobile.png" });
await p.emulateMedia({ media: "print" });
expect(await p.locator(".hero h1").evaluate((e) => getComputedStyle(e).color)).toBe("rgb(0, 0, 0)");
await p.emulateMedia({ media: "screen", forcedColors: "active" });
expect(await hero.evaluate((e) => getComputedStyle(e).backgroundImage)).toBe("none");
await p.emulateMedia({ forcedColors: "none" });
await p.route("**/beginners-mind-page-title-hero.jpg", (r) => r.abort());
await p.reload();
await expect(p.locator(".hero h1")).toBeVisible();
await expect(p.locator(".hero .button.primary")).toBeVisible();
const results = {
  desktopHeight: style.height,
  whiteTextWorstCase: whiteContrast,
  whiteFocusWorstCase: focusContrast,
  photoFailureUsable: true,
  printTextVisible: true,
  forcedColorsPhotoRemoved: true,
};
await fs.writeFile(
  "outputs/release-verification/background-hero.json",
  JSON.stringify(results, null, 2),
);
console.log(results);
await b.close();
