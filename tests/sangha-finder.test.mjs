import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { directoryView } from "../site/pages/find-a-sangha.mjs";
import { matchesSangha, weekdayOrder } from "../public/assets/sangha-filters.js";

const card = await readFile(
  new URL("../site/pages/partials/sangha-card.html", import.meta.url),
  "utf8",
);
const sangha = {
  id: "example-sangha",
  name: "Example Sangha",
  location: "Cambridge",
  address: "Example Street, Cambridge, MA",
  latLng: [42.37, -71.1],
  day: "Tuesday and Sunday",
  days: ["tuesday", "sunday"],
  time: "Varies by sitting",
  timeBand: "morning",
  modality: "hybrid",
  meetings: [
    { format: "in-person", days: ["tuesday"], timeBand: "morning", summary: "Tuesday morning" },
    { format: "virtual", days: ["sunday"], timeBand: "evening", summary: "Sunday evening" },
  ],
  description: "A group for weekly practice",
  meetingDescription: "Check with the organizer about holiday sittings.",
  registerUrl: "https://www.plumline.org/sanghas/example-sangha",
};

function filters(values) {
  const form = new FormData();
  for (const [key, value] of values) form.append(key, value);
  return form;
}

test("finder applies all schedule filters to one sitting and includes all groups by default", () => {
  assert.equal(matchesSangha(sangha, filters([])), true);
  assert.equal(matchesSangha(sangha, filters([["search", "  Cambridge  "]])), true);
  assert.equal(matchesSangha(sangha, filters([["search", "Somerville"]])), false);
  assert.equal(
    matchesSangha(
      sangha,
      filters([
        ["modality", "in-person"],
        ["day", "sunday"],
      ]),
    ),
    false,
  );
  assert.equal(
    matchesSangha(
      sangha,
      filters([
        ["day", "tuesday"],
        ["timeBand", "evening"],
      ]),
    ),
    false,
  );
  assert.equal(
    matchesSangha(
      sangha,
      filters([
        ["modality", "virtual"],
        ["day", "sunday"],
        ["timeBand", "evening"],
      ]),
    ),
    true,
  );
  assert.equal(
    matchesSangha(
      sangha,
      filters([
        ["day", "thursday"],
        ["day", "tuesday"],
      ]),
    ),
    true,
  );
});

test("text-only schedule is searchable without invented weekday or time metadata", () => {
  const textOnly = { ...sangha, meetings: [], days: [], timeBand: null };
  assert.equal(matchesSangha(textOnly, filters([["search", "weekly practice"]])), true);
  assert.equal(matchesSangha(textOnly, filters([["day", "tuesday"]])), false);
  assert.equal(matchesSangha(textOnly, filters([["timeBand", "evening"]])), false);
  assert.ok(weekdayOrder(undefined) > weekdayOrder("saturday"));
});

test("map and directions use reviewed venues, preserving links to local cards", () => {
  const venue = { ...sangha, publicVenue: true };
  const noPin = [
    { ...sangha, id: "withheld" },
    { ...venue, id: "approximate", approximate: true },
    { ...venue, id: "online", modality: "virtual" },
    { ...venue, id: "invalid", latLng: [95, -71] },
  ];
  const view = directoryView([venue, ...noPin], card, { useDirectoryMap: true });
  assert.deepEqual(view.mapVenues, [
    { id: venue.id, name: venue.name, location: "Cambridge", schedule: "", lat: 42.37, lng: -71.1 },
  ]);
  const singleMeeting = { ...venue, meetings: [{ dayLabel: "Tuesday", timeLabel: "7:00 PM" }] };
  assert.equal(
    directoryView([singleMeeting], card, { useDirectoryMap: true }).mapVenues[0].schedule,
    "Tuesday · 7:00 PM",
  );
  assert.match(view.groupsHTML, /id="example-sangha"/);
  assert.match(view.groupsHTML, /data-sort-day="sunday"/);
  assert.match(view.groupsHTML, /Tuesday morning/);
  assert.match(view.groupsHTML, /Sunday evening/);
  assert.match(view.groupsHTML, /Check with the organizer about holiday sittings/);
  assert.match(view.groupsHTML, /Get Directions/);
  const withheld = directoryView([noPin[0]], card, { useDirectoryMap: true });
  assert.doesNotMatch(withheld.groupsHTML, /Example Street|Get Directions/);
  for (const group of noPin.slice(1, 3)) {
    assert.doesNotMatch(
      directoryView([group], card, { useDirectoryMap: true }).groupsHTML,
      /Get Directions/,
    );
  }
});

test("preview cards escape upstream content and reject unsafe contact URLs", () => {
  const raw = {
    ...sangha,
    description: "<img onerror=alert(1)>",
    registerUrl: "javascript:alert(2)",
  };
  const { groupsHTML } = directoryView([raw], card, { useDirectoryMap: true });
  assert.doesNotMatch(groupsHTML, /<img|href="javascript:/);
  assert.match(groupsHTML, /&lt;img/);
  assert.match(groupsHTML, /Ask MCGB for Organizer Contact/);
});
