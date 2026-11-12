import { link } from "../html.mjs";

const guidePages = [
  "sangha-overview",
  "sangha-facilitation",
  "minding-the-bell",
  "meeting-and-bell-minding-flow",
  "dharma-sharing-guidelines",
];
export function localNavigation(file) {
  if (guidePages.includes(file))
    return `<nav class="container breadcrumb" aria-label="Breadcrumb">${link("/resources.html", "Resources")}<span aria-hidden="true">/</span>${link("/resources.html#resource-sangha-resources", "Sangha Resources")}</nav>`;
  if (file === "newsletters")
    return `<nav class="container breadcrumb" aria-label="Breadcrumb">${link("/community-voices.html", "Community Voices")}<span aria-hidden="true">/</span><span aria-current="page">The Present Moment</span></nav>`;
  return "";
}
