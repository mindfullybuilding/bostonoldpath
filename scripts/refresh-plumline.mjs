import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fetchPlumlineDirectory } from "../lib/plumline-fetch.mjs";
import { normalizePlumlineSnapshot, reviewPlumlineMatches } from "../lib/plumline.mjs";

const checkStateFile = ".cache/plumline/check-state.json";
const jsonFile = async (filename) => JSON.parse(await readFile(filename, "utf8"));

async function optionalJson(filename) {
  try {
    return await jsonFile(filename);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new Error("The previous Plumline snapshot could not be read.");
  }
}

async function writePrivateJson(filename, value) {
  const target = path.resolve(filename);
  await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  const pending = target + "." + randomUUID() + ".tmp";
  try {
    await writeFile(pending, JSON.stringify(value, null, 2) + "\n", { mode: 0o600, flag: "wx" });
    await rename(pending, target);
  } finally {
    await rm(pending, { force: true });
  }
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function refresh() {
  const { values } = parseArgs({
    options: {
      fixture: { type: "string" },
      roster: { type: "string", default: "site/plumline-roster.json" },
      output: { type: "string" },
      previous: { type: "string" },
      scheduled: { type: "boolean" },
      "review-matches": { type: "boolean" },
    },
  });
  const { fixture, roster: rosterFile, previous: previousFile, scheduled } = values;
  const reviewOnly = values["review-matches"];
  const output =
    values.output ??
    (reviewOnly ? ".cache/plumline/matches.json" : ".cache/plumline/candidate.json");
  if (scheduled && (fixture || reviewOnly)) {
    throw new Error("Scheduled Plumline refreshes require the live candidate workflow.");
  }
  const key = process.env.PLUMLINE_API_KEY;
  if (scheduled && !key) {
    console.log("Plumline check skipped because the private key is unavailable.");
    return;
  }
  const baselineFile = "site/sanghas.json";
  const [roster, baseline] = await Promise.all([jsonFile(rosterFile), jsonFile(baselineFile)]);
  if (!fixture && !reviewOnly && !roster.entries?.some(({ plumlineId }) => plumlineId)) {
    if (!scheduled)
      throw new Error(
        "No approved Plumline IDs. Run with --review-matches to reconcile the roster.",
      );
    console.log("Plumline check skipped because the roster has no approved Plumline IDs.");
    return;
  }
  const destinations = [
    rosterFile,
    baselineFile,
    previousFile,
    fixture,
    "site/plumline-approved.json",
    checkStateFile,
  ].filter(Boolean);
  if (destinations.some((filename) => path.resolve(filename) === path.resolve(output))) {
    throw new Error("Write candidates to a separate output file.");
  }

  // Changes to the roster or importer can require renormalizing the same upstream data.
  const inputRevision = digest([2, roster, baseline]);
  const previous = fixture ? null : await optionalJson(previousFile || output);
  const earlierLive =
    previous?.source?.kind === "live" &&
    Array.isArray(reviewOnly ? previous.matches : previous.sanghas);
  const approvedContent = scheduled && earlierLive ? [previous.sanghas, previous.review] : null;
  const approvedRevision = approvedContent ? digest(approvedContent) : null;
  const savedState = scheduled ? await optionalJson(checkStateFile) : null;
  const currentState =
    savedState?.inputRevision === inputRevision && savedState.approvedRevision === approvedRevision
      ? savedState
      : null;
  let etag =
    earlierLive && previous.source.inputRevision === inputRevision
      ? previous.source.etag
      : undefined;
  if (currentState) etag = currentState.etag;

  const result = fixture
    ? { payload: await jsonFile(fixture), etag: null }
    : await fetchPlumlineDirectory({ key, etag });

  if (result.unchanged) {
    console.log(
      currentState?.needsReview
        ? "Plumline directory is unchanged (HTTP 304). The last candidate still needs review."
        : "Plumline directory is unchanged (HTTP 304). No response body was downloaded.",
    );
    return;
  }

  const source = { kind: fixture ? "fixture" : "live", etag: result.etag, inputRevision };
  if (reviewOnly) {
    const matches = reviewPlumlineMatches(result.payload, roster, baseline);
    await writePrivateJson(output, { matches, source });
    console.log("Wrote the roster match candidates to a private review file.");
    return;
  }

  const candidate = normalizePlumlineSnapshot(result.payload, roster, baseline);
  if (candidate.review.blocked.length) {
    throw new Error(
      "Selected Plumline listings are missing. Previous snapshot kept. Review: " +
        candidate.review.blocked.join(", ") +
        ".",
    );
  }
  const changed = approvedRevision !== digest([candidate.sanghas, candidate.review]);
  if (scheduled && !changed) {
    console.log("The selected public data is unchanged. No review file was generated.");
  } else {
    await writePrivateJson(output, { ...candidate, source });
    console.log("Wrote the normalized directory candidate for review.");
  }
  if (scheduled) {
    // Persist only the validator and review status. The raw response stays in memory.
    await writePrivateJson(checkStateFile, {
      etag: result.etag,
      inputRevision,
      approvedRevision,
      needsReview: changed,
    });
  }
}

try {
  await refresh();
} catch (error) {
  const fsError = error.code && !error.code.startsWith("ERR_PARSE_ARGS");
  console.error(fsError ? "Unable to access a local Plumline refresh file." : error.message);
  process.exitCode = 1;
}
