import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch();
const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const results = [];
const scan = async (name) => {
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  results.push({
    name,
    violations: r.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  });
  expect(r.violations).toEqual([]);
};
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(base + "/");
for (const [i, name] of ["Resources dropdown", "Community dropdown"].entries()) {
  await page.locator(".nav-disclosure button").nth(i).click();
  await scan(name);
  await page.keyboard.press("Escape");
}
await page.screenshot({
  path: "outputs/release-verification/final-home-desktop.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "outputs/release-verification/final-home-mobile.png",
  fullPage: true,
});
await page.locator("[data-open-drawer]").click();
await scan("Mobile drawer");
await page.screenshot({ path: "outputs/release-verification/mobile-drawer.png" });
await page.keyboard.press("Escape");
await page.goto(base + "/resources.html");
await page.locator("details").evaluateAll((els) => els.forEach((el) => (el.open = true)));
await scan("All resource disclosures open");
await page.goto(base + "/find-a-sangha.html");
await page.locator("[data-filter-toggle]").click();
await page.locator("#group-search").fill("zzzz-nothing");
await expect(page.locator("#no-groups")).toBeVisible();
await scan("No matching groups");
await page.locator("[data-clear-filters]").click();
await page.locator("[data-group] summary").first().click();
await scan("Group details and organizer contact");
await page.goto(base + "/find-a-sangha.html#subscribe-calendar");
await page
  .locator(".tutorials details")
  .evaluateAll((els) => els.forEach((el) => (el.open = true)));
await page.locator("[data-copy]").click();
await expect(page.locator(".copy-status")).toContainText("copied");
expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("feed.ics");
await scan("Subscription guides open and URL copied");
await page.route("**/api/events", (route) => route.fulfill({ status: 503, body: "{}" }));
await page.reload();
await expect(page.locator(".agenda-status")).toContainText("temporarily unavailable");
await scan("Feed error state");
await page.screenshot({ path: "outputs/release-verification/calendar-error.png", fullPage: true });
await page.route("https://calendar.google.com/**", (r) => r.abort());
await page.route("https://www.google.com/maps/**", (r) => r.abort());
await page.reload();
await expect(page.locator("#subscribe-calendar")).toBeVisible();
await expect(page.locator("[data-group]")).toHaveCount(13);
results.push({ name: "Blocked map and calendar embeds", alternativeContentAvailable: true });
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(base + "/find-a-sangha.html");
await page.screenshot({ path: "outputs/release-verification/finder-desktop.png", fullPage: true });
await fs.writeFile("outputs/release-verification/states.json", JSON.stringify(results, null, 2));
console.log(results);
await browser.close();
