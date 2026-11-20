import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Mustache from "mustache";
import { applyPlumlineScheduleReview } from "../lib/plumline-schedule-review.mjs";
import { matchesSangha } from "../public/assets/sangha-filters.js";
import { dailySanghas } from "../public/assets/sangha-schedule.js";
import { directoryView } from "../site/pages/find-a-sangha.mjs";

const card = await readFile(
  new URL("../site/pages/partials/sangha-card.html", import.meta.url),
  "utf8",
);
const bostonTimeZone = "America/New_York";
const reviewDate = Date.parse("2026-11-20T17:00:00Z");
const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const disputedMeeting = {
  id: "imported-daily",
  format: "in-person",
  rule: { freq: "daily", interval: 1, tzid: bostonTimeZone, dtstart: "2026-10-01T06:30" },
  durationMinutes: 45,
  days: weekdayNames,
  dayLabel: "Daily",
  timeLabel: "6:30 AM–7:15 AM",
  timeBand: "morning",
};
const dandelions = {
  id: "dandelions-of-the-heart-sangha",
  name: "Dandelions of the Heart Sangha",
  location: "Newton",
  modality: "in-person",
  publicVenue: false,
  day: disputedMeeting.dayLabel,
  time: disputedMeeting.timeLabel,
  days: disputedMeeting.days,
  timeBand: disputedMeeting.timeBand,
  meetings: [disputedMeeting],
};
const wednesday = {
  id: "wake-wednesday",
  format: "in-person",
  durationMinutes: 90,
  rule: {
    freq: "monthly",
    interval: 1,
    dtstart: "2026-10-14T19:30",
    tzid: bostonTimeZone,
    byweekday: ["we"],
    bysetpos: [2, 4],
  },
  days: ["wednesday"],
  dayLabel: "Second and fourth Wednesday of the month",
  timeLabel: "7:30 PM–9:00 PM",
  timeBand: "evening",
  excludeDates: ["2026-11-25"],
};
const wakeUp = {
  id: "wake-up-boston",
  name: "Wake Up Boston",
  location: "Cambridge",
  modality: "in-person",
  day: wednesday.dayLabel,
  time: wednesday.timeLabel,
  days: wednesday.days,
  timeBand: wednesday.timeBand,
  meetings: [wednesday],
};
const onDay = (sangha, date) => dailySanghas([sangha], `${date}T17:00:00Z`).scheduled;
const filter = (key, value) => {
  const form = new FormData();
  form.set(key, value);
  return form;
};

test("withholds the disputed Dandelions sitting from the preview without modifying source data", () => {
  const [reviewed] = applyPlumlineScheduleReview([dandelions]);
  assert.deepEqual(reviewed.meetings, []);
  assert.deepEqual(onDay(reviewed, "2026-11-20"), []);
  assert.equal(matchesSangha(reviewed, filter("modality", "in-person")), false);
  assert.equal(matchesSangha(reviewed, filter("search", "Dandelions")), true);
  const { groupsHTML, mapVenues } = directoryView([reviewed], card, { useDirectoryMap: true });
  assert.ok(groupsHTML.includes(`href="${Mustache.escape("https://www.yenkuei.org/services")}"`));
  assert.match(groupsHTML, /format is pending confirmation/);
  assert.doesNotMatch(groupsHTML, /6:30 AM|Get Directions/);
  assert.deepEqual(mapVenues, []);
  assert.equal(dandelions.meetings[0], disputedMeeting);
  assert.match(directoryView([dandelions], card).groupsHTML, /6:30 AM/);
});

test("passes through a corrected Dandelions meeting and preserves other meetings", () => {
  const corrected = { ...disputedMeeting, id: "online-daily", format: "virtual" };
  const [resolved] = applyPlumlineScheduleReview([{ ...dandelions, meetings: [corrected] }]);
  assert.equal(resolved.meetings[0], corrected);
  assert.equal(onDay(resolved, "2026-11-20")[0].location, "Online");
  const [mixed] = applyPlumlineScheduleReview([
    { ...dandelions, meetings: [disputedMeeting, corrected] },
  ]);
  assert.deepEqual(mixed.meetings, [corrected]);
  assert.equal(matchesSangha(mixed, filter("modality", "virtual")), true);
  assert.equal(matchesSangha(mixed, filter("modality", "in-person")), false);
  const independentSitting = {
    ...disputedMeeting,
    id: "one-off-in-person",
    rule: { ...disputedMeeting.rule, dtstart: "2026-11-20T06:30", count: 1 },
  };
  const [withOneOff] = applyPlumlineScheduleReview([
    { ...dandelions, meetings: [disputedMeeting, independentSitting] },
  ]);
  assert.deepEqual(withOneOff.meetings, [independentSitting]);
});

