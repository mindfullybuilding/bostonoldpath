import { chromium } from "@playwright/test";
import { config } from "../site/config.mjs";
import fs from "node:fs/promises";
const b = await chromium.launch();
const ctx = await b.newContext();
const results = [];
for (const [name, url] of [
  ["Google calendar", config.googleCalendarEmbedUrl],
  ["Contribution form", config.communityVoicesFormUrl],
]) {
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2000);
  const text = await p.locator("body").innerText();
  results.push({ name, url: p.url(), title: await p.title(), text: text.slice(0, 6000) });
  await p.screenshot({
    path: `outputs/release-verification/${name === "Google calendar" ? "anonymous-calendar" : "anonymous-form"}.png`,
  });
}
await fs.writeFile("outputs/release-verification/external.json", JSON.stringify(results, null, 2));
console.log(results);
await b.close();
