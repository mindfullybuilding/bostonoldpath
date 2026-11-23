import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fetchPlumlineDirectory } from "../lib/plumline-fetch.mjs";
import { normalizePlumlineSnapshot, reviewPlumlineMatches } from "../lib/plumline.mjs";

const checkStateFile = ".cache/plumline/check-state.json";
const approvedFile = "site/plumline-approved.json";
const importerFiles = ["../lib/plumline.mjs", "../lib/plumline-fetch.mjs", "../site/config.mjs"];
const jsonFile = async (filename) => JSON.parse(await readFile(filename, "utf8"));

async function optionalJson(filename, { cache = false } = {}) {
  try {
    return await jsonFile(filename);
  } catch (error) {
    if (error.code === "ENOENT" || (cache && error instanceof SyntaxError)) return null;
    throw new Error("Unable to read a local Plumline review file.");
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

function directoryRevision({ sanghas, review }) {
  return digest([sanghas, review]);
}

async function refresh() {
  const { values } = parseArgs({
    options: {
      fixture: { type: "string" },
      roster: { type: "string", default: "site/plumline-roster.json" },
      output: { type: "string" },
      previous: { type: "string" },
      scheduled: { type: "boolean" },
      "metadata-only": { type: "boolean" },
      "review-matches": { type: "boolean" },
    },
  });
  const { fixture, roster: rosterFile, scheduled } = values;
  const previousFile = values.previous ?? (scheduled ? approvedFile : undefined);
  const reviewOnly = values["review-matches"];
  const metadataOnly = values["metadata-only"];
  if (metadataOnly && !scheduled) throw new Error("--metadata-only requires --scheduled.");
  const output =
    values.output ??
    (reviewOnly ? ".cache/plumline/matches.json" : ".cache/plumline/candidate.json");
  if (scheduled && (fixture || reviewOnly)) {
    throw new Error("Scheduled Plumline refreshes require the live candidate workflow.");
  }
  const key = process.env.PLUMLINE_API_KEY;
  if (scheduled && !key) {
    throw new Error(
      "Plumline check did not run. Set PLUMLINE_API_KEY in the scheduled environment.",
    );
  }
  const baselineFile = "site/sanghas.json";
  const [roster, baseline] = await Promise.all([jsonFile(rosterFile), jsonFile(baselineFile)]);
  if (!fixture && !reviewOnly && !roster.entries?.some(({ plumlineId }) => plumlineId)) {
    throw new Error("No approved Plumline IDs. Run with --review-matches to reconcile the roster.");
  }
  const destinations = [
    rosterFile,
    baselineFile,
    previousFile,
    fixture,
    approvedFile,
    "site/plumline-preview.json",
    checkStateFile,
  ].filter(Boolean);
  if (destinations.some((filename) => path.resolve(filename) === path.resolve(output))) {
    throw new Error("Write candidates to a separate output file.");
  }

  // Renormalize on changes to our inputs even when Plumline's representation is unchanged.
  const importer = await Promise.all(
    importerFiles.map((file) => readFile(new URL(file, import.meta.url), "utf8")),
  );
  const inputRevision = digest([importer, roster, baseline]);
  const previous = fixture ? null : await optionalJson(previousFile || output);
  const earlierLive =
    previous?.source?.kind === "live" &&
    Array.isArray(reviewOnly ? previous.matches : previous.sanghas);
  if (scheduled && previous && (!earlierLive || !Array.isArray(previous.review?.blocked))) {
    throw new Error("The approved Plumline baseline must be a normalized live snapshot.");
  }
  const approvedRevision = scheduled && earlierLive ? directoryRevision(previous) : null;
  const savedState = scheduled ? await optionalJson(checkStateFile, { cache: true }) : null;
  const currentState =
    savedState?.inputRevision === inputRevision && savedState.approvedRevision === approvedRevision
      ? savedState
      : null;
  const saveCheckState = (etag, candidateRevision) =>
    writePrivateJson(checkStateFile, {
      etag,
      inputRevision,
      approvedRevision,
      candidateRevision,
      checkedAt: new Date().toISOString(),
    });
  let etag =
    earlierLive && previous.source.inputRevision === inputRevision
      ? previous.source.etag
      : undefined;
  if (currentState) etag = currentState.etag;

  async function clearPendingCandidate() {
    if (metadataOnly) return;
    const pending = await optionalJson(output, { cache: true });
    if (pending?.source?.kind === "live" && Array.isArray(pending.sanghas))
      await rm(output, { force: true });
  }

  let result = fixture
    ? { payload: await jsonFile(fixture), etag: null }
    : await fetchPlumlineDirectory({ key, etag });

  if (result.unchanged) {
    const candidateRevision = currentState?.candidateRevision ?? null;
    const pending =
      candidateRevision && !metadataOnly ? await optionalJson(output, { cache: true }) : null;
    if (
      metadataOnly ||
      !candidateRevision ||
      (pending && directoryRevision(pending) === candidateRevision)
    ) {
      if (scheduled && !candidateRevision) await clearPendingCandidate();
      if (scheduled) await saveCheckState(result.etag, candidateRevision);
      console.log(
        candidateRevision
          ? "Plumline is unchanged (HTTP 304). The last candidate still needs review."
          : "Plumline is unchanged (HTTP 304). No response body was downloaded.",
      );
      if (metadataOnly && candidateRevision)
        console.log("Run the importer privately to retrieve the pending changes.");
      return;
    }
    // Clean runners restore validator metadata only. Recreate a missing review artifact once.
    console.log("Plumline is unchanged (HTTP 304). Fetching the missing review candidate.");
    result = await fetchPlumlineDirectory({ key });
  }

  if (!fixture) {
    console.log(
      result.etag
        ? "Plumline returned HTTP 200 with an ETag."
        : "Plumline returned HTTP 200 without a usable ETag. The next check will fetch the full response.",
    );
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
  const candidateRevision = directoryRevision(candidate);
  const changed = approvedRevision !== candidateRevision;
  if (scheduled && !changed) {
    await clearPendingCandidate();
    console.log("The selected public data is unchanged. No review file was generated.");
  } else if (metadataOnly) {
    console.log("The selected public data changed. Run the importer privately to review it.");
  } else {
    await writePrivateJson(output, { ...candidate, source });
    console.log("Wrote the normalized directory candidate for review.");
  }
  // Persist validator and review metadata. The raw response stays in memory.
  if (scheduled) await saveCheckState(result.etag, changed ? candidateRevision : null);
}

try {
  await refresh();
} catch (error) {
  const fsError = error.code && !error.code.startsWith("ERR_PARSE_ARGS");
  console.error(fsError ? "Unable to access a local Plumline refresh file." : error.message);
  process.exitCode = 1;
}