test("adds only the organizer-confirmed December Sunday and preserves the November cancellation", () => {
  const [reviewed] = applyPlumlineScheduleReview([wakeUp], reviewDate);
  assert.equal(onDay(reviewed, "2026-12-13")[0].time, "7:00–8:30 PM");
  assert.deepEqual(onDay(reviewed, "2026-11-25"), []);
  assert.deepEqual(onDay(reviewed, "2027-01-10"), []);
  assert.equal(matchesSangha(reviewed, filter("day", "sunday"), "2026-12-13"), true);
  assert.equal(matchesSangha(reviewed, filter("day", "sunday"), "2026-12-14"), false);
  assert.equal(matchesSangha(reviewed, filter("day", "wednesday"), "2026-12-14"), true);
  const { groupsHTML } = directoryView([reviewed], card, { useDirectoryMap: true });
  assert.match(groupsHTML, /data-meeting-until="2026-12-13"/);
  assert.match(groupsHTML, /Sunday, December 13, 2026/);
  assert.match(groupsHTML, /data-sort-day="wednesday"/);
  assert.ok(
    groupsHTML.includes(`href="${Mustache.escape("https://bostonwakeup.substack.com/about")}"`),
  );
  assert.deepEqual(wakeUp.meetings, [wednesday]);

  const [expired] = applyPlumlineScheduleReview([wakeUp], Date.parse("2026-12-14T05:00:00Z"));
  assert.deepEqual(expired.meetings, [wednesday]);
  const [textOnly] = applyPlumlineScheduleReview([{ ...wakeUp, meetings: [] }], reviewDate);
  assert.equal(onDay(textOnly, "2026-12-13").length, 1);
});

test("uses the upstream Wake Up Sunday when its recurrence already covers the confirmed date", () => {
  const upstreamSunday = {
    ...wednesday,
    id: "imported-sunday",
    rule: {
      ...wednesday.rule,
      dtstart: "2026-11-08T19:00",
      byweekday: ["su"],
      bysetpos: [2],
    },
    days: ["sunday"],
    dayLabel: "Second Sunday",
    timeLabel: "7:00 PM–8:30 PM",
  };
  const [reviewed] = applyPlumlineScheduleReview(
    [{ ...wakeUp, meetings: [wednesday, upstreamSunday] }],
    reviewDate,
  );
  assert.deepEqual(reviewed.meetings, [wednesday, upstreamSunday]);
  assert.equal(onDay(reviewed, "2026-12-13").length, 1);

  const cancelled = { ...upstreamSunday, excludeDates: ["2026-12-13"] };
  const [cancelledReview] = applyPlumlineScheduleReview(
    [{ ...wakeUp, meetings: [wednesday, cancelled] }],
    reviewDate,
  );
  assert.deepEqual(onDay(cancelledReview, "2026-12-13"), []);

  const earlier = {
    ...upstreamSunday,
    id: "imported-earlier-sunday",
    rule: { ...upstreamSunday.rule, dtstart: "2026-11-08T10:00" },
    format: "virtual",
    durationMinutes: 60,
  };
  const sameTimeWrongFormat = { ...upstreamSunday, format: "virtual" };
  const [corrected] = applyPlumlineScheduleReview(
    [{ ...wakeUp, meetings: [wednesday, earlier, sameTimeWrongFormat] }],
    reviewDate,
  );
  assert.deepEqual(
    onDay(corrected, "2026-12-13").map(({ time, modality }) => [time, modality]),
    [
      ["10:00–11:00 AM", "virtual"],
      ["7:00–8:30 PM", "in-person"],
    ],
  );
  assert.equal(onDay(corrected, "2027-01-10")[1].modality, "virtual");
});

test("replaces only the matching occurrence across midnight in the source meeting's timezone", () => {
  const paris = {
    ...wednesday,
    format: "virtual",
    rule: {
      freq: "daily",
      interval: 1,
      dtstart: "2026-12-13T01:00",
      tzid: "Europe/Paris",
    },
    excludeDates: [],
  };
  const [reviewed] = applyPlumlineScheduleReview([{ ...wakeUp, meetings: [paris] }], reviewDate);
  assert.deepEqual(reviewed.meetings[0].excludeDates, ["2026-12-14"]);
  assert.deepEqual(
    onDay(reviewed, "2026-12-12").map(({ modality }) => modality),
    ["virtual"],
  );
  assert.deepEqual(
    onDay(reviewed, "2026-12-13").map(({ modality }) => modality),
    ["in-person"],
  );
  assert.deepEqual(paris.excludeDates, []);
});
