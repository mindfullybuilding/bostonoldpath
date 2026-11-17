import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { normalizePlumlineSnapshot } from "../lib/plumline.mjs";
import {
  dailySanghas,
  directoryDate,
  meetingMinutes,
  scheduleRow,
  dailyMarkup,
} from "../public/assets/sangha-schedule.js";
const groups = JSON.parse(
  await fs.readFile(new URL("../site/sanghas.json", import.meta.url), "utf8"),
);
const ids = (date) => dailySanghas(groups, date).scheduled.map((group) => group.id);
test("monthly sanghas occur only on their listed ordinal weekdays", () => {
  assert.ok(ids("2026-10-19T16:00:00Z").includes("tree-house-sangha"));
  assert.ok(!ids("2026-10-26T16:00:00Z").includes("tree-house-sangha"));
  assert.ok(ids("2026-10-07T16:00:00Z").includes("joyful-lotus-sangha"));
  assert.ok(!ids("2026-10-14T16:00:00Z").includes("joyful-lotus-sangha"));
  assert.ok(ids("2026-10-14T16:00:00Z").includes("wake-up-boston"));
  assert.ok(ids("2026-10-28T16:00:00Z").includes("wake-up-boston"));
  assert.ok(!ids("2026-12-30T16:00:00Z").includes("wake-up-boston"));
  assert.ok(ids("2026-10-11T16:00:00Z").includes("mountain-bell-sangha"));
  assert.equal(ids("2026-10-18T16:00:00Z").length, 0);
});
test("unknown alternating-week anchor is never invented as a dated occurrence", () => {
  const m = dailySanghas(groups, "2026-10-22T16:00:00Z");
  assert.ok(!m.scheduled.some((group) => group.id === "lotus-pond-sangha"));
  assert.equal(m.uncertain[0].id, "lotus-pond-sangha");
  assert.match(scheduleRow(m.uncertain[0], true), /Every other Thursday/);
  const markup = dailyMarkup(m);
  assert.ok(markup.includes("Lotus Pond Sangha"));
  assert.ok(!/confirm|check this week|organizer/i.test(markup));
  assert.equal((markup.match(/<ul /g) || []).length, 1);
});
test("Boston date changes at Eastern midnight and handles daylight saving time", () => {
  assert.equal(directoryDate("2026-10-20T03:59:59Z").date, "2026-10-19");
  assert.equal(directoryDate("2026-10-20T04:00:00Z").date, "2026-10-20");
  assert.equal(directoryDate("2026-11-02T04:59:59Z").weekday, "Sunday");
  assert.equal(directoryDate("2026-11-02T05:00:00Z").weekday, "Monday");
});
test("meeting times sort morning/noon/evening without altering original labels; text stays inert", () => {
  assert.equal(meetingMinutes({ time: "6:30-7:30 AM" }), 390);
  assert.equal(meetingMinutes({ time: "12:00-12:45 PM" }), 720);
  assert.equal(meetingMinutes({ time: "7:30-9:00 PM" }), 1170);
  assert.ok(meetingMinutes({ time: "Evening" }) > 1170);
  const row = scheduleRow({ ...groups[0], name: '<img onerror="bad">' });
  assert.ok(!row.includes("<img"));
  assert.match(row, /6:30-7:30 AM/);
});

const newYork = "America/New_York";
const fixtureGroup = (id, meetings) => ({
  ...groups.find((group) => group.id === id),
  meetings,
});
const meeting = (id, format, rule, exceptions = {}) => ({
  id,
  format,
  durationMinutes: 90,
  rule: { interval: 1, tzid: newYork, ...rule },
  ...exceptions,
});
const onBostonDay = (group, day) => dailySanghas([group], `${day}T17:00:00Z`).scheduled;

