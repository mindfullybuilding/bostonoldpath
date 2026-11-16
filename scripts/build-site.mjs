import fs from "node:fs/promises";
import path from "node:path";
import Mustache from "mustache";
import { normalizePlumlineSnapshot } from "../lib/plumline.mjs";
import { config } from "../site/config.mjs";
import { esc, link } from "../site/html.mjs";
import { localNavigation } from "../site/layouts/breadcrumbs.mjs";
import { menu, mobileMenu } from "../site/layouts/navigation.mjs";
import { directoryView } from "../site/pages/find-a-sangha.mjs";
import { newsletterView } from "../site/pages/newsletters.mjs";
import { resourceView } from "../site/pages/resources.mjs";
import { subscriptionView } from "../site/pages/subscribe-calendar.mjs";

const args = process.argv.slice(2);
const snapshotOption = args.indexOf("--plumline-snapshot");
const snapshotFile = snapshotOption >= 0 ? args[snapshotOption + 1] : null;
if (snapshotOption >= 0 && (!snapshotFile || snapshotFile.startsWith("--")))
  throw new Error("--plumline-snapshot requires a candidate file.");

const fixturePreview =
  args.includes("--plumline-preview") ||
  (!snapshotFile &&
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "codex/mcgb-plumline-finder");
const useDirectoryMap = fixturePreview || Boolean(snapshotFile);
if (snapshotFile && (process.env.VERCEL || process.env.VERCEL_ENV))
  throw new Error("A Plumline review candidate can only be built locally.");
if (useDirectoryMap && process.env.VERCEL_ENV === "production")
  throw new Error("Plumline preview data cannot be built in Vercel production.");
if (fixturePreview && snapshotFile)
  throw new Error("Choose either the fixture or a review candidate.");

const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const baseline = await readJson("site/sanghas.json");
let sanghas = baseline;
if (fixturePreview) {
  const [payload, roster] = await Promise.all([
    readJson("site/fixtures/plumline-v1.json"),
    readJson("site/fixtures/plumline-roster.json"),
  ]);
  const candidate = normalizePlumlineSnapshot(payload, roster, baseline);
  if (candidate.review.blocked.length)
    throw new Error("The Plumline preview fixture is incomplete.");
  sanghas = candidate.sanghas;
} else if (snapshotFile) {
  const candidate = await readJson(snapshotFile);
  sanghas = candidate?.sanghas;
  if (
    !Array.isArray(candidate?.review?.blocked) ||
    candidate.review.blocked.length ||
    !Array.isArray(sanghas) ||
    !sanghas.length ||
    !sanghas.every(
      ({ id, name }) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && typeof name === "string",
    ) ||
    new Set(sanghas.map(({ id }) => id)).size !== sanghas.length
  )
    throw new Error("Use an unblocked candidate created by the Plumline refresh script.");
}
const plumlinePreview = fixturePreview
  ? "Plumline preview with sample data."
  : snapshotFile
    ? "Plumline preview with directory data under review."
    : "";

const output = "dist";
await fs.rm(output, { recursive: true, force: true });
await fs.cp("public", output, {
  recursive: true,
  filter: (source) =>
    !path.basename(source).startsWith(".") &&
    path.basename(source) !== "GBCOM Website Working Group.pdf",
});

if (useDirectoryMap) {
  const leafletOutput = path.join(output, "assets", "leaflet");
  await fs.mkdir(leafletOutput, { recursive: true });
  await fs.copyFile("node_modules/leaflet/LICENSE", path.join(leafletOutput, "LICENSE.txt"));
  await Promise.all(
    ["leaflet-src.esm.js", "leaflet.css", "images"].map((asset) =>
      fs.cp(path.join("node_modules", "leaflet", "dist", asset), path.join(leafletOutput, asset), {
        recursive: true,
      }),
    ),
  );
}
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
  "find-a-sangha": directoryView(sanghas, sanghaCardTemplate, { useDirectoryMap }),
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
  const content = Mustache.render(body, {
    contactLink,
    useDirectoryMap,
    plumlinePreview,
    ...pageViews[file],
  });
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
