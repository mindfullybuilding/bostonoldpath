import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
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
