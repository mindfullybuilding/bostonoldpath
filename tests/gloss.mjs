import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const out = "outputs/water-gloss-2026-10-19";
await fs.mkdir(out, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.route("https://www.google.com/maps/**", (r) => r.abort());
const p = await ctx.newPage();
const results = [];
for (const page of [
  "home",
  "new-here",
  "community-voices",
  "newsletters",
  "join-mailing-list",
  "find-a-sangha",
]) {
  await p.goto(base + (page === "home" ? "/" : `/${page}.html`));
  await p.screenshot({ path: `${out}/${page}-desktop.png`, fullPage: true });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.screenshot({ path: `${out}/${page}-mobile.png`, fullPage: true });
  await p.setViewportSize({ width: 1440, height: 1000 });
}
await p.goto(base);
for (const i of [0, 1, 2]) {
  const trigger = p.locator(".nav-trigger").nth(i);
  await trigger.press("Enter");
  const scan = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  expect(scan.violations).toEqual([]);
  await p.screenshot({ path: `${out}/dropdown-${i}.png` });
  await trigger.press("Escape");
}
const samples = [];
for (const state of [
  "normal",
  "hover-selected",
  "primary",
  "primary-hover",
  "mobile-header",
  "drawer-selected",
]) {
  await p.setViewportSize({
    width: state.startsWith("mobile") || state.startsWith("drawer") ? 390 : 1440,
    height: 1000,
  });
  await p.goto(base + (state.startsWith("primary") ? "/community-voices.html" : "/"));
  let selectors = [".full-brand", ".nav-trigger", ".desktop-nav > a", ".header-actions .button"];
  if (state === "hover-selected") await p.locator(".nav-trigger").first().hover();
  if (state.startsWith("primary")) {
    await p.locator(".voices-submission .button.primary").scrollIntoViewIfNeeded();
    selectors = [".voices-submission .button.primary"];
    if (state === "primary-hover") await p.locator(selectors[0]).hover();
  }
  if (state === "mobile-header") selectors = [".compact-brand", ".header-actions .button"];
  if (state === "drawer-selected") {
    await p.locator("[data-open-drawer]").click();
    await p.locator(".drawer-trigger").first().click();
    selectors = ['.drawer-trigger[aria-expanded="true"]'];
  }
  const rects = await p.evaluate(
    (selectors) =>
      selectors.flatMap((selector) =>
        [...document.querySelectorAll(selector)].map((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return {
            label: el.textContent,
            fg: getComputedStyle(el).color,
            rects: [...range.getClientRects()].map((r) => ({
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
            })),
          };
        }),
      ),
    selectors,
  );
  await p.addStyleTag({
    content: selectors.join(",") + "{color:transparent!important;text-shadow:none!important}",
  });
  await p.screenshot({ path: `${out}/contrast-${state}.png` });
  samples.push({ state, rects });
}
await p.setViewportSize({ width: 1440, height: 1000 });
await p.goto(base + "/new-here.html");
expect(await p.locator(".page-intro .reading").evaluate((e) => getComputedStyle(e).textAlign)).toBe(
  "center",
);
await expect(p.locator(".page-intro em")).toHaveText("“Go as a river” — Thích Nhất Hạnh");
await expect(p.locator("a[href*=pJGYTIOlhqw]")).toHaveCount(0);
await p.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
await expect(p.locator(".river-illustration")).toBeHidden();
expect(await p.locator(".site-header").evaluate((e) => getComputedStyle(e).backgroundImage)).toBe(
  "none",
);
await expect(p.locator(".river-stops a").first()).toBeVisible();
await p.emulateMedia({ forcedColors: "none" });
await p.setViewportSize({ width: 320, height: 900 });
expect(await p.locator(".page-intro .reading").evaluate((e) => getComputedStyle(e).textAlign)).toBe(
  "left",
);
expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
await p.route("**/illustrations/**", (r) => r.abort());
await p.reload();
await expect(p.locator(".river-stops > li")).toHaveCount(5);
await p.goto(base + "/newsletters.html");
await expect(p.locator(".issue-card a")).toHaveCount(3);
await p.setViewportSize({ width: 390, height: 844 });
await p.goto(base);
await p.locator("[data-open-drawer]").click();
await p.locator(".drawer-trigger").nth(2).click();
await p.screenshot({ path: `${out}/drawer-mobile.png` });
results.push({
  status: "pass",
  openDropdownScans: 3,
  forcedColors: true,
  riverFailureContent: true,
  reflow320: true,
});
await fs.writeFile(`${out}/contrast-samples.json`, JSON.stringify(samples, null, 2));
await fs.writeFile(`${out}/states.json`, JSON.stringify(results, null, 2));
const backgrounds = {};
for (const sample of samples)
  backgrounds[sample.state] = (await fs.readFile(`${out}/contrast-${sample.state}.png`)).toString(
    "base64",
  );
const measured = await p.evaluate(
  async ({ samples, backgrounds }) => {
    const lum = (rgb) =>
      rgb
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    const rows = [];
    for (const sample of samples) {
      const image = new Image();
      image.src = "data:image/png;base64," + backgrounds[sample.state];
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, image.width, image.height).data;
      for (const el of sample.rects) {
        const foreground = el.fg.match(/\d+/g).slice(0, 3).map(Number);
        let minimum = 100;
        for (const r of el.rects)
          for (let y = Math.ceil(r.y); y < Math.floor(r.y + r.height); y++)
            for (let x = Math.ceil(r.x); x < Math.floor(r.x + r.width); x++) {
              const offset = (y * image.width + x) * 4;
              const bg = [data[offset], data[offset + 1], data[offset + 2]];
              const [a, b] = [lum(foreground), lum(bg)].sort((a, b) => a - b);
              minimum = Math.min(minimum, (b + 0.05) / (a + 0.05));
            }
        rows.push({
          state: sample.state,
          label: el.label,
          minimumContrast: minimum,
          pass: minimum >= 4.5,
        });
      }
    }
    return rows;
  },
  { samples, backgrounds },
);
await fs.writeFile(`${out}/rendered-contrast.json`, JSON.stringify(measured, null, 2));
expect(measured.filter((r) => !r.pass)).toEqual([]);
const source = (await fs.readFile("docs/water-gloss-2026-10-19/selected-reference.png")).toString(
  "base64",
);
const actual = (await fs.readFile(`${out}/home-desktop.png`)).toString("base64");
await p.setViewportSize({ width: 1300, height: 1000 });
await p.setContent(
  `<html><body style="margin:24px;background:#f3f6f9;font:18px system-ui;color:black"><p>Selected water-gloss reference</p><div style="width:1250px;height:180px;overflow:hidden"><img src="data:image/png;base64,${source}" style="width:1300px;transform:translate(-25px,-190px)"></div><p>MCGB: real navigation, accessible label zone, shared gloss</p><div style="height:120px;overflow:hidden"><img src="data:image/png;base64,${actual}" style="width:1250px"></div></body></html>`,
);
await p.screenshot({ path: `${out}/header-comparison.png` });
await b.close();
console.log(results, measured);
