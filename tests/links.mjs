import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.TEST_BASE || "http://127.0.0.1:4173";
const browser = await chromium.launch();
const page = await browser.newPage();
const files = (await fs.readdir("dist")).filter(
  (f) =>
    f.endsWith(".html") && f !== "home.html" && !f.includes("feedback") && !f.includes("wireframe"),
);
const destinations = new Set(),
  anchors = [],
  issues = [];
for (const file of files) {
  await page.goto(`${base}/${file === "index.html" ? "" : file}`);
  const links = await page
    .locator("a[href],img[src],script[src],link[rel=stylesheet]")
    .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? e.getAttribute("src")));
  for (const href of links) {
    if (href.startsWith("mailto:") || href.startsWith("webcal:") || /^https?:/.test(href)) continue;
    const u = new URL(href, `${base}/${file}`);
    destinations.add(u.pathname);
    if (u.hash)
      anchors.push({ file, href, path: u.pathname, hash: decodeURIComponent(u.hash.slice(1)) });
  }
}
for (const path of destinations) {
  const r = await page.request.get(base + path);
  if (!r.ok()) issues.push({ path, status: r.status() });
}
for (const a of anchors) {
  await page.goto(base + a.path);
  if (!(await page.locator(`[id="${a.hash}"]`).count())) issues.push(a);
}
console.log({
  pages: files.length,
  destinations: destinations.size,
  anchors: anchors.length,
  issues,
});
await fs.mkdir("outputs/release-verification", { recursive: true });
await fs.writeFile(
  "outputs/release-verification/links.json",
  JSON.stringify(
    { pages: files.length, destinations: destinations.size, anchors: anchors.length, issues },
    null,
    2,
  ),
);
await browser.close();
if (issues.length) process.exitCode = 1;
