import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const base = new URL(process.env.TEST_BASE || "http://127.0.0.1:4173");
const titles = JSON.parse(await fs.readFile("site/page-titles.json", "utf8"));
const routes = Object.keys(titles).map((name) => (name === "home" ? "/" : `/${name}.html`));
const issues = [];
const destinations = new Map();
const pageIds = new Map();
const anchors = [];
const browser = await chromium.launch();

try {
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort(),
  );
  const page = await context.newPage();
  for (const route of routes) {
    const response = await page.goto(new URL(route, base).href, {
      waitUntil: "domcontentloaded",
    });
    if (!response?.ok() || new URL(page.url()).pathname !== route) {
      issues.push({ route, status: response?.status(), finalUrl: page.url() });
      continue;
    }
    const { links, ids, hasMain } = await page.evaluate(() => ({
      links: [
        ...document.querySelectorAll("a[href], img[src], script[src], link[rel=stylesheet]"),
      ].map((element) => element.getAttribute("href") ?? element.getAttribute("src")),
      ids: [...document.querySelectorAll("[id]")].map((element) => element.id),
      hasMain: Boolean(document.querySelector("main#main h1")),
    }));
    if (!hasMain) issues.push({ route, error: "Missing main heading" });
    pageIds.set(route, new Set(ids));
    for (const href of links) {
      const url = new URL(href, page.url());
      if (url.origin !== base.origin) continue;
      const target = url.pathname + url.search;
      if (!destinations.has(target)) destinations.set(target, route);
      if (url.hash)
        anchors.push({ route, href, target, id: decodeURIComponent(url.hash.slice(1)) });
    }
  }

  for (const [target, route] of destinations) {
    if (pageIds.has(target)) continue;
    const response = await context.request.get(new URL(target, base).href);
    if (!response.ok()) issues.push({ route, target, status: response.status() });
  }
  for (const { route, href, target, id } of anchors) {
    if (!pageIds.has(target)) {
      const response = await page.goto(new URL(target, base).href, {
        waitUntil: "domcontentloaded",
      });
      const ids = response?.ok()
        ? await page
            .locator("[id]")
            .evaluateAll((elements) => elements.map((element) => element.id))
        : [];
      pageIds.set(target, new Set(ids));
    }
    if (!pageIds.get(target).has(id)) issues.push({ route, href, error: "Missing anchor" });
  }
} finally {
  await browser.close();
}

const report = {
  pages: routes.length,
  destinations: destinations.size,
  anchors: anchors.length,
  issues,
};
console.log(report);
await fs.mkdir("outputs/release-verification", { recursive: true });
await fs.writeFile("outputs/release-verification/links.json", JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
