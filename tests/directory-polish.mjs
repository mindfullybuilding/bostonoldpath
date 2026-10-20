import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const out = "outputs/directory-polish-2026-10-20";
await fs.mkdir(out, { recursive: true });
const intro =
  "Sangha offers an opportunity to connect authentically with others and to feel safe enough to look at our own suffering in order to change it. We’ve learned “what we don’t transform, we transmit.” We each take in the Dharma through our own filters and, happily, it manifests in each of us differently.";
const report = [];
for (const [name, engine] of [
  ["Chromium", chromium],
  ["WebKit", webkit],
]) {
  const b = await engine.launch();
  const context = await b.newContext();
  const p = await context.newPage();
  await p.route("https://www.google.com/maps/**", (r) => r.abort());
  await p.route("**/api/events", (r) =>
    r.fulfill({
      json: { events: [], timeZone: "America/New_York", retrievedAt: new Date().toISOString() },
    }),
  );
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.goto(base, { waitUntil: "networkidle" });
  await expect(p).toHaveTitle("Mindfulness Communities of Greater Boston");
  const lines = await p
    .locator(".hero .lede")
    .evaluate((e) =>
      Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)),
    );
  expect(lines).toBe(2);
  await expect(p.locator(".schedule-context")).toBeVisible();
  await expect(p.locator(".schedule-context")).toHaveText(intro);
  if (name === "Chromium") {
    await p.screenshot({ path: out + "/hero-1440x1000.png" });
    await p.locator(".home-schedule").scrollIntoViewIfNeeded();
    await p.screenshot({ path: out + "/schedule-1440x1000.png" });
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await expect(p.locator(".schedule-context")).toBeHidden();
  const info = p.getByRole("button", { name: "About practicing with a sangha" });
  await info.press("Enter");
  await expect(p.locator(".schedule-context")).toBeVisible();
  await info.press("Enter");
  await expect(p.locator(".schedule-context")).toBeHidden();
  for (const selector of [".schedule-title", ".full-sangha-schedule a"]) {
    const box = await p.locator(selector).boundingBox();
    expect(Math.abs(box.x + box.width / 2 - 195)).toBeLessThan(2);
  }
  const dateBox = await p.locator(".schedule-date").boundingBox();
  const titleBox = await p.locator(".schedule-title").boundingBox();
  expect(dateBox.y + dateBox.height).toBeLessThan(titleBox.y);
  expect(Math.abs(dateBox.x + dateBox.width / 2 - 195)).toBeLessThan(1);
  const headingBox = await p.locator("#today-sanghas-title").boundingBox();
  const infoBox = await info.boundingBox();
  expect(infoBox.x).toBeGreaterThanOrEqual(headingBox.x + headingBox.width);
  expect(
    Math.abs(infoBox.y + infoBox.height / 2 - headingBox.y - headingBox.height / 2),
  ).toBeLessThan(2);
  if (name === "Chromium") {
    await p.locator(".home-schedule").scrollIntoViewIfNeeded();
    await p.screenshot({ path: out + "/schedule-390x844.png" });
  }
  await p.getByRole("button", { name: "Open menu" }).click();
  await expect(p.locator(".drawer-trigger")).toHaveText(["About", "Get Involved"]);
  const primary = p.locator('.drawer nav > a[href="/find-a-sangha.html"]');
  expect(await primary.evaluate((e) => getComputedStyle(e).color)).toBe("rgb(255, 255, 255)");
  await p.locator(".drawer-trigger").first().click();
  await expect(p.locator("#drawer-panel-0")).toBeVisible();
  await p.keyboard.press("Escape");
  await p.goto(base + "/find-a-sangha.html");
  await expect(p.locator(".finder-heading > p")).toHaveText(intro);
  await expect(p.locator(".finder-shortcuts a")).toHaveText("Jump to Community events & calendar");
  await expect(p.locator(".region-map")).toBeHidden();
  await expect(p.locator(".calendar-disclosure")).toHaveCount(0);
  await expect(p.locator("#group-count")).toHaveText("13 of 13 sanghas");
  const toggle = p.getByRole("button", { name: "Filter groups", exact: true });
  const t = await toggle.boundingBox(),
    c = await p.locator("#group-count").boundingBox();
  expect(t.x + t.width).toBeLessThan(c.x);
  await toggle.click();
  await p.locator("#group-search").fill("Brookline");
  await expect(p.locator("#group-count")).toHaveText("2 of 13 sanghas");
  await p.getByRole("button", { name: "Close filters", exact: true }).click();
  await expect(p.locator("#group-count")).toHaveText("2 of 13 sanghas");
  await expect(toggle).toBeFocused();
  await expect(p.locator("#group-filters")).toBeHidden();
  await toggle.click();
  await p.locator("#group-search").fill("nomatch123");
  await expect(p.locator("#group-count")).toHaveText("0 of 13 sanghas");
  await p.locator("#group-search").press("Escape");
  await p.locator("#no-groups button").click();
  await expect(toggle).toBeFocused();
  await expect(p.locator("#group-count")).toHaveText("13 of 13 sanghas");
  if (name === "Chromium") {
    await p.evaluate(() => scrollTo(0, 0));
    await p.screenshot({ path: out + "/finder-390x844.png" });
  }
  for (const width of [320, 390, 1440]) {
    await p.setViewportSize({ width, height: 1000 });
    const first = p.locator("[data-group]").first();
    const summary = first.locator("summary");
    await summary.click();
    await expect(first.getByRole("link", { name: "Get directions", exact: true })).toBeVisible();
    const bounds = await summary.boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(48);
    expect(await summary.evaluate((e) => getComputedStyle(e).borderBottomLeftRadius)).toBe("14px");
    const contact = await first.locator(".organizer-contact").boundingBox();
    expect(Math.abs(contact.y - bounds.y)).toBeLessThan(2);
    await summary.click();
  }
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.locator("[data-group]").nth(3).scrollIntoViewIfNeeded();
  const filter = await p.locator(".filters").boundingBox();
  expect(filter.y).toBeGreaterThan(88);
  expect(filter.y).toBeLessThan(140);
  await expect(p.locator(".region-map")).toBeVisible();
  await expect(p.locator(".region-map > h2")).toHaveText("Regional sangha map");
  if (name === "Chromium") {
    await p.evaluate(() => scrollTo(0, 0));
    await p.screenshot({ path: out + "/finder-1440x1000.png" });
  }
  await p.goto(base + "/community-voices.html");
  await expect(p.locator(".voices-publications img")).toHaveCount(0);
  const cards = p.locator(".voices-publications article");
  for (const selector of ["h2", "p", "a"]) {
    const a = await cards.nth(0).locator(selector).boundingBox(),
      b = await cards.nth(1).locator(selector).boundingBox();
    expect(Math.abs(a.y - b.y)).toBeLessThan(2);
    expect(
      Math.abs((await cards.nth(0).boundingBox()).width - (await cards.nth(1).boundingBox()).width),
    ).toBeLessThan(2);
  }
  const poetryMeasure = await p.locator(".poetry-feature").evaluate((e) => {
    const range = document.createRange();
    range.selectNodeContents(e.querySelector("h2"));
    return {
      paragraph: e.querySelector("p").getBoundingClientRect().width,
      heading: range.getBoundingClientRect().width,
    };
  });
  expect(poetryMeasure.paragraph).toBeLessThanOrEqual(poetryMeasure.heading + 1);
  const firstPublication = await cards.nth(0).boundingBox();
  const lastPublication = await cards.nth(1).boundingBox();
  const submission = await p.locator(".voices-submission .reading").boundingBox();
  expect(Math.abs(submission.x - firstPublication.x)).toBeLessThan(1);
  expect(
    Math.abs(submission.x + submission.width - lastPublication.x - lastPublication.width),
  ).toBeLessThan(1);
  expect(
    await p.locator(".voices-publications").evaluate((e) => getComputedStyle(e).columnGap),
  ).toBe("48px");
  await expect(p.locator(".voices-submission")).not.toContainText("Opens a Google Form");
  await expect(p.locator(".voices-submission a")).toHaveAttribute(
    "href",
    "https://forms.gle/ab3cBUX3K76PppPA9",
  );
  if (name === "Chromium")
    await p.screenshot({ path: out + "/voices-1440x1000.png", fullPage: true });
  await p.setViewportSize({ width: 390, height: 844 });
  for (const h of await p.locator("main h1,main h2").all())
    expect(await h.evaluate((e) => getComputedStyle(e).textAlign)).toBe("center");
  if (name === "Chromium")
    await p.screenshot({ path: out + "/voices-390x844.png", fullPage: true });
  const axe = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  expect(axe.violations).toEqual([]);
  await p.goto(base + "/join-mailing-list.html");
  await expect(p.locator('main a[href="/newsletters.html"]')).toHaveCount(0);
  report.push({ engine: name, version: b.version(), heroLines: lines, result: "pass" });
  await b.close();
}
await fs.writeFile(out + "/interactions.json", JSON.stringify(report, null, 2));
console.log(report);