test("structured monthly rules list both sittings and do not add an off-pattern anchor", () => {
  const lotus = fixtureGroup("joyful-lotus-sangha", [
    meeting("first-wednesday", "in-person", {
      freq: "monthly",
      dtstart: "2026-10-01T19:00",
      byweekday: ["we"],
      bysetpos: 1,
    }),
    meeting("third-sunday", "virtual", {
      freq: "monthly",
      dtstart: "2026-10-18T10:00",
      byweekday: ["su"],
      bysetpos: [3],
    }),
  ]);
  assert.equal(onBostonDay(lotus, "2026-10-01").length, 0);
  assert.equal(onBostonDay(lotus, "2026-11-04")[0].time, "7:00–8:30 PM");
  assert.equal(onBostonDay(lotus, "2026-11-15")[0].time, "10:00–11:30 AM");
  assert.equal(onBostonDay(lotus, "2026-11-15")[0].location, "Online");
  assert.equal(onBostonDay(lotus, "2026-11-08").length, 0);
});

test("a reviewed Wake Up cancellation excludes only the affected sitting", () => {
  const wakeUp = fixtureGroup("wake-up-boston", [
    meeting(
      "wednesday",
      "in-person",
      {
        freq: "monthly",
        dtstart: "2026-10-14T19:30",
        byweekday: ["we"],
        bysetpos: [2, 4],
      },
      { excludeDates: ["2026-11-25"] },
    ),
    meeting("sunday", "in-person", {
      freq: "monthly",
      dtstart: "2026-10-11T19:00",
      byweekday: ["su"],
      bysetpos: 2,
    }),
  ]);
  assert.equal(onBostonDay(wakeUp, "2026-11-08")[0].time, "7:00–8:30 PM");
  assert.equal(onBostonDay(wakeUp, "2026-11-11")[0].time, "7:30–9:00 PM");
  assert.equal(onBostonDay(wakeUp, "2026-11-25").length, 0);
  assert.equal(onBostonDay(wakeUp, "2026-12-09")[0].time, "7:30–9:00 PM");
});

test("Path of Peace alternates in-person and online formats without a duplicate row", () => {
  const path = fixtureGroup("path-of-peace-sangha", [
    meeting("in-person", "in-person", {
      freq: "monthly",
      dtstart: "2026-10-12T19:00",
      byweekday: ["mo"],
      bysetpos: 2,
    }),
    meeting(
      "online",
      "virtual",
      {
        freq: "weekly",
        dtstart: "2026-10-05T19:00",
        byweekday: ["mo"],
      },
      { excludeOrdinals: [2] },
    ),
  ]);
  assert.deepEqual(
    onBostonDay(path, "2026-11-09").map(({ modality }) => modality),
    ["in-person"],
  );
  assert.deepEqual(
    onBostonDay(path, "2026-11-16").map(({ modality }) => modality),
    ["virtual"],
  );
});

test("fortnightly anchors and Boston wall time survive daylight-saving transitions", () => {
  const lotusPond = fixtureGroup("lotus-pond-sangha", [
    meeting("thursday", "virtual", {
      freq: "weekly",
      interval: 2,
      dtstart: "2026-10-22T19:30",
      byweekday: ["th"],
    }),
  ]);
  assert.equal(onBostonDay(lotusPond, "2026-10-22")[0].time, "7:30–9:00 PM");
  assert.equal(onBostonDay(lotusPond, "2026-10-29").length, 0);
  assert.equal(onBostonDay(lotusPond, "2026-11-05")[0].time, "7:30–9:00 PM");
  assert.deepEqual(dailySanghas([lotusPond], "2026-11-05T17:00:00Z").uncertain, []);
});

test("uses the Boston date for remote meetings and excludes undated text schedules", () => {
  const group = fixtureGroup("joyful-lotus-sangha", [
    meeting("remote-sunday", "virtual", {
      freq: "weekly",
      tzid: "Pacific/Auckland",
      dtstart: "2026-11-01T09:00",
      byweekday: ["su"],
    }),
  ]);
  assert.equal(onBostonDay(group, "2026-10-31")[0].time, "4:00–5:30 PM");
  assert.equal(onBostonDay(group, "2026-11-01").length, 0);
  assert.equal(onBostonDay(fixtureGroup("wake-up-boston", []), "2026-11-11").length, 0);
});

