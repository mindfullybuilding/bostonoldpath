import { bostonDayBounds, bostonTimeZone, meetingOccurrences } from "./sangha-occurrences.js";

// The editorial directory still uses weekday labels and reviewed local ordinal rules.
const ordinalWeeks = {
  "wake-up-boston": [2, 4],
  "joyful-lotus-sangha": [1],
  "tree-house-sangha": [1, 3],
  "mountain-bell-sangha": [2, 4],
};
export const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const bostonDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: bostonTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function directoryDate(value = new Date()) {
  const parts = bostonDate.formatToParts(new Date(value));
  const date = ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type).value)
    .join("-");
  const day = new Date(date + "T12:00:00Z").getUTCDay();
  return { date, weekday: weekdays[day], ordinal: Math.ceil(Number(date.slice(-2)) / 7) };
}
export function meetingMinutes(group) {
  const match = group.time.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return 24 * 60;
  const period = (match[3] || group.time.match(/(AM|PM)/i)?.[1] || "AM").toUpperCase();
  return ((Number(match[1]) % 12) + (period === "PM" ? 12 : 0)) * 60 + Number(match[2] || 0);
}
const bostonClock = new Intl.DateTimeFormat("en-US", {
  timeZone: bostonTimeZone,
  hour: "numeric",
  minute: "2-digit",
});
function occurrenceRow(group, meeting, start) {
  const startLabel = bostonClock.format(start);
  const endLabel =
    meeting.durationMinutes > 0 ? bostonClock.format(start + meeting.durationMinutes * 60_000) : "";
  const compatiblePeriods = startLabel.slice(-2) === endLabel.slice(-2);
  return {
    ...group,
    time: endLabel
      ? `${compatiblePeriods ? startLabel.slice(0, -3) : startLabel}–${endLabel}`
      : startLabel,
    modality: meeting.format,
    location: meeting.format === "virtual" ? "Online" : group.location,
  };
}

export function dailySanghas(groups, value = new Date()) {
  const day = directoryDate(value);
  const bounds = bostonDayBounds(day.date);
  const scheduled = [],
    uncertain = [];
  for (const group of groups) {
    if (Array.isArray(group.meetings)) {
      for (const meeting of group.meetings) {
        for (const start of meetingOccurrences(meeting, bounds)) {
          scheduled.push(occurrenceRow(group, meeting, start));
        }
      }
      continue;
    }
    if (!group.days.includes(day.weekday.toLowerCase())) continue;
    if (group.id === "lotus-pond-sangha") {
      uncertain.push(group);
      continue;
    }
    const ordinals = ordinalWeeks[group.id];
    if (ordinals && !ordinals.includes(day.ordinal)) continue;
    scheduled.push(group);
  }
  const byTime = (a, b) => meetingMinutes(a) - meetingMinutes(b) || a.name.localeCompare(b.name);
  return { ...day, scheduled: scheduled.sort(byTime), uncertain: uncertain.sort(byTime) };
}
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
export function scheduleRow(group, showRule = false) {
  const mode = { "in-person": "In person", hybrid: "Hybrid", virtual: "Online" }[group.modality];
  return `<li class="sangha-schedule-row"><div><a href="/find-a-sangha.html#${encodeURIComponent(group.id)}">${escape(group.name)}</a>${showRule && (ordinalWeeks[group.id] || group.id === "lotus-pond-sangha") ? `<span class="schedule-recurrence">${group.id === "lotus-pond-sangha" ? "Every other Thursday" : escape(group.day)}</span>` : ""}</div><span class="schedule-time">${escape(group.time)}</span><span class="schedule-place">${escape(group.location)}${group.location === "Online" || !mode ? "" : ` · ${mode}`}</span></li>`;
}
export function dailyMarkup(model) {
  const groups = [...model.scheduled, ...model.uncertain].sort(
    (a, b) => meetingMinutes(a) - meetingMinutes(b) || a.name.localeCompare(b.name),
  );
  return groups.length
    ? `<ul class="sangha-schedule-list">${groups.map((group) => scheduleRow(group, model.uncertain.includes(group))).join("")}</ul>`
    : `<p>No regular sangha meetings are listed for this ${model.weekday}.</p>`;
}
