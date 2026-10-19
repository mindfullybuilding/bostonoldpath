import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeCalendar, getEvents } from "../lib/events.mjs";
const wrap = (events) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${events}\r\nEND:VCALENDAR`;
const event = (lines) => `BEGIN:VEVENT\r\n${lines.join("\r\n")}\r\nEND:VEVENT`;
test("all-day dates remain dates and end stays exclusive", async () => {
  const result = await normalizeCalendar(
    wrap(
      event([
        "UID:day",
        "DTSTART;VALUE=DATE:20261102",
        "DTEND;VALUE=DATE:20261104",
        "SUMMARY:All day",
      ]),
    ),
    new Date("2026-10-19"),
  );
  assert.equal(result[0].start, "2026-11-02");
  assert.equal(result[0].end, "2026-11-04");
  assert.equal(result[0].allDay, true);
});
test("recurrence respects DST, exclusions and moved/cancelled overrides", async () => {
  const result = await normalizeCalendar(
    wrap(
      [
        event([
          "UID:weekly",
          "DTSTART;TZID=America/New_York:20261025T100000",
          "DTEND;TZID=America/New_York:20261025T110000",
          "RRULE:FREQ=WEEKLY;COUNT=5",
          "EXDATE;TZID=America/New_York:20261108T100000",
          "SUMMARY:Weekly",
        ]),
        event([
          "UID:weekly",
          "RECURRENCE-ID;TZID=America/New_York:20261115T100000",
          "DTSTART;TZID=America/New_York:20261115T120000",
          "DTEND;TZID=America/New_York:20261115T130000",
          "SUMMARY:Moved",
          "LOCATION:New room",
        ]),
        event([
          "UID:weekly",
          "RECURRENCE-ID;TZID=America/New_York:20261122T100000",
          "DTSTART;TZID=America/New_York:20261122T100000",
          "DTEND;TZID=America/New_York:20261122T110000",
          "STATUS:CANCELLED",
          "SUMMARY:Cancelled",
        ]),
      ].join("\r\n"),
    ),
    new Date("2026-10-19"),
  );
  assert.equal(result.length, 3);
  assert.equal(result[0].start, "2026-10-25T14:00:00.000Z");
  assert.equal(result[1].start, "2026-11-01T15:00:00.000Z");
  assert.equal(result[2].start, "2026-11-15T17:00:00.000Z");
  assert.equal(result[2].title, "Moved");
  assert.equal(result[2].location, "New room");
});
test("omit cancelled events and unsafe source URLs; retain text as inert data", async () => {
  const result = await normalizeCalendar(
    wrap(
      [
        event([
          "UID:bad",
          "DTSTART:20261102T140000Z",
          "DTEND:20261102T150000Z",
          "SUMMARY:<img src=x>",
          "URL:javascript:alert(1)",
        ]),
        event(["UID:cancel", "DTSTART:20261103T140000Z", "STATUS:CANCELLED", "SUMMARY:No"]),
      ].join("\r\n"),
    ),
    new Date("2026-10-19"),
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].url, null);
  assert.equal(result[0].title, "<img src=x>");
});
test("fetch fixed source only, with timeout; distinguish empty from upstream failure", async () => {
  let request;
  const data = await getEvents({
    useCache: false,
    fetcher: async (url, options) => {
      request = { url, options };
      return { ok: true, text: async () => wrap("") };
    },
  });
  assert.deepEqual(data.events, []);
  assert.match(request.url, /bostonoldpath.groups.io/);
  assert.ok(request.options.signal);
  await assert.rejects(() => getEvents({ useCache: false, fetcher: async () => ({ ok: false }) }));
  await assert.rejects(() => normalizeCalendar("<html>error</html>"));
});
test("successful responses cache for five minutes", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return { ok: true, text: async () => wrap("") };
  };
  const now = new Date("2026-10-19T10:00:00Z");
  await getEvents({ fetcher, now });
  await getEvents({ fetcher, now: new Date(now.getTime() + 299999) });
  assert.equal(calls, 1);
  await getEvents({ fetcher, now: new Date(now.getTime() + 300001) });
  assert.equal(calls, 2);
});
