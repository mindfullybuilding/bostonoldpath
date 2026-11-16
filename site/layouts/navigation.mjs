import { link } from "../html.mjs";

const navigationGroups = [
  [
    "About",
    [
      ["/new-here.html", "Newcomers"],
      ["/our-practice.html", "Our Practice"],
      ["/our-community.html", "Our Community"],
      ["/resources.html", "Resources"],
    ],
  ],
  [
    "Get Involved",
    [
      ["/find-a-sangha.html", "Find a Sangha"],
      ["/find-a-sangha.html#calendar", "Events Calendar"],
      ["https://withtogetherness.org/", "Gather with Friends"],
    ],
  ],
];
const navLinks = (items) => items.map(([url, label]) => link(url, label)).join("");
export const menu =
  navigationGroups
    .map(
      ([title, items], i) =>
        `<div class="nav-disclosure"><a class="nav-trigger" href="${i === 0 ? "/our-community.html" : "/find-a-sangha.html"}" aria-expanded="false" aria-controls="nav-panel-${i}">${title}</a><div class="nav-panel" id="nav-panel-${i}" hidden>${navLinks(items)}</div></div>`,
    )
    .join("") +
  link("/community-voices.html", "Community Voices") +
  link("/join-mailing-list.html", "Mailing Lists");
export const mobileMenu =
  navigationGroups
    .map(
      ([title, items], i) =>
        `<section class="drawer-group"><h3><button aria-expanded="false" aria-controls="drawer-panel-${i}" class="drawer-trigger">${title}</button></h3><div class="drawer-panel" id="drawer-panel-${i}" hidden>${navLinks(items)}</div></section>`,
    )
    .join("") +
  link("/community-voices.html", "Community Voices") +
  link("/join-mailing-list.html", "Mailing Lists") +
  link("/find-a-sangha.html", "Find a Sangha", "button primary");
