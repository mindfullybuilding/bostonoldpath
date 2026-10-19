import { chromium, webkit, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const results = [];
const expected = ["Our practice", "Our community", "Events", "Resources", "Mailing lists"];
for (const [engineName, engine] of [
  ["Chromium", chromium],
  ["WebKit", webkit],
]) {
  const browser = await engine.launch();
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base);
  for (const icon of ["menu", "x"]) {
    const response = await p.request.get(base + `/assets/icons/${icon}.svg`);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
  }
  await expect(p.locator(".desktop-nav a")).toHaveText(expected);
  const desktopPaths = await p
    .locator(".desktop-nav a")
    .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(new Set(desktopPaths).size).toBe(5);
  await expect(p.locator(".nav-disclosure")).toHaveCount(0);
  await p.locator(".desktop-nav").getByRole("link", { name: "Our practice", exact: true }).click();
  await expect(p.locator("h1")).toHaveText("Our practice");
  await p
    .getByRole("navigation", { name: "Our practice", exact: true })
    .getByRole("link", { name: "New here", exact: true })
    .click();
  await expect(p.locator("h1")).toHaveText("New here");
  await p.locator("main").getByRole("link", { name: "Find a group", exact: true }).click();
  await expect(p.locator("h1")).toHaveText("Find a sangha");
  await expect(p.locator("[data-group]")).toHaveCount(13);
  const first = p.locator("[data-group]").first();
  await expect(first.getByRole("link", { name: "Contact organizer", exact: true })).toBeVisible();
  expect(await first.locator("details").getAttribute("open")).toBeNull();
  await expect(first.getByRole("link", { name: "Contact organizer", exact: true })).toHaveAttribute(
    "href",
    /^mailto:/,
  );
  await first.locator("summary").click();
  await expect(first.getByRole("link", { name: "Contact organizer", exact: true })).toBeVisible();
  await p.locator(".desktop-nav").getByRole("link", { name: "Events", exact: true }).click();
  await expect(p).toHaveURL(base + "/find-a-sangha.html#calendar");
  await expect(p.locator("#calendar h2")).toHaveText("Community events");
  await p
    .locator("#calendar")
    .getByRole("link", { name: "Subscribe to calendar", exact: true })
    .click();
  await expect(p.locator("#subscribe-calendar")).toBeInViewport();
  await p.locator(".desktop-nav").getByRole("link", { name: "Our community", exact: true }).click();
  const communityNav = p.getByRole("navigation", { name: "Our community", exact: true });
  await communityNav.getByRole("link", { name: "Community Voices", exact: true }).click();
  await expect(p.locator(".issue-grid")).toHaveCount(0);
  await expect(
    p.getByRole("link", { name: "Submit your contribution", exact: true }),
  ).toHaveAttribute("href", "https://forms.gle/ab3cBUX3K76PppPA9");
  await communityNav.getByRole("link", { name: "Newsletter archive", exact: true }).click();
  await expect(p.locator(".issue-card")).toHaveCount(3);
  await expect(p.locator(".issue-card a")).toHaveCount(3);
  const pdf = p.locator(".issue-card a").first();
  expect((await p.request.get(new URL(await pdf.getAttribute("href"), base).href)).ok()).toBe(true);
  await p.locator(".desktop-nav").getByRole("link", { name: "Mailing lists", exact: true }).click();
  await expect(p.locator('main a[href^="mailto:"][href*="subscribe@"]')).toHaveCount(2);
  const guides = [
    "sangha-overview",
    "sangha-facilitation",
    "minding-the-bell",
    "meeting-and-bell-minding-flow",
    "dharma-sharing-guidelines",
  ];
  for (const guide of guides) {
    await p.goto(base + "/resources.html#resource-sangha-resources");
    await p.locator(`#resource-sangha-resources a[href="${guide}.html"]`).click();
    await expect(p).toHaveURL(base + `/${guide}.html`);
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
  await expect(p.locator(".drawer nav a")).toHaveText([...expected, "Find a group"]);
  await p.locator(".drawer nav").getByRole("link", { name: "Our community", exact: true }).click();
  await expect(p.locator("h1")).toHaveText("Our community");
  await expect(p.locator(".drawer")).not.toBeVisible();
  await p
    .getByRole("navigation", { name: "Our community", exact: true })
    .getByRole("link", { name: "Community Voices", exact: true })
    .click();
  await expect(p.locator("h1")).toHaveText("Community Voices");
  results.push({
    engine: engineName,
    version: browser.version(),
    navigation: "direct, consistent desktop/mobile destinations",
    journeys: [
      "practice → newcomer → directory → visible organizer contact",
      "Events → correct calendar anchor → subscription guide",
      "community → Voices → archive → actual PDF",
      "mailing lists → two original subscription addresses",
      "Resources → each of five standalone guides → parent resource anchor",
      "phone drawer → community → Voices",
    ],
    status: "pass",
  });
  await browser.close();
}
await fs.writeFile(
  "outputs/release-verification/navigation.json",
  JSON.stringify(results, null, 2),
);
console.log(results);
