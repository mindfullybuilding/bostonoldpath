import Mustache from "mustache";
import { config } from "../config.mjs";
import { calendarDateKey, monthModel, monthTable } from "../../public/assets/calendar-view.js";
import { firstMeetingDay } from "../../public/assets/sangha-filters.js";
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

const meetingFormats = { "in-person": "In person", virtual: "Online", hybrid: "Hybrid" };

function isPublicVenue(sangha) {
  return sangha.publicVenue === true && sangha.modality !== "virtual" && !sangha.approximate;
}

function venueCoordinates(sangha) {
  const [lat, lng] = sangha.latLng || [];
  if (Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lng) && Math.abs(lng) <= 180)
    return { lat, lng };
  return null;
}

function organizerLink(value) {
  try {
    const url = new URL(value);
    if (["https:", "http:", "mailto:"].includes(url.protocol)) return url.href;
  } catch {
    return "";
  }
  return "";
}

function sanghaCardView(sangha, useDirectoryMap) {
  const { access, modality } = sangha;
  const registerUrl = organizerLink(sangha.registerUrl);
  const organizerLabel =
    sangha.contactKind === "plumline" ? "Message via Plumline" : "Contact Organizer";
  const address = useDirectoryMap && sangha.publicVenue !== true ? "" : sangha.address;
  const coordinates = isPublicVenue(sangha) && venueCoordinates(sangha);
  const directionsDestination = address || (coordinates && `${coordinates.lat},${coordinates.lng}`);
  const canShowDirections = useDirectoryMap ? isPublicVenue(sangha) : modality !== "virtual";
  const usesContactFallback =
    sangha.contactKind === "mcgb" || !registerUrl || /email[12]@gmail/.test(registerUrl);
  const showAccessDetails =
    access && access.trim().toLowerCase() !== (address || "").trim().toLowerCase();
  const sessions = (sangha.meetings || []).map((meeting) => ({
    text: meeting.summary || [meeting.dayLabel, meeting.timeLabel].filter(Boolean).join(", "),
    format: meetingFormats[meeting.format],
    listedUntil: meeting.listedUntil,
  }));
  const publishedSchedule = sangha.meetingDescription?.trim();
  const scheduleTexts = sessions.map(({ text }) => text.replace(/\s+/g, " "));
  const publishedFormats = [
    ...new Set(
      sessions
        .filter(({ listedUntil }) => !listedUntil)
        .map(({ format }) => format)
        .filter(Boolean),
    ),
  ];
  const hasDuplicateSchedule = [scheduleTexts.join(" "), ...scheduleTexts].includes(
    publishedSchedule?.replace(/\s+/g, " "),
  );
  const dayOrder = sangha.meetings?.length
    ? firstMeetingDay(
        sangha.meetings.filter(({ listedUntil }) => !listedUntil).flatMap(({ days }) => days || []),
      )
    : firstMeetingDay(sangha.days || []);
  const encodedEmail =
    !usesContactFallback && registerUrl.startsWith("mailto:") && registerUrl.slice(7);
  let organizerEmail = "";
  if (encodedEmail) {
    try {
      organizerEmail = decodeURIComponent(encodedEmail).replace("?cc=", ", ");
    } catch {
      organizerEmail = encodedEmail;
    }
  }

  return {
    ...sangha,
    address,
    sortDay: dayOrder,
    meetingFormat: publishedFormats.join(" / ") || meetingFormats[modality] || "Ask organizer",
    scheduleDetails: sessions.filter(({ text }) => text),
    additionalSchedule: hasDuplicateSchedule ? "" : publishedSchedule,
    affinityList: sangha.affinities?.join(", "),
    accessDetails: showAccessDetails ? access : "",
    directionsUrl:
      canShowDirections && directionsDestination
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsDestination)}`
        : "",
    contactUrl: usesContactFallback ? `mailto:${config.contactEmail}` : registerUrl,
    contactLabel: usesContactFallback ? "Ask MCGB for Organizer Contact" : organizerLabel,
    scheduleSourceUrl: useDirectoryMap ? organizerLink(sangha.scheduleSourceUrl) : "",
    organizerEmail,
  };
}

export function directoryView(sanghas, cardTemplate, { useDirectoryMap = false } = {}) {
  const sorted = [...sanghas].sort((a, b) => a.name.localeCompare(b.name, "en"));
  const mapVenues = [];
  if (useDirectoryMap) {
    for (const sangha of sorted) {
      const coordinates = isPublicVenue(sangha) && venueCoordinates(sangha);
      if (!coordinates) continue;
      const recurringMeetings = sangha.meetings?.filter(({ listedUntil }) => !listedUntil);
      const meeting = recurringMeetings?.length === 1 ? recurringMeetings[0] : null;
      mapVenues.push({
        id: sangha.id,
        name: sangha.name,
        location: sangha.location,
        schedule: [meeting?.dayLabel, meeting?.timeLabel].filter(Boolean).join(" · "),
        ...coordinates,
      });
    }
  }
  return {
    useDirectoryMap,
    hasMapVenues: mapVenues.length > 0,
    mapVenues,
    filterOptions: filters
      .map(
        ([key, title, opts]) =>
          `<details><summary>${title}</summary><fieldset><legend class="sr-only">${title}</legend>${opts.map(([value, label]) => `<label><input type="checkbox" name="${key}" value="${value}"> ${label}</label>`).join("")}</fieldset></details>`,
      )
      .join(""),
    sanghaCount: sanghas.length,
    groupsHTML: sorted
      .map((sangha) => Mustache.render(cardTemplate, sanghaCardView(sangha, useDirectoryMap)))
      .join(""),
    monthLabel: initialMonth.label,
    monthTable: monthTable(initialMonth),
  };
}
