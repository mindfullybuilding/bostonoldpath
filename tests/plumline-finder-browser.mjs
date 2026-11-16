import { chromium, expect } from "@playwright/test";

const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
  await page.route("**/api/events", (route) => route.fulfill({ json: { events: [] } }));
  await page.goto(`${base}/find-a-sangha.html`);
  await expect(page.locator(".plumline-preview")).toBeVisible();
  await expect(page.locator(".region-map iframe")).toHaveCount(0);
  const map = page.getByRole("region", { name: "Map of public sangha venues" });
  await page.getByRole("heading", { name: "Regional Sangha Map" }).scrollIntoViewIfNeeded();
  await expect(map).toBeVisible();
  await expect(page.getByText("Map tiles are unavailable", { exact: false })).toBeVisible();
  await expect(map.getByRole("button", { name: /Dandelions|Mountain Bell/ })).toHaveCount(0);
  const mapList = page.locator(".sangha-map-list");
  const mapped = mapList.locator("a").first();
  const target = await mapped.getAttribute("href");
  const name = await mapped.textContent();
  const pin = map.getByRole("button", { name: `View ${name}` });
  await expect(pin).toBeVisible();
  await page.locator("#group-search").fill("no group matches this name");
  await expect(page.locator(target)).toBeHidden();
  await pin.focus();
  await pin.press("Enter");
  await expect(page.locator(target)).toBeVisible();
  await expect(page.locator(target)).toBeFocused();
  await expect(page.locator("#group-search")).toHaveValue("");
  await expect(
    page.getByRole("link", { name: "Jump to Community Events & Calendar" }),
  ).toHaveAttribute("href", "#calendar");
  await expect(page.locator("#calendar")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mindful Lunch" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Lazy Tea", exact: false })).toHaveCount(0);

  const noScript = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  await noScript.goto(`${base}/find-a-sangha.html`);
  await expect(
    noScript.getByRole("heading", { name: "Dandelions of the Heart Sangha" }),
  ).toBeVisible();
  await noScript.locator(".sangha-map-list summary").click();
  await expect(noScript.locator(`.sangha-map-list a[href="${target}"]`)).toBeVisible();
  await expect(noScript.locator(`${target} .organizer-contact`)).toBeVisible();
  const wakeUpRow = page.locator('[data-today-sanghas] a[href$="#wake-up-boston"]');
  await page.clock.setFixedTime(new Date("2026-11-25T17:00:00Z"));
  await page.goto(base);
  await expect(page.locator(".today-status")).toContainText("Wednesday, Nov 25");
  await expect(wakeUpRow).toHaveCount(0);
  await page.clock.setFixedTime(new Date("2026-12-09T17:00:00Z"));
  await page.goto(base);
  await expect(wakeUpRow).toBeVisible();
  console.log("Plumline finder, map fallback, no-script directory and homepage schedule passed.");
} finally {
  await browser.close();
}
