import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const out = "outputs/homepage-path-2026-10-19";
await fs.mkdir(out, { recursive: true });
const report = [];
for (const [name, engine] of [
  ["Chromium", chromium],
  ["WebKit", webkit],
]) {
  const b = await engine.launch();
  const context = await b.newContext();
  const p = await context.newPage();
  await p.clock.setFixedTime(new Date("2026-10-19T16:00:00Z"));
  await p.route("**/api/events", (r) =>
    r.fulfill({
      json: { events: [], timeZone: "America/New_York", retrievedAt: "2026-10-19T16:00:00Z" },
    }),
  );
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
    { width: 320, height: 844 },
  ]) {
    await p.setViewportSize(viewport);
    await p.goto(base, { waitUntil: "networkidle" });
    await expect(p.locator("[data-today-sanghas] li")).toHaveCount(2);
    const bounds = await p.locator(".hero").boundingBox();
    expect(Math.abs(bounds.y + bounds.height - viewport.height)).toBeLessThan(2);
    await expect(p.locator(".hero .lede")).toContainText(
      "a Vietnamese Buddhist monk, author and activist.",
    );
    const button = await p.locator(".hero-secondary").boundingBox();
    expect(button.y + button.height).toBeLessThanOrEqual(viewport.height);
    await expect(p.locator(".path-stop")).toHaveCount(7);
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (name === "Chromium" && viewport.width !== 320) {
      const size = `${viewport.width}x${viewport.height}`;
      await p.screenshot({ path: `${out}/hero-${size}.png` });
      await p.locator(".home-schedule").scrollIntoViewIfNeeded();
      await p.screenshot({ path: `${out}/schedule-${size}.png` });
      await p.locator(".community-path").scrollIntoViewIfNeeded();
      await p.screenshot({ path: `${out}/path-${size}.png` });
      await p.screenshot({ path: `${out}/page-${size}.png`, fullPage: true });
    }
  }
  let releaseDirectory;
  await p.route(
    "**/assets/site-data.json",
    (route) =>
      new Promise((resolve) => {
        releaseDirectory = async () => {
          await route.continue();
          resolve();
        };
      }),
  );
  await p.goto(base);
  await expect(p.locator(".today-status")).toContainText("Loading");
  await p.locator(".full-sangha-schedule summary").click();
  await expect(p.locator(".weekly-schedule")).toBeVisible();
  await releaseDirectory();
  await expect(p.locator("[data-today-sanghas] li")).toHaveCount(2);
  await p.locator(".full-sangha-schedule summary").click();
  await p.unroute("**/assets/site-data.json");
  await p.locator(".full-sangha-schedule summary").press("Enter");
  await expect(p.locator(".schedule-day")).toHaveCount(7);
  await expect(p.locator(".weekly-schedule")).toContainText("2nd and 4th Wednesday");
  await expect(p.locator(".weekly-schedule")).toContainText("Every other Thursday");
  await p.locator('.weekly-schedule a[href$="#tree-house-sangha"]').click();
  await expect(p).toHaveURL(base + "/find-a-sangha.html#tree-house-sangha");
  await expect(p.locator("#tree-house-sangha")).toBeVisible();
  await p.clock.setFixedTime(new Date("2026-10-22T16:00:00Z"));
  await p.goto(base);
  await expect(p.locator("[data-today-sanghas] > ul > li")).toHaveCount(1);
  await expect(p.locator(".schedule-uncertain")).toContainText("Lotus Pond Sangha");
  await p.clock.setFixedTime(new Date("2026-10-18T16:00:00Z"));
  await p.goto(base);
  await expect(p.locator("[data-today-sanghas]")).toContainText("No regular sangha meetings");
  await p.clock.setFixedTime(new Date("2026-10-20T03:59:59Z"));
  await p.goto(base);
  await expect(p.locator("[data-sangha-date]")).toContainText("Monday");
  await p.clock.setFixedTime(new Date("2026-10-20T04:01:00Z"));
  await p.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(p.locator("[data-sangha-date]")).toContainText("Tuesday");
  await expect(p.locator("[data-today-sanghas]")).toContainText("Peaceful Garden Sangha");
  await p.locator(".full-sangha-schedule summary").click();
  let scan = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  expect(scan.violations).toEqual([]);
  await p.route("**/assets/site-data.json", (r) => r.fulfill({ status: 503, body: "Unavailable" }));
  await p.goto(base);
  await expect(p.locator(".today-status")).toContainText("unavailable");
  await p.locator(".full-sangha-schedule summary").click();
  await expect(p.locator(".weekly-schedule")).toContainText("Peaceful Garden Sangha");
  await p.unroute("**/assets/site-data.json");
  await p.route("**/community-path.png", (r) => r.abort());
  await p.setViewportSize({ width: 320, height: 568 });
  await p.goto(base);
  await expect(p.locator(".path-stop h2")).toHaveCount(7);
  await p.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await expect(p.locator(".community-path-art")).toBeHidden();
  await p.emulateMedia({ forcedColors: "none" });
  await p.setViewportSize({ width: 820, height: 390 });
  await p.goto(base);
  const hero = await p.locator(".hero").boundingBox(),
    lastButton = await p.locator(".hero-secondary").boundingBox();
  expect(lastButton.y + lastButton.height).toBeLessThanOrEqual(hero.y + hero.height);
  report.push({
    engine: name,
    version: b.version(),
    result: "pass",
    checks: [
      "viewport-sized welcome",
      "full approved introduction",
      "daily and ordinal schedules",
      "uncertain fortnightly group",
      "Boston midnight",
      "expanded full schedule and deep links",
      "empty/error/no-art states",
      "forced colors",
      "short landscape",
      "axe open schedule",
    ],
  });
  await b.close();
}
const b = await chromium.launch();
const p = await b.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
await p.goto(base);
await p.locator(".full-sangha-schedule summary").click();
await expect(p.locator(".weekly-schedule")).toContainText("Peaceful Garden Sangha");
await expect(p.locator(".path-stop h2")).toHaveCount(7);
await b.close();
await fs.writeFile(`${out}/interactions.json`, JSON.stringify(report, null, 2));
console.log(report);
