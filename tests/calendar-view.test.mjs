import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calendarDateKey,
  eventDateBounds,
  monthModel,
  monthTable,
} from "../public/assets/calendar-view.js";
test("month grid handles leap years and year boundaries without timezone drift", () => {
  const leap = monthModel(2028, 1, [], "2028-02-29");
  assert.equal(leap.days.filter(Boolean).length, 29);
  assert.equal(leap.days.find((day) => day?.today).day, 29);
  assert.equal(monthModel(2026, 12).label, "January 2027");
  assert.equal(monthModel(2026, -1).label, "December 2025");
  assert.equal((monthTable(leap).match(/<th scope/g) || []).length, 7);
});
test("calendar counts all-day and overnight events with exclusive ends in Eastern time", () => {
  const span = { allDay: true, start: "2026-10-31", end: "2026-11-03" };
  const night = { allDay: false, start: "2026-11-02T04:00:00Z", end: "2026-11-02T05:00:00Z" };
  assert.deepEqual(eventDateBounds(span), { start: "2026-10-31", end: "2026-11-02" });
  assert.deepEqual(eventDateBounds(night), { start: "2026-11-01", end: "2026-11-01" });
  assert.equal(calendarDateKey("2026-11-02T04:30:00Z"), "2026-11-01");
  const november = monthModel(2026, 10, [span, night], "2026-11-01");
  assert.equal(november.events.length, 2);
  assert.equal(november.days.find((day) => day?.day === 1).count, 2);
  assert.equal(november.days.find((day) => day?.day === 3).count, 0);
});
