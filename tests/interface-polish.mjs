import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const out = "outputs/interface-polish-2026-10-19";
await fs.mkdir(out, { recursive: true });
const reports = [];
for (const [name, engine] of [
  ["Chromium", chromium],
  ["WebKit", webkit],
]) {
  const b = await engine.launch();
  const context = await b.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("https://www.google.com/maps/**", (r) => r.abort());
  const p = await context.newPage();
  await p.clock.setFixedTime(new Date("2026-10-19T16:00:00Z"));
  await p.route("**/api/events", (r) =>
    r.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ events: [], retrievedAt: "2026-10-19T16:00:00Z" }),
    }),
  );
  await p.goto(base);
  for (const selector of [".site-header", ".site-footer"])
    expect(await p.locator(selector).evaluate((e) => getComputedStyle(e).borderRadius)).toBe("0px");
  await expect(p.locator(".hero-secondary")).toHaveText("New? Start Here.");
  expect(
    await p.locator(".hero-secondary").evaluate((e) => getComputedStyle(e).backgroundColor),
  ).toBe("rgb(255, 255, 255)");
  await expect(p.locator(".desktop-nav .nav-trigger")).toHaveCount(2);
  for (const width of [320, 390, 430, 768, 1024]) {
    await p.setViewportSize({ width, height: 844 });
    await expect(p.locator(".compact-brand")).toBeVisible();
    await expect(p.locator(".compact-brand")).toHaveText(
      "Mindfulness Communities of Greater Boston",
    );
    const [name, action, menu] = await Promise.all([
      p.locator(".brand").boundingBox(),
      p.locator(".header-actions .button").boundingBox(),
      p.locator(".menu-trigger").boundingBox(),
    ]);
    expect(Math.abs(name.y + name.height / 2 - action.y - action.height / 2)).toBeLessThan(1);
    expect(Math.abs(menu.y + menu.height / 2 - action.y - action.height / 2)).toBeLessThan(1);
  }
  await p.setViewportSize({ width: 1440, height: 1000 });
  await expect(p.locator(".desktop-nav > a")).toHaveText(["Community Voices", "Mailing Lists"]);
  await p.goto(base + "/new-here.html");
  await expect(p.getByRole("heading", { name: "Practice with Us", exact: true })).toBeVisible();
  await expect(p.locator(".newcomer-guidance,.external-caption,.source-note")).toHaveCount(0);
  await expect(p.locator(".river-stops > li").last().locator("a")).toHaveCount(1);
  await expect(p.locator(".river-stops > li").last().locator("a")).toHaveText("Resources");
  await p.goto(base + "/our-community.html");
  await expect(p.locator('main a[href*="togetherness"]')).toHaveCount(0);
  await p.goto(base + "/our-practice.html");
  await expect(p.locator("main figcaption,.source-note")).toHaveCount(0);
  await p.goto(base + "/resources.html");
  await expect(p.locator("h1")).toHaveText("Resources");
  await expect(p.getByRole("navigation", { name: "Jump to Section" })).toBeVisible();
  await expect(p.locator("main details")).toHaveCount(0);
  for (const id of [
    "resource-five-mindfulness-trainings",
    "resource-order-of-interbeing",
    "resource-sangha-resources",
  ])
    await expect(p.locator("a#" + id + ", #" + id + " a").first()).toBeVisible();
  let scan = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  expect(scan.violations).toEqual([]);
  await p.goto(base + "/find-a-sangha.html");
  await expect(p.locator(".month-grid")).toBeVisible();
  await expect(p.locator("[data-month-label]")).toHaveText("October 2026");
  await expect(p.locator(".agenda-status")).toHaveText(
    "No upcoming community events listed in October 2026.",
  );
  const frame = await p.locator(".region-map iframe").boundingBox(),
    region = await p.locator(".region-map").boundingBox();
  expect(Math.abs(frame.x + frame.width / 2 - region.x - region.width / 2)).toBeLessThan(1);
  for (const width of [1440, 390, 320]) {
    await p.setViewportSize({ width, height: 900 });
    const first = p.locator("[data-group]").first(),
      summary = first.locator("summary"),
      contact = first.locator(".organizer-contact");
    const [s, c] = await Promise.all([summary.boundingBox(), contact.boundingBox()]);
    expect(Math.abs(s.y - c.y)).toBeLessThan(1);
    expect(s.x + s.width).toBeLessThanOrEqual(c.x);
    await summary.click();
    await expect(first.getByRole("link", { name: "Get Directions", exact: true })).toBeVisible();
    await summary.click();
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await p.setViewportSize({ width: 1440, height: 1000 });
  const fixtures = [
    {
      id: "one",
      title: "Test gathering",
      start: "2026-10-22T15:00:00Z",
      end: "2026-10-22T16:00:00Z",
      allDay: false,
    },
    {
      id: "two",
      title: "Next month gathering",
      start: "2026-11-02",
      end: "2026-11-03",
      allDay: true,
    },
  ];
  await p.unroute("**/api/events");
  await p.route("**/api/events", (r) =>
    r.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ events: fixtures, retrievedAt: "2026-10-19T16:00:00Z" }),
    }),
  );
  await p.locator("[data-retry]").click();
  await expect(p.locator(".agenda-item")).toHaveCount(1);
  await expect(p.locator(".agenda-item")).toContainText("Test gathering");
  await expect(p.locator('td:has(time[datetime="2026-10-22"]) .event-count')).toContainText("1");
  await p.locator("[data-month-next]").press("Enter");
  await expect(p.locator("[data-month-next]")).toBeFocused();
  await expect(p.locator("[data-month-label]")).toHaveText("November 2026");
  await expect(p.locator(".agenda-item")).toContainText("Next month gathering");
  scan = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  expect(scan.violations).toEqual([]);
  await p.goto(base + "/find-a-sangha.html#subscribe-calendar");
  await expect(p).toHaveURL(base + "/subscribe-calendar.html");
  await expect(p.locator(".tutorials details")).toHaveCount(6);
  await p.goto(base + "/photo-credits.html");
  await expect(p.locator("main")).not.toContainText(/Janey|Gilman/i);
  if (name === "Chromium") {
    await p.unroute("**/api/events");
    await p.route("**/api/events", (r) =>
      r.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ events: [], retrievedAt: "2026-10-19T16:00:00Z" }),
      }),
    );
    for (const page of [
      "home",
      "new-here",
      "resources",
      "find-a-sangha",
      "subscribe-calendar",
      "our-practice",
    ]) {
      await p.setViewportSize({ width: 1440, height: 1000 });
      await p.goto(base + (page === "home" ? "/" : "/" + page + ".html"));
      await p.screenshot({ path: `${out}/${page}-desktop.png`, fullPage: true });
      await p.setViewportSize({ width: 390, height: 844 });
      await p.screenshot({ path: `${out}/${page}-mobile.png`, fullPage: true });
    }
  }
  reports.push({
    engine: name,
    version: b.version(),
    result: "pass",
    coverage: [
      "straight bars",
      "outlined hero action",
      "direct Voices",
      "requested copy removals",
      "visible blue tiles",
      "map alignment",
      "side-by-side details/contact",
      "month display and event filtering",
      "subscription page and legacy hash",
      "central attribution",
    ],
  });
  await b.close();
}
await fs.writeFile(`${out}/interactions.json`, JSON.stringify(reports, null, 2));
console.log(reports);
