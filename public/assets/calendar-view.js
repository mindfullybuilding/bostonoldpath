// Shared display model for the public month grid. ICS parsing stays in node-ical.
const easternDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function calendarDateKey(value) {
  const parts = easternDate.formatToParts(new Date(value));
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type).value)
    .join("-");
}
export function eventDateBounds(event) {
  const start = event.allDay ? event.start : calendarDateKey(event.start);
  let end = start;
  if (event.end) {
    const exclusiveEnd = new Date(event.end).getTime() - 1;
    end = event.allDay
      ? new Date(exclusiveEnd).toISOString().slice(0, 10)
      : calendarDateKey(exclusiveEnd);
  }
  return { start, end: end < start ? start : end };
}
export function monthModel(year, month, events = [], today = calendarDateKey(new Date())) {
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  const prefix = first.toISOString().slice(0, 7);
  const start = prefix + "-01";
  const end = last.toISOString().slice(0, 10);
  const included = events.filter((event) => {
    const bounds = eventDateBounds(event);
    return bounds.start <= end && bounds.end >= start;
  });
  const days = Array.from(
    { length: Math.ceil((first.getUTCDay() + last.getUTCDate()) / 7) * 7 },
    (_, index) => {
      const day = index - first.getUTCDay() + 1;
      if (day < 1 || day > last.getUTCDate()) return null;
      const date = prefix + "-" + String(day).padStart(2, "0");
      const count = included.filter((event) => {
        const bounds = eventDateBounds(event);
        return bounds.start <= date && bounds.end >= date;
      }).length;
      return { day, date, today: date === today, count };
    },
  );
  return {
    label: new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(first),
    events: included,
    days,
  };
}
export function monthTable(model) {
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return `<table class="month-grid" aria-label="${model.label}"><thead><tr>${weekdays.map((day) => `<th scope="col"><abbr title="${day}">${day.slice(0, 1)}</abbr></th>`).join("")}</tr></thead><tbody>${Array.from(
    { length: model.days.length / 7 },
    (_, week) =>
      `<tr>${model.days
        .slice(week * 7, week * 7 + 7)
        .map((day) =>
          day
            ? `<td${day.today ? ' class="is-today"' : ""}><time datetime="${day.date}">${day.day}</time>${day.today ? '<span class="sr-only">, today</span>' : ""}${day.count ? `<span class="event-count"><span class="sr-only">, </span>${day.count}<span class="sr-only"> ${day.count === 1 ? "event" : "events"}</span></span>` : ""}</td>`
            : "<td></td>",
        )
        .join("")}</tr>`,
  ).join("")}</tbody></table>`;
}
