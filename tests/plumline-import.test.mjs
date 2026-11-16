import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fetchPlumlineDirectory } from "../lib/plumline-fetch.mjs";
import { normalizePlumlineSnapshot, reviewPlumlineMatches } from "../lib/plumline.mjs";

const fixtureFile = "site/fixtures/plumline-v1.json";
const rosterFile = "site/fixtures/plumline-roster.json";
const load = async (filename) => JSON.parse(await readFile(filename, "utf8"));
const [payload, roster, baseline] = await Promise.all([
  load(fixtureFile),
  load(rosterFile),
  load("site/sanghas.json"),
]);

test("reviewed IDs produce a curated listing and names never decide membership", () => {
  const renamed = structuredClone(payload);
  const wake = renamed.sanghas.find(({ id }) => id === "fixture-wake-up-boston");
  wake.name = "Wake Up Greater Boston";
  const result = normalizePlumlineSnapshot(renamed, roster, baseline);
  assert.equal(result.sanghas.length, 13);
  assert.equal(result.sanghas.find(({ id }) => id === "wake-up-boston").name, wake.name);
  assert.ok(result.sanghas.every(({ id }) => id !== "mindful-lunch" && id !== "quarry-sangha"));
  assert.equal(result.review.matched.length, 5);
  assert.equal(result.review.localOnly.length, 8);
  const matches = reviewPlumlineMatches(payload, roster, baseline).find(
    ({ localId }) => localId === "wake-up-boston",
  );
  assert.equal(matches.candidates.length, 2);
  assert.equal(matches.approvedId, "fixture-wake-up-boston");
});

test("ignored legacy rows and unapproved venue fields stay out of the snapshot", () => {
  const result = normalizePlumlineSnapshot(payload, roster, baseline);
  const byId = new Map(result.sanghas.map((group) => [group.id, group]));
  const dandelions = byId.get("dandelions-of-the-heart-sangha");
  assert.deepEqual(dandelions.meetings, []);
  assert.deepEqual(dandelions.days, []);
  assert.equal(dandelions.location, "Newton");
  assert.match(dandelions.meetingDescription, /contact the organizer/i);
  assert.equal(dandelions.publicVenue, false);
  for (const id of [
    "dandelions-of-the-heart-sangha",
    "mountain-bell-sangha",
    "peaceful-songbird-sangha",
  ]) {
    assert.equal(byId.get(id).address, undefined);
    assert.equal(byId.get(id).latLng, undefined);
    assert.equal(byId.get(id).publicVenue, false);
  }
  assert.equal(byId.get("joyful-lotus-sangha").publicVenue, true);
  assert.equal(byId.get("joyful-lotus-sangha").latLng.length, 2);
  assert.doesNotMatch(JSON.stringify(result.sanghas), /withheld fixture address/i);
});

test("scheduled meetings retain recurrence, availability, and a targeted local exception", () => {
  const { sanghas } = normalizePlumlineSnapshot(payload, roster, baseline);
  const joyful = sanghas.find(({ id }) => id === "joyful-lotus-sangha");
  assert.deepEqual(
    joyful.meetings.map(({ days }) => days),
    [["wednesday"], ["sunday"]],
  );
  const wake = sanghas.find(({ id }) => id === "wake-up-boston");
  assert.deepEqual(wake.meetings[0].excludeDates, ["2026-11-25"]);
  assert.equal(wake.meetings[0].id, "wake-wednesday");
  assert.equal(wake.meetings[1].excludeDates, undefined);
  const pathOfPeace = sanghas.find(({ id }) => id === "path-of-peace-sangha");
  assert.equal(pathOfPeace.modality, "hybrid");
  assert.deepEqual(
    pathOfPeace.meetings.map(({ format }) => format),
    ["virtual", "in-person"],
  );
  assert.deepEqual(pathOfPeace.meetings[0].excludeOrdinals, [2]);
  assert.equal(
    pathOfPeace.registerUrl,
    "https://plumline.org/sanghas/path-of-peace-sangha-franklin",
  );
});

test("missing and ambiguous inputs are held for review", () => {
  const missing = structuredClone(payload);
  missing.sanghas = missing.sanghas.filter(({ id }) => id !== "fixture-wake-up-boston");
  missing.count = missing.sanghas.length;
  const rejected = normalizePlumlineSnapshot(missing, roster, baseline);
  assert.deepEqual(rejected.review.missing, ["wake-up-boston"]);
  assert.deepEqual(rejected.review.blocked, ["wake-up-boston"]);

  const approvedFallback = structuredClone(roster);
  approvedFallback.entries.find(({ localId }) => localId === "wake-up-boston").onMissing = "local";
  const held = normalizePlumlineSnapshot(missing, approvedFallback, baseline);
  assert.equal(held.sanghas.find(({ id }) => id === "wake-up-boston").time, "Evening");
  assert.deepEqual(held.review.missing, ["wake-up-boston"]);
  assert.deepEqual(held.review.blocked, []);

  const ambiguous = structuredClone(payload);
  const selected = ambiguous.sanghas.find(({ id }) => id === "fixture-wake-up-boston");
  selected.meetings.push(selected.meetings[0]);
  assert.throws(() => normalizePlumlineSnapshot(ambiguous, roster, baseline), /unique match/);
});

