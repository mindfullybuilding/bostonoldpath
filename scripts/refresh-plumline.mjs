import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fetchPlumlineDirectory } from "../lib/plumline-fetch.mjs";
import { normalizePlumlineSnapshot, reviewPlumlineMatches } from "../lib/plumline.mjs";

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
  ].filter(Boolean);
  if (destinations.some((filename) => path.resolve(filename) === path.resolve(output))) {
    throw new Error("Write candidates to a separate output file.");
  }

  const inputRevision = digest([1, roster, baseline]);
  const previous = fixture || reviewOnly ? null : await optionalJson(previousFile || output);
  const earlierLive = previous?.source?.kind === "live" && Array.isArray(previous.sanghas);
  const etag =
    earlierLive && previous.source.inputRevision === inputRevision
      ? previous.source.etag
      : undefined;
  const result = fixture
    ? { payload: await jsonFile(fixture), etag: null }
    : await fetchPlumlineDirectory({ key, etag });

  if (result.unchanged) {
    console.log("Plumline directory is unchanged. The previous snapshot remains available.");
    return;
  }

  if (reviewOnly) {
    const matches = reviewPlumlineMatches(result.payload, roster, baseline);
    await writePrivateJson(output, { matches });
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
  if (
    scheduled &&
    earlierLive &&
    digest(previous.sanghas) === digest(candidate.sanghas) &&
    digest(previous.review) === digest(candidate.review)
  ) {
    console.log("The selected public data is unchanged. No review file was generated.");
    return;
  }
  await writePrivateJson(output, {
    ...candidate,
    source: { kind: fixture ? "fixture" : "live", etag: result.etag, inputRevision },
  });
  console.log("Wrote the normalized directory candidate for review.");
}

try {
  await refresh();
} catch (error) {
  const fsError = error.code && !error.code.startsWith("ERR_PARSE_ARGS");
  console.error(fsError ? "Unable to access a local Plumline refresh file." : error.message);
  process.exitCode = 1;
}
