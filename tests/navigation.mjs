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
    const trigger = p.locator(".desktop-nav").getByRole("link", { name: group, exact: true });
    await p.waitForLoadState("load");
    if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.press("ArrowDown");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await p.locator(".desktop-nav").getByRole("link", { name, exact: true }).click();
  };
  await p.goto(base);
  await expect(p.locator(".desktop-nav > .nav-disclosure > a")).toHaveText([
    "About",
    "Get Involved",
  ]);
  await expect(p.locator(".desktop-nav > a")).toHaveText(["Community Voices", "Mailing Lists"]);
  await expect(p.locator(".site-header .button")).toHaveText("Find a Sangha");
  const about = p.locator(".desktop-nav").getByRole("link", { name: "About", exact: true });
  await about.click();
  await expect(p).toHaveURL(base + "/our-community.html");
  await p.locator(".desktop-nav").getByRole("link", { name: "Get Involved", exact: true }).click();
  await expect(p).toHaveURL(base + "/find-a-sangha.html");
  await p.goto(base);
  await about.press("ArrowDown");
  await expect(about).toHaveAttribute("aria-expanded", "true");
  await expect(p.locator("#nav-panel-0 a")).toHaveText([
    "Newcomers",
    "Our Practice",
    "Our Community",
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
  const first = p.locator("#dandelions-of-the-heart-sangha");
  await expect(first.getByRole("link", { name: "Contact Organizer", exact: true })).toHaveAttribute(
    "href",
    /^mailto:/,
  );
  await first.locator("summary").click();
  await expect(first.locator(".metadata")).toContainText(
    "Contact the organizer for meeting location and online details.",
  );
  await go("Get Involved", "Events Calendar");
  await expect(p).toHaveURL(base + "/find-a-sangha.html#calendar");
  await p
    .locator("#calendar")
    .getByRole("link", { name: "Subscribe to Calendar", exact: true })
    .click();
  await expect(p).toHaveURL(base + "/subscribe-calendar.html");
  await expect(p.locator("h1")).toHaveText("Subscribe to Calendar");
  await p.locator('.desktop-nav > a[href="/community-voices.html"]').click();
  await expect(
    p.locator("main").getByRole("link", { name: "Submit Your Contribution", exact: true }),
  ).toHaveAttribute("href", "https://forms.gle/ab3cBUX3K76PppPA9");
  await expect(p.locator(".poetry-feature a")).toHaveAttribute(
    "href",
    "https://buddhistpoetryexchange.blogspot.com",
  );
  await p
    .locator("main")
    .getByRole("link", { name: "Browse Newsletter Editions", exact: true })
    .click();
  await expect(p.locator(".year-group > h2")).toHaveText(["2026", "2022"]);
  await expect(p.locator(".issue-card a")).toHaveCount(3);
  for (const a of await p.locator(".issue-card a").all())
    expect((await p.request.get(new URL(await a.getAttribute("href"), base).href)).ok()).toBe(true);
  await p.locator('.desktop-nav > a[href="/join-mailing-list.html"]').click();
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
    "dharma-sharing-guidelines",
  ]) {
    await p.goto(base + "/resources.html#resource-sangha-resources");
    const tile = p.locator(`#resource-sangha-resources a[href="${guide}.html"]`);
    const tileBounds = await tile.boundingBox();
    await tile.click({ position: { x: tileBounds.width / 2, y: tileBounds.height - 8 } });
    await expect(p.locator("h1")).toBeVisible();
    if (guide === "dharma-sharing-guidelines")
      await expect(p.locator(".guide-reading > p").first()).toHaveText(
        "During Dharma Sharing, we base our sharing on our own experience of the practice rather than about abstract ideas and theoretical topics. Over time, we realize that many of us share similar difficulties and aspirations. Sitting, listening and sharing together, we recognize our connection to one another.",
      );
    await expect(p.locator(".guide-navigation")).toHaveCount(0);
    await p
      .getByRole("navigation", { name: "Breadcrumb", exact: true })
      .getByRole("link", { name: "Sangha Resources", exact: true })
      .click();
    await expect(p.locator("#resource-sangha-resources")).toBeVisible();
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(base);
  await p.getByRole("button", { name: "Open menu", exact: true }).click();
  const drawer = p.locator(".drawer");
  await expect(drawer.locator(".drawer-trigger")).toHaveText(["About", "Get Involved"]);
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
      "newcomer river → finder/contact and meeting details",
      "Events → subscriptions",
      "Voices → zine/newsletter PDFs",
      "mailing selection",
      "four linked guides → parent",
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
