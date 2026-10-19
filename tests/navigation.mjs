import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const results = [];
for (const [engineName, engine] of [
  ["Chromium", chromium],
  ["WebKit", webkit],
]) {
  console.log("Checking navigation: " + engineName);
  const browser = await engine.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route("https://www.google.com/maps/**", (r) => r.abort());
  const p = await context.newPage();
  const go = async (group, name) => {
    const trigger = p.locator(".desktop-nav").getByRole("button", { name: group, exact: true });
    await p.waitForLoadState("load");
    if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await p.locator(".desktop-nav").getByRole("link", { name, exact: true }).click();
  };
  await p.goto(base);
  await expect(p.locator(".desktop-nav > .nav-disclosure > button")).toHaveText([
    "About",
    "Get Involved",
    "Community Voices",
  ]);
  await expect(p.locator(".desktop-nav > a")).toHaveText("Mailing Lists");
  await expect(p.locator(".site-header .button")).toHaveText("Find a Group");
  const about = p.locator(".desktop-nav").getByRole("button", { name: "About", exact: true });
  await about.press("Enter");
  await expect(about).toHaveAttribute("aria-expanded", "true");
  await expect(p.locator("#nav-panel-0 a")).toHaveText([
    "Newcomers",
    "Our Practice",
    "Greater Boston Community",
    "Resources",
  ]);
  await p.locator("#nav-panel-0 a").first().press("Escape");
  await expect(about).toBeFocused();
  await expect(about).toHaveAttribute("aria-expanded", "false");
  await about.press("ArrowDown");
  await expect(p.locator("#nav-panel-0 a").first()).toBeFocused();
  await p.locator("#nav-panel-0 a").first().press("Escape");
  await go("About", "Newcomers");
  await expect(p.locator("h1")).toHaveText("Newcomers");
  await expect(p.locator(".river-stops > li")).toHaveCount(5);
  await expect(p.locator(".river-illustration")).toHaveAttribute("alt", "");
  await p.locator(".river-stops").getByRole("link", { name: "Find a Sangha", exact: true }).click();
  await expect(p.locator("[data-group]")).toHaveCount(13);
  const first = p.locator("[data-group]").first();
  await expect(first.getByRole("link", { name: "Contact organizer", exact: true })).toHaveAttribute(
    "href",
    /^mailto:/,
  );
  await first.locator("summary").click();
  await expect(first.getByRole("link", { name: "Get directions", exact: true })).toHaveAttribute(
    "href",
    /^https:\/\/www\.google\.com\/maps\/dir\//,
  );
  await go("Get Involved", "Events Calendar");
  await expect(p).toHaveURL(base + "/find-a-sangha.html#calendar");
  await p
    .locator("#calendar")
    .getByRole("link", { name: "Subscribe to calendar", exact: true })
    .click();
  await expect(p.locator("#subscribe-calendar")).toBeInViewport();
  await go("Community Voices", "Overview");
  await expect(
    p.locator("main").getByRole("link", { name: "Submit your contribution", exact: true }),
  ).toHaveAttribute("href", "https://forms.gle/ab3cBUX3K76PppPA9");
  await expect(p.locator(".poetry-feature a")).toHaveAttribute(
    "href",
    "https://buddhistpoetryexchange.blogspot.com",
  );
  await go("Community Voices", "Newsletter");
  await expect(p.locator(".year-group > h2")).toHaveText(["2026", "2022"]);
  await expect(p.locator(".issue-card a")).toHaveCount(3);
  for (const a of await p.locator(".issue-card a").all())
    expect((await p.request.get(new URL(await a.getAttribute("href"), base).href)).ok()).toBe(true);
  await p.locator(".desktop-nav > a").click();
  await expect(p.locator('main a[href^="mailto:"][href*="subscribe@"]')).toHaveCount(2);
  await p.locator("[data-mail-choice]").first().uncheck();
  await expect(p.locator("#practice-subscribe")).toBeHidden();
  await p.locator("[data-mail-choice]").last().uncheck();
  await expect(p.locator("#mail-selection")).toContainText("No lists selected");
  await p.locator("[data-mail-choice]").first().check();
  await expect(p.locator("#practice-subscribe")).toBeVisible();
  for (const guide of [
    "sangha-overview",
    "sangha-facilitation",
    "minding-the-bell",
    "meeting-and-bell-minding-flow",
    "dharma-sharing-guidelines",
  ]) {
    await p.goto(base + "/resources.html#resource-sangha-resources");
    await p.locator(`#resource-sangha-resources a[href="${guide}.html"]`).click();
    await expect(p.locator("h1")).toBeVisible();
    await expect(p.locator(".guide-navigation a")).toHaveCount(4);
    await p
      .getByRole("navigation", { name: "Breadcrumb", exact: true })
      .getByRole("link", { name: "Sangha resources", exact: true })
      .click();
    await expect(p.locator("#resource-sangha-resources")).toHaveAttribute("open", "");
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(base);
  await p.getByRole("button", { name: "Open menu", exact: true }).click();
  const drawer = p.locator(".drawer");
  await expect(drawer.locator(".drawer-trigger")).toHaveText([
    "AboutOpen",
    "Get InvolvedOpen",
    "Community VoicesOpen",
  ]);
  await drawer.getByRole("button", { name: "About", exact: true }).click();
  const scan = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  expect(scan.violations).toEqual([]);
  await drawer.getByRole("link", { name: "Newcomers", exact: true }).click();
  await expect(p.locator("h1")).toHaveText("Newcomers");
  await expect(drawer).not.toBeVisible();
  results.push({
    engine: engineName,
    version: browser.version(),
    status: "pass",
    journeys: [
      "arrow-free disclosures, keyboard Escape/ArrowDown",
      "newcomer river → finder/contact/directions",
      "Events → subscriptions",
      "Voices → zine/newsletter PDFs",
      "mailing selection",
      "five standalone guides → parent",
      "mobile grouped drawer → newcomer",
    ],
  });
  await browser.close();
}
await fs.mkdir("outputs/release-verification", { recursive: true });
await fs.writeFile(
  "outputs/release-verification/navigation.json",
  JSON.stringify(results, null, 2),
);
console.log(results);