test("invalid v1 responses, recurrence fields, and escaping contact URLs are rejected or sanitized", () => {
  assert.throws(
    () => normalizePlumlineSnapshot({ apiVersion: "v1", count: 0, sanghas: [] }, roster, baseline),
    /empty/,
  );
  assert.throws(
    () => normalizePlumlineSnapshot({ ...payload, count: payload.count + 1 }, roster, baseline),
    /Invalid/,
  );
  const rejected = structuredClone(payload);
  const joy = rejected.sanghas.find(({ id }) => id === "fixture-joyful-lotus-sangha");
  joy.meetings[0].recurrenceRule.dtstart = "2026-02-30T08:00";
  assert.throws(() => normalizePlumlineSnapshot(rejected, roster, baseline), /recurrence start/);
  const unsafe = structuredClone(payload);
  const pathOfPeace = unsafe.sanghas.find(({ id }) => id === "fixture-path-of-peace-sangha");
  pathOfPeace.url = "https://plumline.org.attacker.invalid/sanghas/wrong";
  const result = normalizePlumlineSnapshot(unsafe, roster, baseline);
  assert.equal(
    result.sanghas.find(({ id }) => id === "path-of-peace-sangha").registerUrl,
    baseline.find(({ id }) => id === "path-of-peace-sangha").registerUrl,
  );
});

test("approved imported coordinates replace local values and unknown fields stay private", () => {
  const upstream = structuredClone(payload);
  const local = structuredClone(baseline);
  const joyful = upstream.sanghas.find(({ id }) => id === "fixture-joyful-lotus-sangha");
  joyful.latitude = 42.3644;
  joyful.contactEmail = "private@example.invalid";
  local.find(({ id }) => id === "joyful-lotus-sangha").internalNote = "private review note";
  const rule = joyful.meetings[0].recurrenceRule;
  rule.until = rule.dtstart;
  rule.dtstart += ":00";
  const { sanghas } = normalizePlumlineSnapshot(upstream, roster, local);
  const candidate = sanghas.find(({ id }) => id === "joyful-lotus-sangha");
  assert.equal(candidate.latLng[0], 42.3644);
  assert.equal(candidate.meetings[0].rule.until, "2026-01-07T17:00");
  assert.equal(candidate.contactEmail, undefined);
  assert.equal(candidate.internalNote, undefined);
});

test("transport pins the authenticated endpoint and handles conditional updates", async () => {
  const optionsSeen = {};
  const fresh = await fetchPlumlineDirectory({
    key: "test-secret",
    etag: '"older"',
    fetcher: async (url, options) => {
      Object.assign(optionsSeen, { url, ...options });
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { etag: '"fresh"' },
      });
    },
  });
  assert.equal(optionsSeen.url, "https://plumline.org/api/v1/sanghas");
  assert.equal(optionsSeen.redirect, "error");
  assert.equal(optionsSeen.headers.Authorization, "Bearer test-secret");
  assert.equal(optionsSeen.headers["If-None-Match"], '"older"');
  assert.equal(fresh.etag, '"fresh"');
  assert.equal(fresh.payload.count, payload.count);
  const unchanged = await fetchPlumlineDirectory({
    key: "test-secret",
    etag: fresh.etag,
    fetcher: async () => new Response(null, { status: 304 }),
  });
  assert.deepEqual(unchanged, { unchanged: true, etag: '"fresh"' });
  await assert.rejects(
    fetchPlumlineDirectory({
      key: "test-secret",
      fetcher: async () => new Response(null, { status: 304 }),
    }),
    /HTTP 304/,
  );
});

test("transport surfaces Retry-After without revealing an upstream response or key", async () => {
  await assert.rejects(
    fetchPlumlineDirectory({
      key: "test-secret",
      fetcher: async () =>
        new Response("test-secret", { status: 429, headers: { "retry-after": "30" } }),
    }),
    (error) =>
      error.retryAfter === 30 &&
      error.message.includes("30") &&
      !error.message.includes("test-secret"),
  );
  await assert.rejects(
    fetchPlumlineDirectory({
      key: "test-secret",
      fetcher: async () => {
        throw new Error("test-secret");
      },
    }),
    /^Error: Unable to reach Plumline\.$/,
  );
  await assert.rejects(
    fetchPlumlineDirectory({
      key: "test-secret",
      fetcher: async () => new Response("test-secret"),
    }),
    /^Error: Unable to read the Plumline directory response\.$/,
  );
});

test("the CLI builds a private candidate from fixtures without a key", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "mcgb-plumline-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, "candidate.json");
  await promisify(execFile)(
    process.execPath,
    [
      "scripts/refresh-plumline.mjs",
      "--fixture",
      fixtureFile,
      "--roster",
      rosterFile,
      "--output",
      output,
    ],
    { env: { ...process.env, PLUMLINE_API_KEY: "" } },
  );
  const fixture = await load(output);
  assert.equal(fixture.sanghas.length, baseline.length);
  assert.equal(fixture.source.kind, "fixture");
  assert.equal((await stat(output)).mode & 0o777, 0o600);
});
