import { calendarDateKey } from "./calendar-view.js";

const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function weekdayOrder(day) {
  const index = weekdays.indexOf(day);
  return index < 0 ? weekdays.length : index;
}

export function firstMeetingDay(days) {
  return weekdays.find((day) => days.includes(day));
}

export function matchesSangha(sangha, formData, today = calendarDateKey(Date.now())) {
  const search = String(formData.get("search") || "")
    .toLowerCase()
    .trim();
  const searchable = `${sangha.name} ${sangha.location} ${sangha.address || ""} ${sangha.description}`;
  if (search && !searchable.toLowerCase().includes(search)) return false;

  const formats = formData.getAll("modality");
  const days = formData.getAll("day");
  const timeBands = formData.getAll("timeBand");
  if (!formats.length && !days.length && !timeBands.length) return true;

  // A group can meet on different days, at different times, or in different formats.
  // Keep the filters together so a group matches only if one sitting meets all of them.
  const meetings = sangha.meetings?.length
    ? sangha.meetings
    : [{ format: sangha.modality, days: sangha.days, timeBand: sangha.timeBand }];
  return meetings.some(
    (meeting) =>
      (!meeting.listedUntil || meeting.listedUntil >= today) &&
      (!formats.length || formats.includes(meeting.format)) &&
      (!days.length || days.some((day) => meeting.days?.includes(day))) &&
      (!timeBands.length || timeBands.includes(meeting.timeBand)),
  );
}
