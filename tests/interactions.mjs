import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const results = [];
for (const [name, engine] of [
  ["Chromium", chromium],
  ["WebKit", webkit],
]) {
  console.log("Checking " + name);
  const tabKey = name === "WebKit" ? "Alt+Tab" : "Tab";
  const browser = await engine.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route("https://tile.openstreetmap.org/**", (route) => route.abort());
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date("2026-10-19T16:00:00Z"));
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base + "/");
  await p.keyboard.press(tabKey);
  await expect(p.locator(".skip-link")).toBeFocused();
  await p.keyboard.press("Enter");
  await expect(p.locator("#main")).toBeFocused();
  await p.locator(".nav-trigger").first().press("ArrowDown");
  const resources = p.locator('.desktop-nav a[href="/resources.html"]');
  await resources.focus();
  await p.keyboard.press("Enter");
  await expect(p).toHaveURL(base + "/resources.html");
  await expect(p.locator("h1")).toHaveText("Resources");
  await p.goto(base + "/");
  await p.setViewportSize({ width: 390, height: 844 });
  const opener = p.locator("[data-open-drawer]");
  await opener.focus();
  await p.keyboard.press("Enter");
  await expect(p.locator("#mobile-menu")).toBeVisible();
  let stateScan = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  expect(stateScan.violations).toEqual([]);
  for (let i = 0; i < 20; i++) {
    await p.keyboard.press(tabKey);
    expect(await p.evaluate(() => document.activeElement.closest("dialog")?.id)).toBe(
      "mobile-menu",
    );
  }
  await p.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await opener.click();
  await p.setViewportSize({ width: 1280, height: 500 });
  await expect(p.locator("#mobile-menu")).not.toBeVisible();
  await expect(p.locator(".nav-trigger").first()).toBeFocused();
  await p.locator(".nav-trigger").first().focus();
  await p.setViewportSize({ width: 390, height: 844 });
  await expect(opener).toBeFocused();
  await p.setViewportSize({ width: 1280, height: 900 });
  await expect(p.locator(".nav-trigger").first()).toBeFocused();
  await p.goto(base + "/find-a-sangha.html");
  await expect(p.locator(".finder-heading > p")).toBeVisible();
  await expect(p.locator(".finder-heading > p")).toContainText("what we don’t transform");
  await expect(p.locator(".finder-shortcuts a")).toHaveText("Jump to Community Events & Calendar");
  await p.locator("#group-search").focus();
  await p.setViewportSize({ width: 390, height: 844 });
  await expect(p.locator("[data-filter-toggle]")).toBeFocused();
  await p.setViewportSize({ width: 1280, height: 900 });
  await expect(p.locator("#group-search")).toBeFocused();
  await p.locator("#group-search").fill("Brookline");
  await expect(p.locator("[data-group]:visible")).toHaveCount(1);
  await p.locator("#group-search").fill("Newton");
  const dandelions = p.locator("#dandelions-of-the-heart-sangha");
  await expect(dandelions).toBeVisible();
  await expect(dandelions.locator(".group-metadata dd").last()).toHaveText("Newton");
  await expect(dandelions.getByRole("link", { name: "Get Directions" })).toHaveCount(0);
  await p.locator("#group-search").fill("impossible-search-qzx");
  await expect(p.locator("#no-groups")).toBeVisible();
  await p.locator("[data-clear-filters]").click();
  await expect(p.locator("[data-group]:visible")).toHaveCount(13);
  await expect(p.locator("#mindful-lunch")).toHaveCount(0);
  await p.locator(".filters summary").first().click();
  await p.getByLabel("Online", { exact: true }).check();
  await expect(p.locator("[data-group]:visible")).toHaveCount(4);
  await expect(p.locator("#living-the-14-sangha")).toBeVisible();
  await p.locator("[data-group]:visible").first().locator("summary").focus();
  await p.keyboard.press("Enter");
  await expect(
    p.locator("[data-group]:visible").first().getByRole("link", { name: "Message via Plumline" }),
  ).toBeVisible();
  stateScan = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  expect(stateScan.violations).toEqual([]);
  await p.goto(base + "/resources.html#resource-sangha-resources");
  await expect(p.locator("#resource-sangha-resources")).toBeVisible();
  await expect(p.locator('main a[href="meeting-and-bell-minding-flow.html"]')).toHaveCount(0);
  await expect(p.locator("#resource-five-mindfulness-trainings h3")).toHaveText(
    "Five Mindfulness Trainings",
  );
  const fourteenTrainings = p.locator("#resource-fourteen-mindfulness-trainings");
  const trainingLink = fourteenTrainings.getByRole("link", {
    name: "Fourteen Mindfulness Trainings",
  });
  const centersLink = fourteenTrainings.getByRole("link", { name: "monastic practice centers" });
  await expect(trainingLink).toHaveAttribute("href", /\/the-14-mindfulness-trainings$/);
  await expect(centersLink).toHaveAttribute(
    "href",
    "https://plumvillage.org/monastic-practice-centres/",
  );
  await trainingLink.focus();
  await p.keyboard.press(tabKey);
  await expect(centersLink).toBeFocused();
  expect(
    await fourteenTrainings.evaluate((card) => {
      card.scrollIntoView({ block: "center" });
      const { left, top } = card.getBoundingClientRect();
      return document.elementFromPoint(left + 8, top + 8)?.closest("a")?.textContent;
    }),
  ).toBe("Fourteen Mindfulness Trainings");
  await p.goto(base + "/subscribe-calendar.html");
  for (const s of await p.locator(".tutorials summary").all()) {
    await s.focus();
    await p.keyboard.press("Enter");
    await expect(s.locator("..")).toHaveAttribute("open", "");
  }
  await p.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("Blocked")) },
      configurable: true,
    }),
  );
  await p.locator("[data-copy]").click();
  await expect(p.locator(".copy-status")).toContainText("URL is selected");
  await expect(p.locator("#calendar-url")).toBeFocused();
  await p.route("**/api/events", (r) =>
    r.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
  );
  await p.goto(base + "/find-a-sangha.html");
  await expect(p.locator(".agenda-status")).toContainText("temporarily unavailable");
  await expect(p.locator("[data-retry]")).toBeEnabled();
  const events = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    title: i === 0 ? "<img src=x onerror=alert(1)>" : "Sample " + i,
    start: "2026-11-02T15:00:00Z",
    end: "2026-11-02T16:00:00Z",
    description: "Plain text <b>content</b>",
    location: "A venue",
    url: "javascript:alert(1)",
    allDay: false,
  }));
  events[1].end = "2026-11-04T16:00:00Z";
  events[2] = { ...events[2], start: "2026-11-02", end: "2026-11-04", allDay: true };
  await p.unroute("**/api/events");
  await p.route("**/api/events", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ events, retrievedAt: new Date().toISOString() }),
    }),
  );
  await p.locator("[data-retry]").click();
  await p.locator("[data-month-next]").click();
  await expect(p.locator(".agenda-item")).toHaveCount(10);
  await expect(p.locator(".agenda-item img")).toHaveCount(0);
  await expect(p.locator(".agenda-item").nth(1)).toContainText("Wed, Nov 4, 2026");
  await expect(p.locator(".agenda-item").nth(2)).toContainText("Tue, Nov 3, 2026 · All day");
  await p.locator("[data-more]").click();
  await expect(p.locator(".agenda-item")).toHaveCount(12);
  await p.unroute("**/api/events");
  await p.route("**/api/events", (r) => r.fulfill({ status: 503, body: "{}" }));
  await p.locator("[data-retry]").click();
  await expect(p.locator(".agenda-status")).toContainText("Previously loaded events remain");
  await expect(p.locator(".agenda-item")).toHaveCount(12);
  await p.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    await p.goto(base + "/");
    await expect(p.locator("h1")).toBeVisible();
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const lede = p.locator(".hero .lede");
    await expect(lede).toHaveText(
      "A community of engaged Buddhist practitioners practicing in the Plum Village Tradition of Zen Master Thích Nhất Hạnh (“Thầy”).",
    );
    await expect(p.locator(".identity-calligraphy img")).toBeVisible();
    const { gap, left, right } = await lede.evaluate((copy) => {
      const actions = document.querySelector(".hero .actions").getBoundingClientRect();
      return {
        gap: actions.top - copy.getBoundingClientRect().bottom,
        left: actions.left,
        right: actions.right,
      };
    });
    expect(gap).toBeGreaterThanOrEqual(24);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(right).toBeLessThanOrEqual(width);
    await p.goto(base + "/our-practice.html");
    await expect(p.getByRole("heading", { name: "What is Mindfulness?" })).toBeVisible();
    const intro = await p.locator(".practice-page .split").boundingBox();
    const mindfulness = await p.locator(".practice-reading > h2").first().boundingBox();
    const previousParagraph = await p
      .locator(".practice-reading > p:has(+ h2:nth-of-type(2))")
      .boundingBox();
    const nextHeading = await p.locator(".practice-reading > h2").nth(1).boundingBox();
    expect(mindfulness.y - (intro.y + intro.height)).toBeCloseTo(
      nextHeading.y - (previousParagraph.y + previousParagraph.height),
    );
  }
  await p.goto(base + "/");
  // Text spacing overrides and 200% text enlargement; 320px viewport models 400% reflow at 1280px.
  await p.setViewportSize({ width: 1280, height: 800 });
  await p.addStyleTag({
    content:
      "body{font-size:36px!important} p{margin-bottom:2em!important} *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}",
  });
  expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await p.setViewportSize({ width: 390, height: 320 });
  await p.locator("[data-open-drawer]").click();
  const short = await p
    .locator(".drawer")
    .evaluate((e) => ({ height: e.clientHeight, scroll: e.scrollHeight }));
  expect(short.scroll).toBeGreaterThan(short.height);
  await p.locator(".drawer a").last().scrollIntoViewIfNeeded();
  await expect(p.locator(".drawer a").last()).toBeInViewport();
  await p.keyboard.press("Escape");
  results.push({
    engine: name,
    version: browser.version(),
    passed: true,
    pageErrors: errors,
    externalMapBlocked: true,
  });
  expect(errors).toEqual([]);
  await browser.close();
}
await fs.writeFile(
  "outputs/release-verification/interactions.json",
  JSON.stringify(results, null, 2),
);
console.log(results);
