import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import { dailySanghas } from "../public/assets/sangha-schedule.js";
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
  "/subscribe-calendar.html",
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
  "/assets/illustrations/newcomer-river.png",
  "/assets/calendar-view.js",
  "/assets/sangha-schedule.js",
  "/assets/illustrations/community-path.png",
  "/assets/icons/funnel.svg",
  "/assets/icons/info.svg",
  "/assets/illustrations/community-forest.jpg",
  "/assets/licensed/arnold-arboretum.jpg",
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
await expect(p).toHaveTitle("Mindfulness Communities of Greater Boston");
expect(await p.locator(".site-header").evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
  "rgb(54, 123, 202)",
);
expect(
  await p
    .locator(".site-header .button.primary")
    .evaluate((e) => getComputedStyle(e).backgroundColor),
).toBe("rgb(255, 255, 255)");
expect(await p.locator(".site-header").evaluate((e) => getComputedStyle(e).borderRadius)).toBe(
  "0px",
);
expect(await p.locator(".site-footer").evaluate((e) => getComputedStyle(e).borderRadius)).toBe(
  "0px",
);
await expect(p.locator(".hero-secondary")).toHaveText("New? Start here.");
const today = dailySanghas(JSON.parse(await fs.readFile("site/sanghas.json", "utf8")));
await expect(p.locator("[data-today-sanghas] > ul > li")).toHaveCount(today.scheduled.length);
await expect(p.locator(".path-stop")).toHaveCount(7);
await expect(p.locator(".desktop-nav .nav-trigger")).toHaveCount(2);
await p.locator('.desktop-nav > a[href="/community-voices.html"]').click();
await expect(p.locator("h1")).toHaveText("Community Voices");
await p.goto(base);
await p.locator("h1").click();
await p.screenshot({ path: "outputs/release-verification/live-desktop.png" });
await p.setViewportSize({ width: 390, height: 844 });
await expect(p.locator(".compact-brand")).toHaveText("Mindfulness Communities of Greater Boston");
await p.screenshot({ path: "outputs/release-verification/live-mobile.png" });
await p.getByRole("button", { name: "Open menu" }).click();
await expect(p.locator("dialog")).toBeVisible();
await p.keyboard.press("Escape");
await p.goto(base + "/find-a-sangha.html");
await expect(p.locator(".month-grid")).toBeVisible();
await p.getByRole("button", { name: "Filter groups" }).click();
await p.locator("#group-search").fill("Brookline");
await expect(p.locator("[data-group]:visible")).toHaveCount(2);
await p.locator("[data-group]:visible").first().locator("summary").click();
await expect(
  p.locator("[data-group]:visible").first().getByRole("link", { name: "Contact organizer" }),
).toBeVisible();
await expect(
  p
    .locator("[data-group]:visible")
    .first()
    .getByRole("link", { name: "Get directions", exact: true }),
).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/dir\//);
await p.locator('a[href="/subscribe-calendar.html"]').first().click();
await p.waitForLoadState("load");
await p.locator("[data-copy]").click();
await expect(p.locator(".copy-status")).toContainText(/copied|selected/);
await expect(p.locator("h1")).toHaveText("Subscribe to calendar");
await p.goto(base + "/community-voices.html");
await expect(
  p.getByRole("link", { name: "Submit your contribution", exact: true }),
).toHaveAttribute("href", "https://forms.gle/ab3cBUX3K76PppPA9");
await p.goto(base + "/new-here.html");
await expect(p.locator(".page-intro em")).toHaveText("“Go as a river” — Thích Nhất Hạnh");
await expect(p.locator(".river-stops > li")).toHaveCount(5);
expect(await p.locator(".page-intro .reading").evaluate((e) => getComputedStyle(e).textAlign)).toBe(
  "left",
);
await p.screenshot({ path: "outputs/release-verification/live-newcomers-mobile.png" });
await p.goto(base + "/newsletters.html");
await expect(p.locator(".year-group > h2")).toHaveText(["2026", "2022"]);
await expect(p.locator(".issue-card a")).toHaveCount(3);
await p.goto(base + "/join-mailing-list.html");
await p.locator("[data-mail-choice]").first().uncheck();
await expect(p.locator("#practice-subscribe")).toBeHidden();
await p.locator("[data-mail-choice]").first().check();
await expect(p.locator("#practice-subscribe")).toBeVisible();
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
  desktopHeader: "Continental Blue water gloss with accessible label zone and white primary action",
  greetingVerified: true,
  todayScheduleVerified: true,
  gardenPathVerified: true,
  newcomerRiverAndQuoteVerified: true,
  newsletterYearGroupsVerified: true,
  mailingSelectionVerified: true,
  mobileDrawerVerified: true,
  directoryVerified: true,
  calendarCopyVerified: true,
  contributionDestinationVerified: true,
  browserVersion: browser.version(),
};
await fs.writeFile("outputs/release-verification/production.json", JSON.stringify(report, null, 2));
console.log(report);
await browser.close();
