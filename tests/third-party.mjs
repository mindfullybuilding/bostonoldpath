import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const runtimeErrors = [];
p.on("pageerror", (e) => runtimeErrors.push({ message: e.message, stack: e.stack }));
await p.goto(base + "/find-a-sangha.html");
await p.locator(".region-map iframe").scrollIntoViewIfNeeded();
await p.frameLocator(".region-map iframe").locator("body").waitFor({ state: "visible" });
// Wait for asynchronously rendered map controls before reporting their limitations.
await p.waitForTimeout(2500);
const r = await new AxeBuilder({ page: p })
  .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
  .analyze();
const violations = r.violations.map((v) => ({
  id: v.id,
  impact: v.impact,
  nodes: v.nodes.map((n) => ({ target: n.target, html: n.html, summary: n.failureSummary })),
}));
const report = {
  checkedAt: new Date().toISOString(),
  base,
  scope:
    "Full finder including anonymously loaded Google map; Google sign-in calendar kept closed.",
  violations,
  runtimeErrors,
  limitation:
    "External map controls are not controlled by MCGB. The full directory, schedules and organizer contacts remain usable independently. This report does not certify full-page WCAG conformance.",
};
await fs.writeFile(
  "outputs/release-verification/third-party.json",
  JSON.stringify(report, null, 2),
);
console.log({
  violations: violations.map((v) => ({ id: v.id, impact: v.impact, count: v.nodes.length })),
});
await b.close();
