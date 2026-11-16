import Mustache from "mustache";
import { config } from "../config.mjs";
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

const meetingFormats = { virtual: "Online", hybrid: "Hybrid" };

function sanghaCardView(sangha) {
  const { address, access, modality, registerUrl } = sangha;
  const usesContactFallback = /email[12]@gmail/.test(registerUrl);
  const showAccessDetails =
    access && access.trim().toLowerCase() !== (address || "").trim().toLowerCase();

  return {
    ...sangha,
    sortDay: sangha.days[0],
    meetingFormat: meetingFormats[modality] ?? "In person",
    accessDetails: showAccessDetails ? access : "",
    directionsUrl:
      modality !== "virtual" && address
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
        : "",
    contactUrl: usesContactFallback ? `mailto:${config.contactEmail}` : registerUrl,
    contactLabel: usesContactFallback ? "Ask MCGB for Organizer Contact" : "Contact Organizer",
    organizerEmail:
      registerUrl.startsWith("mailto:") && !usesContactFallback
        ? decodeURIComponent(registerUrl.slice(7)).replace("?cc=", ", ")
        : "",
  };
}

export function directoryView(sanghas, cardTemplate) {
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
      .map((sangha) => Mustache.render(cardTemplate, sanghaCardView(sangha)))
      .join(""),
    monthLabel: initialMonth.label,
    monthTable: monthTable(initialMonth),
  };
}
