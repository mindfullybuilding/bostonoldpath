import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const out = "outputs/editorial-2026-10-26";
await fs.mkdir(out, { recursive: true });
const report = [];
for (const [engineName, engine] of [
  ["Chromium", chromium],
  ["WebKit", webkit],
]) {
  const b = await engine.launch();
  const context = await b.newContext();
  const p = await context.newPage();
  await p.route("https://www.google.com/maps/**", (r) => r.abort());
  await p.route("**/api/events", (r) =>
    r.fulfill({ json: { events: [], timeZone: "America/New_York" } }),
  );
  for (const width of [320, 390, 768, 1024, 1440]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.goto(base);
    await expect(p.locator(".hero h1")).toHaveText(
      "Engaged Buddhism in the Plum Village Tradition",
    );
    await expect(p.locator(".hero h1 em")).toHaveText(["Engaged", "Plum Village"]);
    await expect(p.locator("#today-sanghas-title")).toHaveText("Today’s Sanghas");
    const headingLines = await p
      .locator(".hero h1")
      .evaluate((e) =>
        Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)),
      );
    if (width >= 1024) expect(headingLines).toBe(1);
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (engineName === "Chromium" && [390, 1440].includes(width))
      await p.screenshot({ path: `${out}/home-${width}.png` });
    await p.goto(base + "/find-a-sangha.html");
    const cards = p.locator("[data-group]");
    const days = () =>
      cards.evaluateAll((es) => es.filter((e) => !e.hidden).map((e) => e.dataset.sortDay));
    const az = await days();
    expect(az).toEqual([...az].sort((a, b) => a.localeCompare(b, "en")));
    await expect(cards).toHaveCount(13);
    const sort = p.locator("[data-sort-sanghas]");
    await sort.focus();
    await sort.press("Enter");
    const za = await days();
    expect(za).toEqual([...az].sort((a, b) => b.localeCompare(a, "en")));
    await expect(sort).toBeFocused();
    await expect(sort).toHaveAccessibleName(
      "Sort by Day of the Week, Z to A. Activate for A to Z.",
    );
    await expect(p.locator("#group-count")).toHaveText("13 of 13 Sanghas");
    if (width < 900) await p.locator("[data-filter-toggle]").click();
    await p.locator("#group-search").fill("Brookline");
    await expect(p.locator("#group-count")).toHaveText("2 of 13 Sanghas");
    expect(await days()).toEqual(["tuesday", "monday"]);
    await p.locator("#group-search").fill("nomatch");
    await expect(p.locator("#no-groups")).toBeVisible();
    await p.locator("[data-clear-filters]").click();
    await expect(p.locator("#group-count")).toHaveText("13 of 13 Sanghas");
    await sort.click();
    expect(await days()).toEqual(az);
    if (width < 900 && (await p.locator(".filters.is-open").count()))
      await p.locator("[data-close-filters]").click();
    const sb = await sort.boundingBox(),
      cb = await p.locator("#group-count").boundingBox();
    expect(sb.height).toBeGreaterThanOrEqual(44);
    if (width >= 900) {
      expect(sb.x + sb.width).toBeLessThan(cb.x);
      expect(Math.abs(sb.y + sb.height / 2 - cb.y - cb.height / 2)).toBeLessThan(2);
    } else {
      expect(sb.y + sb.height).toBeLessThanOrEqual(cb.y + 1);
      expect(Math.abs(sb.x + sb.width - cb.x - cb.width)).toBeLessThan(2);
    }
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (engineName === "Chromium" && [390, 1440].includes(width))
      await p.screenshot({ path: `${out}/directory-${width}.png` });
    report.push({
      engine: engineName,
      width,
      headingLines,
      sorting: "pass",
      filters: "pass",
      overflow: false,
    });
  }
  await p.goto(base + "/resources.html");
  const app = p
    .locator("#practice-now .resource-card")
    .filter({ has: p.getByRole("heading", { name: "Plum Village App", exact: true }) });
  await expect(app).toHaveAttribute("href", "https://plumvillage.app/");
  await expect(app.locator("p")).toHaveText(
    "The free Plum Village app offers guided meditations, talks, and other practice resources from the Plum Village community.",
  );
  await p.goto(base + "/new-here.html");
  await expect(
    p
      .locator(".river-stop")
      .filter({ has: p.getByRole("heading", { name: "Practice with Us", exact: true }) })
      .locator("p"),
  ).toHaveText(
    "A practitioner without a sangha is like a tiger who has left a mountain. Taking refuge in our sangha is our practice.",
  );
  const axe = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  expect(axe.violations).toEqual([]);
  const offline = await b.newPage({ javaScriptEnabled: false });
  await offline.goto(base + "/find-a-sangha.html");
  await expect(offline.locator("[data-sort-sanghas]")).toBeHidden();
  expect(
    await offline.locator("[data-group]").evaluateAll((es) => es.map((e) => e.dataset.sortDay)),
  ).toEqual([
    "friday",
    "friday",
    "monday",
    "monday",
    "saturday",
    "sunday",
    "thursday",
    "tuesday",
    "tuesday",
    "wednesday",
    "wednesday",
    "wednesday",
    "wednesday",
  ]);
  await b.close();
}
await fs.writeFile(`${out}/editorial-sorting.json`, JSON.stringify(report, null, 2));
console.log(report);
