import ical from "node-ical";
import { config } from "../site/config.mjs";
const plain = (v) => (typeof v === "object" && v !== null ? String(v.val ?? "") : String(v ?? ""));
const safeUrl = (value) => {
  try {
    const u = new URL(plain(value));
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
};
const dateOnly = (date) => date.toISOString().slice(0, 10);
export async function normalizeCalendar(text, now = new Date()) {
  if (!text.includes("BEGIN:VCALENDAR") || !text.includes("END:VCALENDAR"))
    throw new Error("Invalid calendar response");
  const parsed = await ical.async.parseICS(text),
    to = new Date(now.getTime() + 180 * 86400000),
    events = [];
  for (const event of Object.values(parsed)) {
    if (
      event.type !== "VEVENT" ||
      event.recurrenceid ||
      event.status === "CANCELLED" ||
      !event.start
    )
      continue;
    for (const occurrence of ical.expandRecurringEvent(event, {
      from: now,
      to,
      includeOverrides: true,
      excludeExdates: true,
      expandOngoing: true,
    })) {
      const record = occurrence.event ?? event;
      // node-ical applies instance dates and text; cancellation overrides need explicit exclusion.
      const override =
        event.recurrences &&
        Object.values(event.recurrences).find(
          (r) => r.start?.getTime() === occurrence.start.getTime(),
        );
      if (record.status === "CANCELLED" || override?.status === "CANCELLED") continue;
      const allDay = occurrence.isFullDay;
      events.push({
        id: `${event.uid}:${occurrence.start.toISOString()}`,
        title: plain(occurrence.summary || record.summary || event.summary) || "Community event",
        start: allDay ? dateOnly(occurrence.start) : occurrence.start.toISOString(),
        end: occurrence.end
          ? allDay
            ? dateOnly(occurrence.end)
            : occurrence.end.toISOString()
          : null,
        allDay,
        location: plain(override?.location ?? record.location ?? event.location),
        description: plain(override?.description ?? record.description ?? event.description),
        url: safeUrl(override?.url ?? record.url ?? event.url),
      });
    }
  }
  return events.sort((a, b) => a.start.localeCompare(b.start));
}
let cached;
export async function getEvents({ fetcher = fetch, now = new Date(), useCache = true } = {}) {
  if (useCache && cached && now.getTime() - cached.timestamp < 300000) return cached.data;
  const response = await fetcher(config.calendarFeedUrl, {
    signal: AbortSignal.timeout(10000),
    redirect: "error",
    headers: { Accept: "text/calendar" },
  });
  if (!response.ok) throw new Error("Upstream calendar unavailable");
  const body = await response.text();
  if (body.length > 2000000) throw new Error("Calendar too large");
  const data = {
    events: await normalizeCalendar(body, now),
    retrievedAt: now.toISOString(),
    timeZone: "America/New_York",
    source: config.calendarFeedUrl,
  };
  if (useCache) cached = { timestamp: now.getTime(), data };
  return data;
}
