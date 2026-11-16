const oneDay = 86_400_000;
const weekdayCodes = ["su", "mo", "tu", "we", "th", "fr", "sa"];
export const bostonTimeZone = "America/New_York";

const zonedFormatters = new Map();
function wallTimeAt(instant, zone) {
  if (!zonedFormatters.has(zone)) {
    zonedFormatters.set(
      zone,
      new Intl.DateTimeFormat("en-CA", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }),
    );
  }
  const parts = Object.fromEntries(
    zonedFormatters
      .get(zone)
      .formatToParts(instant)
      .map(({ type, value }) => [type, value]),
  );
  return Date.parse(
    `${parts.year.padStart(4, "0")}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`,
  );
}

// Encode a wall-clock date on the UTC calendar for arithmetic. Resolve its timezone separately.
function readWallTime(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return NaN;
  const canonical = value.length === 16 ? `${value}:00` : value;
  const timestamp = Date.parse(`${canonical}Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().startsWith(canonical)
    ? timestamp
    : NaN;
}

function resolveWallTime(wallTime, zone) {
  // Both offsets may apply on the day the clocks change. Prefer the earlier repeated time.
  const candidates = [wallTime - oneDay, wallTime + oneDay].map(
    (sample) => wallTime + sample - wallTimeAt(sample, zone),
  );
  return Math.min(...candidates.filter((instant) => wallTimeAt(instant, zone) === wallTime));
}

export function bostonDayBounds(date) {
  const wallDay = readWallTime(`${date}T00:00`);
  return [
    resolveWallTime(wallDay, bostonTimeZone),
    resolveWallTime(wallDay + oneDay, bostonTimeZone),
  ];
}

const midnight = (wallTime) => Math.floor(wallTime / oneDay) * oneDay;
const ordinal = (date) => Math.ceil(date.getUTCDate() / 7);
const isLastOfWeekday = (date) =>
  new Date(date.getTime() + 7 * oneDay).getUTCMonth() !== date.getUTCMonth();
const monday = (day, weekday) => day - ((weekday + 6) % 7) * oneDay;
const monthIndex = (date) => date.getUTCFullYear() * 12 + date.getUTCMonth();

function matchesOrdinal(positions, date) {
  return positions.includes(ordinal(date)) || (positions.includes(-1) && isLastOfWeekday(date));
}

function matchingDays(rule, anchorDay) {
  const anchor = new Date(anchorDay);
  const anchorWeek = monday(anchorDay, anchor.getUTCDay());
  const positions = Array.isArray(rule.bysetpos) ? rule.bysetpos : [rule.bysetpos];

  return (day) => {
    const date = new Date(day);
    const weekday = date.getUTCDay();
    switch (rule.freq) {
      case "daily":
        return ((day - anchorDay) / oneDay) % rule.interval === 0;
      case "weekly":
        return (
          ((monday(day, weekday) - anchorWeek) / (7 * oneDay)) % rule.interval === 0 &&
          rule.byweekday?.includes(weekdayCodes[weekday])
        );
      case "monthly": {
        if ((monthIndex(date) - monthIndex(anchor)) % rule.interval !== 0) return false;
        if (rule.bymonthday != null) return date.getUTCDate() === rule.bymonthday;
        return rule.byweekday?.includes(weekdayCodes[weekday]) && matchesOrdinal(positions, date);
      }
      case "yearly":
        return (
          (date.getUTCFullYear() - anchor.getUTCFullYear()) % rule.interval === 0 &&
          date.getUTCMonth() + 1 === rule.bymonth &&
          date.getUTCDate() === rule.bymonthday
        );
      default:
        return false;
    }
  };
}

function withinCount(day, anchorDay, matches, resolveInstant, count) {
  if (count == null) return true;
  for (let date = anchorDay; date < day; date += oneDay) {
    if (matches(date) && Number.isFinite(resolveInstant(date)) && --count === 0) return false;
  }
  return true;
}

export function meetingOccurrences(meeting, [start, end]) {
  const rule = meeting.rule;
  if (!rule?.tzid || !Number.isInteger(rule.interval) || rule.interval < 1) return [];
  const anchor = readWallTime(rule.dtstart);
  const until = rule.until == null ? Infinity : readWallTime(rule.until);
  if (!Number.isFinite(anchor) || Number.isNaN(until)) return [];

  let firstDay, lastDay;
  try {
    firstDay = midnight(wallTimeAt(start, rule.tzid));
    lastDay = midnight(wallTimeAt(end - 1000, rule.tzid));
  } catch (error) {
    if (error instanceof RangeError) return [];
    throw error;
  }
  const anchorDay = midnight(anchor);
  const clock = anchor - anchorDay;
  const matches = matchingDays(rule, anchorDay);
  const resolveInstant = (day) => resolveWallTime(day + clock, rule.tzid);
  const occurrences = [];

  for (let day = Math.max(firstDay, anchorDay); day <= lastDay; day += oneDay) {
    if (day + clock > until || !matches(day)) continue;
    const instant = resolveInstant(day);
    if (!(instant >= start && instant < end)) continue;
    // The count includes earlier resolvable occurrences even if a local override hides them.
    if (!withinCount(day, anchorDay, matches, resolveInstant, rule.count)) continue;
    const date = new Date(day);
    if (
      meeting.excludeDates?.includes(date.toISOString().slice(0, 10)) ||
      matchesOrdinal(meeting.excludeOrdinals ?? [], date)
    ) {
      continue;
    }
    occurrences.push(instant);
  }
  return occurrences;
}
