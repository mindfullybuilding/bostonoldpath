import { config as c } from "../config.mjs";
import { esc, link } from "../html.mjs";
import { calendarDateKey, monthModel, monthTable } from "../../public/assets/calendar-view.js";
const calendarToday = calendarDateKey(new Date());
const [calendarYear, calendarMonth] = calendarToday.split("-").map(Number);
const initialMonth = monthModel(calendarYear, calendarMonth - 1, [], "");
const filters = [
  [
    "modality",
    "Meeting Format",
    [
      ["in-person", "In person"],
      ["hybrid", "Hybrid"],
      ["virtual", "Online"],
    ],
  ],
  [
    "day",
    "Day",
    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((x) => [
      x,
      x[0].toUpperCase() + x.slice(1),
    ]),
  ],
  [
    "timeBand",
    "Time of Day",
    [
      ["morning", "Morning"],
      ["afternoon", "Afternoon"],
      ["evening", "Evening"],
    ],
  ],
];

export function directoryView(sanghas) {
  return {
    filterOptions: filters
      .map(
        ([key, title, opts]) =>
          `<details><summary>${title}</summary><fieldset><legend class="sr-only">${title}</legend>${opts.map(([value, label]) => `<label><input type="checkbox" name="${key}" value="${value}"> ${label}</label>`).join("")}</fieldset></details>`,
      )
      .join(""),
    sanghaCount: sanghas.length,
    groupsHTML: [...sanghas]
      .sort((a, b) => a.name.localeCompare(b.name, "en"))
      .map((s) => {
        const contact = /email[12]@gmail/.test(s.registerUrl)
          ? `mailto:${c.contactEmail}`
          : s.registerUrl;
        const directions =
          s.modality !== "virtual" && s.address
            ? link(
                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`,
                "Get Directions",
                "text-link",
              )
            : "";
        const contactLabel = /email[12]@gmail/.test(s.registerUrl)
          ? "Ask MCGB for Organizer Contact"
          : "Contact Organizer";
        return `<article class="group-card" id="${s.id}" data-group="${s.id}" data-sort-day="${esc(s.days[0])}"><h2>${esc(s.name)}</h2><dl class="group-metadata"><dt>Day</dt><dd>${esc(s.day)}</dd><dt>Time</dt><dd>${esc(s.time)}</dd><dt>Location</dt><dd>${esc(s.location)}</dd></dl><details><summary class="button">More Details</summary><p>${esc(s.description)}</p><dl class="metadata"><dt>Format</dt><dd>${s.modality === "virtual" ? "Online" : s.modality === "hybrid" ? "Hybrid" : "In person"}</dd>${s.address ? `<dt>Location</dt><dd>${esc(s.address)}</dd>` : ""}${s.access && s.access.trim().toLowerCase() !== (s.address || "").trim().toLowerCase() ? `<dt>Joining &amp; Access</dt><dd>${esc(s.access)}</dd>` : ""}</dl>${directions}<p>Confirm current meeting details and access needs with the organizer.</p>${s.registerUrl.startsWith("mailto:") && !/email[12]@gmail/.test(s.registerUrl) ? `<p class="email-address small">${esc(decodeURIComponent(s.registerUrl.slice(7)).replace("?cc=", ", "))}</p>` : ""}</details>${link(contact, contactLabel, "button primary organizer-contact")}</article>`;
      })
      .join(""),
    monthLabel: initialMonth.label,
    monthTable: monthTable(initialMonth),
  };
}
