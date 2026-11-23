const endpoint = "https://plumline.org/api/v1/sanghas";
const maximumBytes = 16 * 1024 * 1024;

function usableEtag(value) {
  return typeof value === "string" && /^(?:W\/)?"[!#-~]{1,240}"$/.test(value);
}

function retrySeconds(value, now) {
  if (typeof value !== "string") return null;
  if (/^\d{1,9}$/.test(value)) return Number(value);
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, Math.ceil((timestamp - now) / 1000)) : null;
}

async function responseJson(response) {
  if (Number(response.headers.get("content-length")) > maximumBytes || !response.body) {
    throw new Error("Unable to read the Plumline directory response.");
  }
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBytes) {
        await reader.cancel();
        throw new Error("Directory response exceeds the maximum size.");
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    throw new Error("Unable to read the Plumline directory response.");
  } finally {
    reader.releaseLock();
  }
}

export async function fetchPlumlineDirectory({
  key,
  etag,
  fetcher = fetch,
  now = Date.now(),
} = {}) {
  if (typeof key !== "string" || !/^[!-~]+$/.test(key)) {
    throw new Error("Set a valid PLUMLINE_API_KEY in the private refresh environment.");
  }
  const headers = { Accept: "application/json", Authorization: "Bearer " + key };
  const conditional = usableEtag(etag);
  if (conditional) headers["If-None-Match"] = etag;
  let response;
  try {
    response = await fetcher(endpoint, {
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error("Unable to reach Plumline.");
  }
  const responseEtag = response.headers.get("etag");
  if (response.status === 304 && conditional) {
    return { unchanged: true, etag: usableEtag(responseEtag) ? responseEtag : etag };
  }
  if (response.status === 429) {
    const seconds = retrySeconds(response.headers.get("retry-after"), now);
    const error = new Error(
      seconds === null
        ? "Plumline rate limit reached."
        : "Plumline rate limit reached. Retry after " + seconds + " seconds.",
    );
    error.retryAfter = seconds;
    throw error;
  }
  if (response.status !== 200) {
    throw new Error("Plumline returned HTTP " + response.status + ".");
  }
  return {
    unchanged: false,
    etag: usableEtag(responseEtag) ? responseEtag : null,
    payload: await responseJson(response),
  };
}
