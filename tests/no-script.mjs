import { chromium, expect } from "@playwright/test";
const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
for (const path of ["/", "/find-a-sangha.html", "/resources.html", "/community-voices.html"]) {
  await p.goto("http://127.0.0.1:4173" + path);
  await expect(p.locator("h1")).toBeVisible();
  await expect(p.locator(".no-script-nav")).toBeVisible();
  if (path.includes("sangha")) {
    await expect(p.locator("[data-group]")).toHaveCount(13);
    await p.locator("[data-group] summary").first().click();
    await expect(
      p.locator("[data-group]").first().getByRole("link", { name: "Contact organizer" }),
    ).toBeVisible();
  }
  if (path.includes("resources")) {
    await p.locator("#resource-sangha-resources summary").click();
    await expect(p.getByRole("link", { name: "Minding the Bell", exact: true })).toBeVisible();
  }
}
console.log(
  "No-JavaScript primary content, navigation, directory details, and resource links passed.",
);
await b.close();
