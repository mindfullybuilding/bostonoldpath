import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const out = "outputs/homepage-forest-2026-10-20";
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
    await expect(p.locator(".path-publication")).toHaveCount(0);
    if (viewport.width === 1440) {
      expect(
        await p.locator(".community-path-art img").evaluate((image) => image.naturalWidth),
      ).toBe(948);
    }
    const masks = await p.locator(".path-stop-content").evaluateAll((blocks) =>
      blocks.map((block) => ({
        background: getComputedStyle(block).backgroundColor,
        color: getComputedStyle(block).color,
      })),
    );
    for (const mask of masks) {
      expect(mask.background).toBe("rgba(255, 255, 255, 0.98)");
      expect(mask.color).toBe("rgb(0, 0, 0)");
    }
    await expect(
      p
        .locator(".path-stop")
        .filter({ has: p.getByRole("heading", { name: "Community Voices", exact: true }) })
        .locator("a"),
    ).toHaveCount(1);
    await expect(
      p
        .locator(".path-stop")
        .filter({ has: p.getByRole("heading", { name: "Community Events", exact: true }) }),
    ).toContainText(
      "Sign up to stay up to date with days of mindfulness, retreats, engaged practice, and other happenings outside of regular practice sittings.",
    );
    await expect(p.locator('.path-stop a[href="/subscribe-calendar.html"]')).toBeVisible();
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (name === "Chromium" && viewport.width !== 320) {
      const size = `${viewport.width}x${viewport.height}`;
      await p.screenshot({ path: `${out}/hero-${size}.png` });
      await p.locator(".home-schedule").scrollIntoViewIfNeeded();
      await p.screenshot({ path: `${out}/schedule-${size}.png` });
      await p.locator(".community-path").scrollIntoViewIfNeeded();
      await p.screenshot({ path: `${out}/path-${size}.png` });
      await p.evaluate(() => scrollTo(0, 0));
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
  await expect(p.locator(".full-sangha-schedule a")).toHaveAttribute("href", "/find-a-sangha.html");
  await expect(p.locator(".full-sangha-schedule a")).toBeVisible();
  await releaseDirectory();
  await expect(p.locator("[data-today-sanghas] li")).toHaveCount(2);
  await p.unroute("**/assets/site-data.json");
  await p.locator(".full-sangha-schedule a").focus();
  await p.keyboard.press("Enter");
  await expect(p).toHaveURL(base + "/find-a-sangha.html");
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
  let scan = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  expect(scan.violations).toEqual([]);
  await p.route("**/assets/site-data.json", (r) => r.fulfill({ status: 503, body: "Unavailable" }));
  await p.goto(base);
  await expect(p.locator(".today-status")).toContainText("unavailable");
  await expect(p.locator(".full-sangha-schedule a")).toBeVisible();
  await p.locator(".full-sangha-schedule a").click();
  await expect(p.locator("#peaceful-garden-sangha")).toBeVisible();
  await p.unroute("**/assets/site-data.json");
  await p.route("**/community-path.png", (r) => r.abort());
  await p.route("**/community-forest.jpg", (r) => r.abort());
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
      "full schedule button and directory recovery",
      "empty/error/no-art states",
      "forced colors",
      "short landscape",
      "axe homepage including masked text",
    ],
  });
  await b.close();
}
const b = await chromium.launch();
const p = await b.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
await p.goto(base);
await expect(p.locator(".path-stop h2")).toHaveCount(7);
await p.locator(".full-sangha-schedule a").click();
await expect(p.locator("#peaceful-garden-sangha")).toBeVisible();
await b.close();
await fs.writeFile(`${out}/interactions.json`, JSON.stringify(report, null, 2));
console.log(report);
