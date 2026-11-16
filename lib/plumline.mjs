import { createHash } from "node:crypto";
import { config } from "../site/config.mjs";

const weekdays = {
  su: "sunday",
  mo: "monday",
  tu: "tuesday",
  we: "wednesday",
  th: "thursday",
  fr: "friday",
  sa: "saturday",
};
const frequencies = { daily: "day", weekly: "week", monthly: "month", yearly: "year" };
const ordinalLabels = {
  1: "first",
  2: "second",
  3: "third",
  4: "fourth",
  5: "fifth",
  "-1": "last",
};
const formatValues = new Map([
  ["in person", "in-person"],
  ["in-person", "in-person"],
  ["local", "in-person"],
  ["local sangha", "in-person"],
  ["online", "virtual"],
  ["online sangha", "virtual"],
  ["virtual", "virtual"],
  ["hybrid", "hybrid"],
]);
const hosts = new Set(["plumline.org", "www.plumline.org", "new.plumline.org"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;
const clockPattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const localIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value) {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validDateTime(value) {
  return (
    typeof value === "string" &&
    dateTimePattern.test(value) &&
    validDate(value.slice(0, 10)) &&
    clockPattern.test(value.slice(11, 16)) &&
    (value.length === 16 || /^[0-5]\d$/.test(value.slice(17)))
  );
}

function validZone(value) {
  if (typeof value !== "string" || !value || /^[+-]/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function timeWithSeconds(value) {
  return value.length === 16 ? value + ":00" : value;
}

function integerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function readOrdinals(value) {
  const ordinals = Array.isArray(value) ? value : [value];
  check(
    ordinals.length > 0 &&
      ordinals.every(
        (ordinal) => Object.hasOwn(ordinalLabels, ordinal) && Number.isInteger(ordinal),
      ),
    "Invalid Plumline month ordinals.",
  );
  return ordinals;
}

function normalizeRule(rule) {
  if (rule === null || rule === undefined) return null;
  check(
    record(rule) && Object.hasOwn(frequencies, rule.freq),
    "Invalid Plumline recurrence frequency.",
  );
  const { freq, interval, dtstart, tzid } = rule;
  check(
    integerInRange(interval, 1, Number.MAX_SAFE_INTEGER),
    "Invalid Plumline recurrence interval.",
  );
  check(
    validDateTime(dtstart) && validZone(tzid),
    "Invalid Plumline recurrence start or timezone.",
  );
  const normalized = { freq, interval, dtstart, tzid };
  if (freq === "weekly" || (freq === "monthly" && rule.bysetpos !== undefined)) {
    check(
      Array.isArray(rule.byweekday) &&
        rule.byweekday.length > 0 &&
        rule.byweekday.every((day) => Object.hasOwn(weekdays, day)),
      "Invalid Plumline recurrence weekdays.",
    );
    normalized.byweekday = [...new Set(rule.byweekday)];
  }
  if (freq === "monthly" && rule.bysetpos !== undefined) {
    check(
      normalized.byweekday.length === 1 && rule.bymonthday === undefined,
      "Invalid Plumline ordinal recurrence.",
    );
    const ordinals = readOrdinals(rule.bysetpos);
    normalized.bysetpos = Array.isArray(rule.bysetpos) ? [...new Set(ordinals)] : ordinals[0];
  }
  if ((freq === "monthly" && normalized.bysetpos === undefined) || freq === "yearly") {
    check(integerInRange(rule.bymonthday, 1, 31), "Invalid Plumline day of month.");
    normalized.bymonthday = rule.bymonthday;
  }
  if (freq === "yearly") {
    check(integerInRange(rule.bymonth, 1, 12), "Invalid Plumline month.");
    normalized.bymonth = rule.bymonth;
  }
  if (rule.count !== undefined) {
    check(
      rule.until === undefined && integerInRange(rule.count, 1, Number.MAX_SAFE_INTEGER),
      "Invalid Plumline recurrence count.",
    );
    normalized.count = rule.count;
  }
  if (rule.until !== undefined) {
    check(
      validDateTime(rule.until) && timeWithSeconds(rule.until) >= timeWithSeconds(dtstart),
      "Invalid Plumline recurrence end.",
    );
    normalized.until = rule.until;
  }
  return normalized;
}

function normalizeFormat(value) {
  return formatValues.get(cleanText(value).toLowerCase()) ?? null;
}

function safeWebsite(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

function profileUrl(row) {
  const url = safeWebsite(row.url);
  return url &&
    hosts.has(url.hostname) &&
    url.port === "" &&
    /^\/sanghas\/[\w-]+\/?$/.test(url.pathname)
    ? url.origin + url.pathname
    : null;
}

function headingCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function displayDay(rule, day) {
  if (!rule) {
    const weekday = weekdays[cleanText(day).toLowerCase().slice(0, 2)];
    return weekday ? headingCase(weekday) : "";
  }
  const cadence =
    rule.interval > 1 ? "Every " + rule.interval + " " + frequencies[rule.freq] + "s" : "";
  const names = rule.byweekday?.map((weekday) => headingCase(weekdays[weekday])).join(", ");
  switch (rule.freq) {
    case "daily":
      return cadence || "Daily";
    case "weekly":
      return cadence ? cadence + " on " + names : names;
    case "monthly":
      if (rule.bysetpos !== undefined) {
        const ordinals = readOrdinals(rule.bysetpos).map((position) => ordinalLabels[position]);
        return (
          headingCase(ordinals.join(" and ")) +
          " " +
          names +
          (cadence ? " · " + cadence : " of the month")
        );
      }
      return "Day " + rule.bymonthday + " · " + (cadence || "Monthly");
    case "yearly": {
      const date = new Date(Date.UTC(2024, rule.bymonth - 1, 1));
      const month = date.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
      return month + " " + rule.bymonthday + (cadence ? " · " + cadence : " · Yearly");
    }
  }
}

function meetingDays(rule, day) {
  if (rule?.byweekday) return rule.byweekday.map((weekday) => weekdays[weekday]);
  if (rule) return Object.values(weekdays);
  const weekday = weekdays[cleanText(day).toLowerCase().slice(0, 2)];
  return weekday ? [weekday] : [];
}

function displayClock(minutes) {
  const hour = Math.floor(minutes / 60) % 24;
  return (
    (hour % 12 || 12) + ":" + String(minutes % 60).padStart(2, "0") + (hour < 12 ? " AM" : " PM")
  );
}

function displayTime(clock, duration, zone) {
  if (!clockPattern.test(clock)) return { timeLabel: "", timeBand: null };
  const minutes = Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
  const range =
    duration === null
      ? displayClock(minutes)
      : displayClock(minutes) + "–" + displayClock(minutes + duration);
  const timeLabel = zone && zone !== "America/New_York" ? range + " (" + zone + ")" : range;
  const timeBand = minutes < 720 ? "morning" : minutes < 1020 ? "afternoon" : "evening";
  return { timeLabel, timeBand };
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function normalizeMeeting(row, hideFreeText) {
  check(record(row), "Invalid Plumline meeting.");
  const rule = normalizeRule(row.recurrenceRule);
  const format = normalizeFormat(row.format);
  const durationMinutes = row.durationMinutes ?? null;
  check(
    durationMinutes === null || integerInRange(durationMinutes, 1, 1440),
    "Invalid Plumline meeting duration.",
  );
  const clock =
    rule?.dtstart.slice(11, 16) ?? (cleanText(row.time) || cleanText(row.startTime).slice(11, 16));
  const zone = rule?.tzid ?? (validZone(row.timezone) ? row.timezone : null);
  const dayLabel = displayDay(rule, row.day);
  return {
    id:
      "meeting-" + hash([rule, row.startTime ?? null, format, row.day ?? null, clock]).slice(0, 16),
    format,
    rule,
    summary: hideFreeText ? "" : cleanText(row.recurrenceSummary),
    durationMinutes,
    days: meetingDays(rule, row.day),
    ...displayTime(clock, durationMinutes, zone),
    dayLabel,
  };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!record(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonical(value[key])]),
  );
}

function applyMeetingOverrides(meetings, overrides = []) {
  check(Array.isArray(overrides), "Invalid roster meeting overrides.");
  const replaced = new Set();
  for (const override of overrides) {
    check(
      record(override) &&
        record(override.match) &&
        localIdPattern.test(override.id ?? "") &&
        Object.keys(override.match).some((key) => key === "rule" || key === "format") &&
        Object.keys(override.match).every((key) => key === "rule" || key === "format"),
      "A local meeting override needs an ID and a schedule selector.",
    );
    const matches = meetings.filter((meeting) =>
      Object.entries(override.match).every(
        ([key, value]) =>
          JSON.stringify(canonical(meeting[key])) === JSON.stringify(canonical(value)),
      ),
    );
    check(
      matches.length === 1 && !replaced.has(matches[0]),
      "Local meeting override needs a unique match.",
    );
    const [meeting] = matches;
    replaced.add(meeting);
    meeting.id = override.id;
    if (override.excludeDates !== undefined) {
      check(
        Array.isArray(override.excludeDates) && override.excludeDates.every(validDate),
        "Invalid skipped meeting dates.",
      );
      meeting.excludeDates = [...new Set(override.excludeDates)].sort();
    }
    if (override.excludeOrdinals !== undefined) {
      check(Array.isArray(override.excludeOrdinals), "Invalid skipped meeting ordinals.");
      meeting.excludeOrdinals = [...new Set(readOrdinals(override.excludeOrdinals))];
    }
  }
  check(
    new Set(meetings.map(({ id }) => id)).size === meetings.length,
    "Duplicate normalized meeting IDs.",
  );
  return meetings;
}

function groupModality(meetings, types, fallback) {
  const modes = new Set(meetings.map(({ format }) => format).filter(Boolean));
  if (!modes.size) {
    for (const type of types) {
      const format = normalizeFormat(type);
      if (format) modes.add(format);
    }
  }
  if (modes.size > 1 || modes.has("hybrid")) return "hybrid";
  return [...modes][0] ?? fallback ?? null;
}

function validateRoster(roster, baseline) {
  check(record(roster) && Array.isArray(roster.entries), "Invalid MCGB Plumline roster.");
  check(Array.isArray(baseline), "Invalid local directory baseline.");
  const localIds = new Set();
  const upstreamIds = new Set();
  for (const entry of roster.entries) {
    check(
      record(entry) && localIdPattern.test(entry.localId ?? "") && !localIds.has(entry.localId),
      "Invalid or duplicate MCGB roster ID.",
    );
    localIds.add(entry.localId);
    if (entry.plumlineId != null) {
      check(
        cleanText(entry.plumlineId) === entry.plumlineId &&
          entry.plumlineId.length > 0 &&
          !upstreamIds.has(entry.plumlineId),
        "Invalid or duplicate approved Plumline ID.",
      );
      upstreamIds.add(entry.plumlineId);
    }
    check(
      entry.venue === undefined || ["local", "plumline", "withhold"].includes(entry.venue),
      "Invalid MCGB venue policy.",
    );
    check(
      entry.onMissing === undefined || entry.onMissing === "local",
      "Invalid MCGB missing-record policy.",
    );
  }
  return new Map(baseline.map((group) => [group.id, group]));
}

function validatePayload(payload) {
  check(
    record(payload) &&
      payload.apiVersion === "v1" &&
      Array.isArray(payload.sanghas) &&
      payload.sanghas.length > 0 &&
      payload.count === payload.sanghas.length,
    "Invalid or empty Plumline v1 response.",
  );
  const byId = new Map();
  for (const row of payload.sanghas) {
    check(
      record(row) && cleanText(row.id) === row.id && row.id.length > 0 && !byId.has(row.id),
      "Invalid or duplicate Plumline directory ID.",
    );
    byId.set(row.id, row);
  }
  return byId;
}

function publicLocalFields(local) {
  const {
    id,
    name,
    region,
    area,
    modality,
    day,
    time,
    days,
    timeBand,
    location,
    address,
    latLng,
    access,
    description,
    registerUrl,
    approximate,
  } = local;
  return {
    id,
    name,
    region,
    area,
    modality,
    day,
    time,
    days,
    timeBand,
    location,
    address,
    latLng,
    access,
    description,
    registerUrl,
    approximate,
  };
}

function applyVenuePolicy(group, entry, upstream) {
  group.publicVenue =
    entry.publicVenue === true &&
    entry.venue !== "withhold" &&
    group.modality !== "virtual" &&
    !group.approximate;
  if (!group.publicVenue) {
    delete group.address;
    delete group.latLng;
    delete group.approximate;
    return;
  }
  if (entry.venue !== "plumline" || !upstream) return;
  delete group.address;
  delete group.latLng;
  delete group.approximate;
  const address = cleanText(upstream.address);
  if (address) group.address = address;
  const { latitude, longitude } = upstream;
  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  ) {
    group.latLng = [latitude, longitude];
  }
}

function localGroup(entry, baseline) {
  check(
    baseline.has(entry.localId) && entry.keepLocal === true,
    "A local fallback must identify a reviewed editorial listing.",
  );
  const group = structuredClone(publicLocalFields(baseline.get(entry.localId)));
  if (cleanText(entry.location)) group.location = cleanText(entry.location);
  applyVenuePolicy(group, entry);
  return group;
}

function joinRoute(row, local) {
  const profile = row.canReceiveIntro === true && profileUrl(row);
  if (profile) return { registerUrl: profile, contactKind: "plumline" };
  if (local?.registerUrl) return { registerUrl: local.registerUrl };
  const website = safeWebsite(row.website);
  if (website) return { registerUrl: website.href, contactKind: "group" };
  return { registerUrl: "mailto:" + config.contactEmail, contactKind: "mcgb" };
}

function normalizeGroup(row, entry, local) {
  check(
    Boolean(cleanText(row.name)) &&
      Array.isArray(row.types) &&
      Array.isArray(row.affinities) &&
      Array.isArray(row.meetings) &&
      typeof row.canReceiveIntro === "boolean" &&
      ["structured", "text"].includes(row.meetingScheduleMode),
    "A selected Plumline listing has an invalid shape.",
  );
  check(
    row.affinities.every((value) => typeof value === "string"),
    "Invalid Plumline affinities.",
  );
  const hideFreeText = entry.venue === "withhold";
  const meetings = applyMeetingOverrides(
    row.meetingScheduleMode === "structured"
      ? row.meetings.map((meeting) => normalizeMeeting(meeting, hideFreeText))
      : [],
    entry.meetingOverrides,
  );
  const modality = groupModality(meetings, row.types, local?.modality);
  const meetingDescription = hideFreeText
    ? row.meetingScheduleMode === "text"
      ? "Contact the organizer for current meeting details."
      : ""
    : cleanText(row.meetingDescription);
  const days = Object.values(weekdays).filter((day) =>
    meetings.some((meeting) => meeting.days.includes(day)),
  );
  const group = {
    ...(local ? publicLocalFields(local) : {}),
    id: entry.localId,
    name: cleanText(entry.name) || row.name.trim(),
    region: local?.region ?? "boston",
    area: local?.area ?? "Greater Boston",
    modality,
    day:
      meetings
        .map(({ dayLabel }) => dayLabel)
        .filter(Boolean)
        .join("; ") || "See meeting details",
    time:
      meetings
        .map(({ timeLabel }) => timeLabel)
        .filter(Boolean)
        .join("; ") || "See meeting details",
    days,
    timeBand: meetings[0]?.timeBand ?? null,
    location:
      modality === "virtual"
        ? "Online"
        : cleanText(entry.location) || local?.location || "Contact organizer",
    access: local?.access ?? "",
    description: (hideFreeText ? "" : cleanText(row.description)) || local?.description || "",
    meetingDescription,
    affinities: [...new Set(row.affinities.map(cleanText).filter(Boolean))],
    meetings,
    ...joinRoute(row, local),
  };
  applyVenuePolicy(group, entry, row);
  return group;
}

export function normalizePlumlineSnapshot(payload, roster, baseline) {
  const byId = validatePayload(payload);
  const local = validateRoster(roster, baseline);
  const sanghas = [];
  const review = { matched: [], localOnly: [], missing: [], blocked: [] };
  for (const entry of roster.entries) {
    const { localId, plumlineId } = entry;
    if (plumlineId == null) {
      sanghas.push(localGroup(entry, local));
      review.localOnly.push(localId);
      continue;
    }
    const row = byId.get(plumlineId);
    if (!row) {
      review.missing.push(localId);
      if (entry.onMissing === "local") sanghas.push(localGroup(entry, local));
      else review.blocked.push(localId);
      continue;
    }
    sanghas.push(normalizeGroup(row, entry, local.get(localId)));
    review.matched.push(localId);
  }
  return { sanghas, review };
}

function comparableName(value) {
  return cleanText(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function reviewPlumlineMatches(payload, roster, baseline) {
  const byId = validatePayload(payload);
  const local = validateRoster(roster, baseline);
  return roster.entries.map(({ localId, name, plumlineId, plumlineSlug, aliases = [] }) => {
    check(
      Array.isArray(aliases) && aliases.every((alias) => typeof alias === "string"),
      "Invalid MCGB roster match aliases.",
    );
    const names = new Set(
      [name || local.get(localId)?.name, ...aliases].map(comparableName).filter(Boolean),
    );
    const candidates = [...byId.values()].filter(
      (row) =>
        row.id === plumlineId ||
        (cleanText(row.slug) && [localId, plumlineSlug].includes(cleanText(row.slug))) ||
        names.has(comparableName(row.name)),
    );
    return {
      localId,
      approvedId: plumlineId ?? null,
      candidates: candidates.map((row) => ({
        id: row.id,
        name: cleanText(row.name),
        url: profileUrl(row),
      })),
    };
  });
}
