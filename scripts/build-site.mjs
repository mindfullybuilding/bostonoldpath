import fs from "node:fs/promises";
import path from "node:path";
import Mustache from "mustache";
import { config } from "../site/config.mjs";
import { esc, link } from "../site/html.mjs";
import { localNavigation } from "../site/layouts/breadcrumbs.mjs";
import { menu, mobileMenu } from "../site/layouts/navigation.mjs";
import { directoryView } from "../site/pages/find-a-sangha.mjs";
import { newsletterView } from "../site/pages/newsletters.mjs";
import { resourceView } from "../site/pages/resources.mjs";
import { subscriptionView } from "../site/pages/subscribe-calendar.mjs";

const output = "dist";
await fs.rm(output, { recursive: true, force: true });
await fs.cp("public", output, {
  recursive: true,
  filter: (source) =>
    !path.basename(source).startsWith(".") &&
    path.basename(source) !== "GBCOM Website Working Group.pdf",
});

const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const sanghas = await readJson("site/sanghas.json");
const resources = await readJson("site/resources.json");
const titles = await readJson("site/page-titles.json");
const contactLink = link(`mailto:${config.contactEmail}`, config.contactEmail);
const sanghaCardTemplate = await fs.readFile("site/pages/partials/sangha-card.html", "utf8");
const pageViews = {
  "community-voices": {
    contributionLink: link(
      config.communityVoicesFormUrl,
      "Submit Your Contribution",
      "button primary",
    ),
  },
  "find-a-sangha": directoryView(sanghas, sanghaCardTemplate),
  newsletters: newsletterView(),
  resources: resourceView(resources),
  "subscribe-calendar": subscriptionView(config.calendarFeedUrl),
};

const template = await fs.readFile("site/layouts/base.html", "utf8");
const headerTemplate = await fs.readFile("site/layouts/header.html", "utf8");
const footerTemplate = await fs.readFile("site/layouts/footer.html", "utf8");
const footer = Mustache.render(footerTemplate, { contactEmail: config.contactEmail });

for (const [file, title] of Object.entries(titles)) {
  const isHome = file === "home";
  const body = await fs.readFile(`site/pages/${file}.html`, "utf8");
  const content = Mustache.render(body, { contactLink, ...pageViews[file] });
  const header = Mustache.render(headerTemplate, { isHome, menu, mobileMenu }).replaceAll(
    `href="/${file}.html"`,
    `href="/${file}.html" aria-current="page"`,
  );
  const html = Mustache.render(template, {
    file,
    title: isHome ? config.name : `${title} | MCGB`,
    description:
      "Mindfulness, community, and practice in Greater Boston in the Plum Village tradition.",
    canonicalUrl: `${config.origin}${isHome ? "/" : `/${file}.html`}`,
    isHome,
    bodyClass: isHome ? "home-identity" : "",
    header,
    breadcrumb: localNavigation(file),
    content,
    footer,
  });
  await fs.writeFile(path.join(output, isHome ? "index.html" : `${file}.html`), html);
}
await fs.writeFile(
  path.join(output, "assets", "site-data.json"),
  JSON.stringify({ sanghas, calendarFeedUrl: config.calendarFeedUrl }),
);
// Emit fallback redirects for the local server and static copies of the build.
const { redirects } = JSON.parse(await fs.readFile("vercel.json", "utf8"));
for (const { source, destination } of redirects.filter((rule) => !rule.has)) {
  await fs.writeFile(
    path.join(output, source.slice(1)),
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Page moved | MCGB</title><meta http-equiv="refresh" content="0;url=${esc(destination)}"><a href="${esc(destination)}">Continue to the current page</a></html>`,
  );
}
console.log("Built the MCGB site in dist.");
