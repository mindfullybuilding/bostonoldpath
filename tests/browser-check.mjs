import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const pages = [
  "/",
  "/new-here.html",
  "/our-practice.html",
  "/our-community.html",
  "/find-a-sangha.html",
  "/resources.html",
  "/community-voices.html",
  "/newsletters.html",
  "/join-mailing-list.html",
  "/sangha-overview.html",
  "/sangha-facilitation.html",
  "/minding-the-bell.html",
  "/meeting-and-bell-minding-flow.html",
  "/dharma-sharing-guidelines.html",
  "/accessibility.html",
  "/photo-credits.html",
  "/privacy.html",
];
await fs.mkdir("outputs/release-verification", { recursive: true });
const results = [];
for (const url of pages) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + url);
  await page.waitForTimeout(150);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  const widths = [];
  for (const width of [320, 390, 430, 768, 820, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll("body *")]
        .filter(
          (el) =>
            el.getBoundingClientRect().right > innerWidth + 2 &&
            getComputedStyle(el).display !== "none",
        )
        .slice(0, 8)
        .map((el) => `${el.tagName}.${el.className}`),
    }));
    widths.push(overflow);
  }
  results.push({
    url,
    scope: "First-party HTML; external iframes evaluated separately in third-party.json",
    violations: axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
    widths,
  });
}
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(base + "/");
await page.screenshot({ path: "outputs/release-verification/home-desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "outputs/release-verification/home-mobile.png", fullPage: true });
await fs.writeFile("outputs/release-verification/automated.json", JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    results
      .filter((r) => r.violations.length || r.widths.some((w) => w.scroll > w.width))
      .map((r) => ({
        url: r.url,
        violations: r.violations,
        overflow: r.widths.filter((w) => w.scroll > w.width),
      })),
    null,
    2,
  ),
);
await browser.close();