test("count uses matching dates and until includes an occurrence at its local limit", () => {
  const count = fixtureGroup("wake-up-boston", [
    meeting(
      "counted",
      "virtual",
      {
        freq: "monthly",
        dtstart: "2026-08-01T19:00",
        byweekday: ["mo"],
        bysetpos: 5,
        count: 2,
      },
      { excludeDates: ["2026-08-31"] },
    ),
  ]);
  const until = fixtureGroup("wake-up-boston", [
    meeting("limited", "virtual", {
      freq: "daily",
      dtstart: "2026-11-09T19:00",
      until: "2026-11-10T19:00",
    }),
  ]);
  assert.equal(onBostonDay(count, "2026-08-31").length, 0);
  assert.equal(onBostonDay(count, "2026-11-30").length, 1);
  assert.equal(onBostonDay(count, "2027-03-29").length, 0);
  assert.equal(onBostonDay(until, "2026-11-10").length, 1);
  assert.equal(onBostonDay(until, "2026-11-11").length, 0);
});

test("a sitting spanning midnight stays on its start day and uses clock labels", () => {
  const group = fixtureGroup("wake-up-boston", [
    meeting("overnight", null, {
      freq: "daily",
      dtstart: "2026-11-09T23:45",
      count: 1,
    }),
  ]);
  const rows = onBostonDay(group, "2026-11-09");
  assert.equal(rows[0].time, "11:45 PM–1:15 AM");
  assert.equal(meetingMinutes(rows[0]), 23 * 60 + 45);
  assert.doesNotMatch(scheduleRow(rows[0]), /undefined|null/);
  assert.equal(onBostonDay(group, "2026-11-10").length, 0);
});

test("yearly leap-day and last-weekday rules never invent nonexistent calendar dates", () => {
  const leapDay = fixtureGroup("wake-up-boston", [
    meeting("leap-day", "virtual", {
      freq: "yearly",
      dtstart: "2024-02-29T19:00",
      bymonth: 2,
      bymonthday: 29,
    }),
  ]);
  assert.equal(onBostonDay(leapDay, "2026-02-28").length, 0);
  assert.equal(onBostonDay(leapDay, "2028-02-29").length, 1);
  const lastMonday = fixtureGroup("path-of-peace-sangha", [
    meeting("last-monday", "virtual", {
      freq: "monthly",
      dtstart: "2026-08-01T19:00",
      byweekday: ["mo"],
      bysetpos: -1,
    }),
  ]);
  assert.equal(onBostonDay(lastMonday, "2026-08-24").length, 0);
  assert.equal(onBostonDay(lastMonday, "2026-08-31").length, 1);
});

test("the fixture preview snapshot carries schedule exceptions and meeting details to the homepage", async () => {
  const readFixture = async (file) =>
    JSON.parse(await fs.readFile(new URL(`../site/fixtures/${file}`, import.meta.url), "utf8"));
  const [payload, roster] = await Promise.all([
    readFixture("plumline-v1.json"),
    readFixture("plumline-roster.json"),
  ]);
  const snapshot = normalizePlumlineSnapshot(payload, roster, groups);
  const onDay = (id, date) =>
    dailySanghas(snapshot.sanghas, `${date}T17:00:00Z`).scheduled.find((group) => group.id === id);
  assert.equal(onDay("wake-up-boston", "2026-11-25"), undefined);
  assert.equal(onDay("wake-up-boston", "2026-12-09").time, "7:30–9:00 PM");
  assert.equal(onDay("joyful-lotus-sangha", "2026-11-04").time, "5:00–6:30 PM");
  assert.equal(onDay("joyful-lotus-sangha", "2026-11-15").time, "2:00–3:30 PM");
  assert.equal(onDay("path-of-peace-sangha", "2026-11-09").modality, "in-person");
  assert.equal(onDay("path-of-peace-sangha", "2026-11-16").location, "Online");
  assert.equal(onDay("dandelions-of-the-heart-sangha", "2026-11-16"), undefined);
});

test("a nonexistent spring-forward wall time does not consume a recurrence count", () => {
  const group = fixtureGroup("wake-up-boston", [
    meeting("spring-forward", "virtual", {
      freq: "weekly",
      dtstart: "2026-03-01T02:30",
      byweekday: ["su"],
      count: 2,
    }),
  ]);
  assert.equal(onBostonDay(group, "2026-03-01").length, 1);
  assert.equal(onBostonDay(group, "2026-03-08").length, 0);
  assert.equal(onBostonDay(group, "2026-03-15").length, 1);
  assert.equal(onBostonDay(group, "2026-03-22").length, 0);
});
