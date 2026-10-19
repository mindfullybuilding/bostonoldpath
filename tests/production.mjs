import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = "https://bostonmindfulness.vercel.app";
const browser = await chromium.launch();
const context = await browser.newContext();
const p = await context.newPage();
const requests = [];
for (const path of [
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
  "/api/events",
  "/assets/licensed/thich-nhat-hanh.jpg",
  "/assets/licensed/plum-village-hall.jpg",
]) {
  const r = await p.request.get(base + path);
  requests.push({ path, status: r.status() });
  expect(r.ok()).toBe(true);
}
const api = await (await p.request.get(base + "/api/events")).json();
expect(Array.isArray(api.events)).toBe(true);
expect(api.timeZone).toBe("America/New_York");
expect(Date.parse(api.retrievedAt)).not.toBeNaN();
for (const [from, to] of [
  ["/home.html", "/"],
  ["/our-community-feedback-2.html", "/our-community.html"],
  ["/resources-feedback-3.html", "/resources.html"],
  ["/find-a-sangha-feedback-1.html", "/find-a-sangha.html"],
  ["/mcgb-homepage-wireframe-feedback-3.html", "/"],
]) {
  const r = await p.request.get(base + from, { maxRedirects: 0 });
  expect([301, 307, 308]).toContain(r.status());
  expect(r.headers().location).toBe(to);
  requests.push({ path: from, status: r.status(), location: r.headers().location });
}
const missing = await p.request.get(base + "/assets/GBCOM%20Website%20Working%20Group.pdf");
expect(missing.status()).toBe(404);
await p.setViewportSize({ width: 1440, height: 1000 });
await p.goto(base);
await expect(p.locator("h1")).toHaveText("A deep bow to you, dear friend.");
expect(await p.locator(".site-header").evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
  "rgb(244, 223, 146)",
);
expect(
  await p
    .locator(".site-header .button.primary")
    .evaluate((e) => getComputedStyle(e).backgroundColor),
).toBe("rgb(255, 255, 255)");
await p.locator(".nav-disclosure button").first().click();
await expect(p.locator("#resources-menu")).toBeVisible();
await p.keyboard.press("Escape");
await p.screenshot({ path: "outputs/release-verification/live-desktop.png" });
await p.setViewportSize({ width: 390, height: 844 });
await p.screenshot({ path: "outputs/release-verification/live-mobile.png" });
await p.getByRole("button", { name: "Open menu" }).click();
await expect(p.locator("dialog")).toBeVisible();
await p.keyboard.press("Escape");
await p.goto(base + "/find-a-sangha.html");
await p.getByRole("button", { name: "Filter groups" }).click();
await p.locator("#group-search").fill("Brookline");
await expect(p.locator("[data-group]:visible")).toHaveCount(2);
await p.locator("[data-group]:visible").first().locator("summary").click();
await expect(
  p.locator("[data-group]:visible").first().getByRole("link", { name: "Email the organizer" }),
).toBeVisible();
await p.locator('a[href="#subscribe-calendar"]').first().click();
await p.locator("[data-copy]").click();
await expect(p.locator(".copy-status")).toContainText(/copied|selected/);
await expect(p.locator(".calendar-disclosure")).not.toHaveAttribute("open", "");
await p.goto(base + "/community-voices.html");
await expect(
  p.getByRole("link", { name: "Submit your contribution", exact: true }),
).toHaveAttribute("href", "https://forms.gle/ab3cBUX3K76PppPA9");
const report = {
  checkedAt: new Date().toISOString(),
  base,
  requests,
  api: {
    status: 200,
    eventCount: api.events.length,
    retrievedAt: api.retrievedAt,
    timeZone: api.timeZone,
  },
  privateReferenceStatus: missing.status(),
  desktopHeader: "butter yellow with white primary action",
  greetingVerified: true,
  mobileDrawerVerified: true,
  directoryVerified: true,
  calendarCopyVerified: true,
  contributionDestinationVerified: true,
  browserVersion: browser.version(),
};
await fs.writeFile("outputs/release-verification/production.json", JSON.stringify(report, null, 2));
console.log(report);
await browser.close();
