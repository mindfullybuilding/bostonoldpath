import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const browser = await chromium.launch();
try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await desktop.newPage();
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
  await page.route("**/api/events", (route) => route.fulfill({ json: { events: [] } }));
  await page.goto(`${base}/find-a-sangha.html`);
  await expect(page.locator(".plumline-preview")).toBeVisible();
  await expect(page.locator(".region-map iframe")).toHaveCount(0);
  const map = page.getByRole("region", { name: "Map of public sangha venues" });
  await page.getByRole("heading", { name: "Regional Sangha Map" }).scrollIntoViewIfNeeded();
  await expect(map).toBeVisible();
  await expect(page.getByText("Map tiles are unavailable", { exact: false })).toBeVisible();
  for (const name of ["Zoom in", "Zoom out"]) {
    const bounds = await map.getByRole("button", { name }).boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
  }
  await expect(map.getByRole("button", { name: /Dandelions|Mountain Bell/ })).toHaveCount(0);
  const mapList = page.locator(".sangha-map-list");
  const name = "Wake Up Boston";
  const target = "#wake-up-boston";
  // At the fixture's regional scale, the Boston-area venues would overlap.
  const pin = map.getByRole("button", { name: /^View 3 nearby venues:.*Wake Up Boston/ });
  const details = map.getByRole("region", { name: "3 nearby venues", exact: true });
  await expect(pin).toBeVisible();
  const search = page.locator("#group-search");
  const query = "no group matches this name";
  let dataRequests = 0;
  await page.route("**/assets/site-data.json", (route) => {
    dataRequests++;
    if (dataRequests === 1) return route.fulfill({ status: 503 });
    if (dataRequests === 2) return route.fulfill({ json: { sanghas: [] } });
    return route.continue();
  });
  await search.fill(query);
  await expect(page.locator("#group-count")).toHaveText(
    "All sanghas are shown. Change a filter to retry.",
  );
  await expect(page.locator(target)).toBeVisible();
  await search.fill(query + " again");
  await expect.poll(() => dataRequests).toBe(2);
  await expect(page.locator("#group-count")).toHaveText(
    "All sanghas are shown. Change a filter to retry.",
  );
  await expect(page.locator(target)).toBeVisible();
  await search.fill(query + " once more");
  await expect(page.getByRole("heading", { name: "No Matching Sanghas" })).toBeVisible();
  await expect(page.locator(target)).toBeHidden();
  await search.fill(query);
  const pointerPin = map.getByRole("button", { name: "View Green Fields Sangha" });
  await pointerPin.click();
  const pointerDetails = map.getByRole("region", { name: "Green Fields Sangha", exact: true });
  await expect(pointerDetails).toBeVisible();
  await expect(pointerDetails).toBeInViewport();
  await expect(pointerDetails.getByRole("link", { name: "View in directory" })).toHaveAttribute(
    "href",
    "#green-fields-sangha",
  );
  await expect(page).toHaveURL(`${base}/find-a-sangha.html`);
  await pointerDetails.getByRole("button", { name: "Close map details" }).click();
  await expect(pointerPin).toBeFocused();

  await pin.focus();
  await pin.press("Enter");
  await expect(details).toBeFocused();
  await expect(pin).toHaveAttribute("aria-controls", "sangha-map-selection");
  await expect(pin).toHaveAttribute("aria-expanded", "true");
  await expect(page).toHaveURL(`${base}/find-a-sangha.html`);
  await expect(search).toHaveValue(query);
  await expect(page.locator(target)).toBeHidden();
  await expect(details.getByRole("link")).toHaveText([
    "Joyful Lotus Sangha",
    "Peaceful Garden Sangha",
    name,
  ]);
  for (const link of await details.getByRole("link").all()) {
    expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  const rectangles = await map
    .locator(".sangha-map-marker")
    .evaluateAll((markers) => markers.map((marker) => marker.getBoundingClientRect().toJSON()));
  for (const [index, rectangle] of rectangles.entries()) {
    expect(rectangle.width).toBeGreaterThanOrEqual(44);
    expect(rectangle.height).toBeGreaterThanOrEqual(44);
    for (const other of rectangles.slice(index + 1)) {
      expect(
        rectangle.right <= other.left ||
          other.right <= rectangle.left ||
          rectangle.bottom <= other.top ||
          other.bottom <= rectangle.top,
      ).toBe(true);
    }
  }
  const accessibility = await new AxeBuilder({ page })
    .include(".region-map")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    accessibility.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map(({ target }) => target),
    })),
  ).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(details).toBeHidden();
  await expect(pin).toBeFocused();
  await expect(pin).toBeInViewport();
  await expect(pin).toHaveAttribute("aria-expanded", "false");
  await pin.press("Space");
  await expect(details).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(details.getByRole("button", { name: "Close map details" })).toBeFocused();
  const directoryLink = details.getByRole("link", { name });
  await directoryLink.focus();
  await directoryLink.press("Enter");
  await expect(page.locator(target)).toBeVisible();
  await expect(page.locator(target)).toBeFocused();
  await expect(page).toHaveURL(`${base}/find-a-sangha.html${target}`);
  await expect(search).toHaveValue("");
  await details.getByRole("button", { name: "Zoom to these venues" }).click();
  const brooklinePin = map.getByRole("button", {
    name: "View Peaceful Garden Sangha",
    exact: true,
  });
  await expect(brooklinePin).toBeVisible();
  await expect(
    map.getByRole("button", { name: /^View 2 nearby venues:.*Wake Up Boston/ }),
  ).toBeVisible();
  await brooklinePin.focus();
  await page.setViewportSize({ width: 899, height: 900 });
  await expect(mapList.locator("summary")).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(brooklinePin).toBeVisible();
  await mapList.locator("summary").click();
  await expect(mapList.locator(`a[href="${target}"]`)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Jump to Community Events & Calendar" }),
  ).toHaveAttribute("href", "#calendar");
  await expect(page.locator("#calendar")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mindful Lunch" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Lazy Tea", exact: false })).toHaveCount(0);

  const resizing = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let releaseLeaflet;
  const pendingLeaflet = new Promise((resolve) => {
    releaseLeaflet = resolve;
  });
  await resizing.route("**/assets/leaflet/leaflet-src.esm.js", async (route) => {
    const response = await route.fetch();
    await pendingLeaflet;
    const marker = '\ndocument.documentElement.dataset.leafletTestLoaded = "true";';
    await route.fulfill({ response, body: (await response.text()) + marker });
  });
  await resizing.route("https://tile.openstreetmap.org/**", (route) => route.abort());
  await resizing.route("**/api/events", (route) => route.fulfill({ json: { events: [] } }));
  const leafletRequested = resizing.waitForRequest("**/assets/leaflet/leaflet-src.esm.js");
  await resizing.goto(`${base}/find-a-sangha.html`, { waitUntil: "domcontentloaded" });
  await leafletRequested;
  await resizing.setViewportSize({ width: 899, height: 900 });
  releaseLeaflet();
  await expect(resizing.locator("html")).toHaveAttribute("data-leaflet-test-loaded", "true");
  await expect(resizing.locator("[data-sangha-map]")).toHaveAttribute("hidden", "");
  await resizing.setViewportSize({ width: 1440, height: 900 });
  await expect(
    resizing.getByRole("button", { name: /^View 3 nearby venues:.*Wake Up Boston/ }),
  ).toBeVisible();
  await resizing.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const leafletRequests = [];
  await mobile.route("**/assets/leaflet/leaflet-src.esm.js", (route) => {
    leafletRequests.push(route.request().url());
    return route.abort();
  });
  await mobile.route("**/api/events", (route) => route.fulfill({ json: { events: [] } }));
  await mobile.goto(`${base}/find-a-sangha.html`);
  const filterToggle = mobile.getByRole("button", { name: "Filters" });
  await expect(filterToggle).toBeVisible();
  await filterToggle.click();
  const mobileSearch = mobile.getByRole("searchbox", { name: "Search name or place" });
  await expect(mobileSearch).toBeFocused();
  await mobileSearch.fill("Peaceful Garden");
  await mobileSearch.press("Enter");
  await expect(mobile).toHaveURL(`${base}/find-a-sangha.html`);
  await expect(mobile.locator("#group-count")).toHaveText("1 of 13 Sanghas");
  await mobileSearch.press("Escape");
  await expect(filterToggle).toBeFocused();
  await expect(mobile.locator(target)).toBeHidden();
  await mobile.getByRole("link", { name: "Jump to Regional Sangha Map" }).click();
  await expect(mobile.getByRole("heading", { name: "Regional Sangha Map" })).toBeInViewport();
  await mobile.locator(".sangha-map-list summary").click();
  const mobileVenue = mobile.locator(`.sangha-map-list a[href="${target}"]`);
  await expect(mobileVenue).toBeVisible();
  expect((await mobileVenue.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await mobileVenue.click();
  await expect(mobile).toHaveURL(`${base}/find-a-sangha.html${target}`);
  await expect(mobile.locator(target)).toBeInViewport();
  await expect(mobile.locator(target)).toBeFocused();
  await expect(mobile.locator("#group-count")).toHaveText("13 of 13 Sanghas");
  await filterToggle.click();
  await expect(mobileSearch).toHaveValue("");
  expect(leafletRequests).toHaveLength(0);

  const noScript = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await noScript.goto(`${base}/find-a-sangha.html`);
  await expect(
    noScript.getByRole("heading", { name: "Dandelions of the Heart Sangha" }),
  ).toBeVisible();
  await expect(
    noScript.locator("#joyful-lotus-sangha").getByRole("link", { name: "Message via Plumline" }),
  ).toHaveAttribute("href", "https://plumline.org/sanghas/joyful-lotus-sangha#intro");
  await expect(
    noScript
      .locator("#wake-up-boston")
      .getByRole("link", { name: /^(Contact Organizer|Message via Plumline)$/ }),
  ).toBeVisible();
  await noScript.locator(".sangha-map-list summary").click();
  await noScript.locator(`.sangha-map-list a[href="${target}"]`).click();
  await expect(noScript).toHaveURL(`${base}/find-a-sangha.html${target}`);
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
