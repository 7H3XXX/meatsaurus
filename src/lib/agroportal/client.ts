import { env } from "@/lib/env";
import { AgroPortalError } from "./errors";

/**
 * AgroPortal is slow under its own concurrency: measured live, a single
 * request takes 4-7s, but firing the 4 requests getTerm() needs (detail,
 * parents, children, mappings) at once pushes each to 9.7-11.4s — the
 * backend gets slower under concurrent load from the same client, not
 * faster. 15s gives real headroom above that measured worst case rather
 * than guessing.
 */
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 400;

/**
 * MEAT-T is versioned via AgroPortal "submissions" on the order of months,
 * not minutes — safe to cache aggressively.
 */
export const CACHE_SECONDS = {
  ontology: 60 * 60 * 24, // 1 day
} as const;

interface AgroFetchOptions {
  params?: Record<string, string | number | undefined>;
  /**
   * Seconds to keep in Next's fetch data cache, or `false` to skip that cache
   * entirely. Next silently refuses to cache anything over 2MB — the full
   * ~1500-concept listing is ~6MB — so that one call opts out and relies on
   * its own in-memory cache instead, rather than failing a cache write on
   * every request.
   */
  revalidate: number | false;
  /** Override for slow bulk endpoints (e.g. listing all ~1500 classes at once takes 15-20s). */
  timeoutMs?: number;
}

/**
 * Low-level call to the AgroPortal REST API. Injects the API key server-side
 * only, applies a timeout, retries once on timeout/network failure (a slow
 * upstream is usually transient, not broken — see the timing note above),
 * and normalizes every failure mode into an AgroPortalError so callers
 * never have to branch on fetch's various throw shapes.
 */
export async function agroFetch<T = unknown>(path: string, options: AgroFetchOptions): Promise<T> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await agroFetchOnce<T>(path, options);
    } catch (error) {
      const retryable =
        error instanceof AgroPortalError && (error.code === "TIMEOUT" || error.code === "NETWORK_ERROR");
      if (!retryable || attempt === MAX_ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  // Unreachable — the loop above always returns or throws — but keeps TS satisfied.
  throw new AgroPortalError("NETWORK_ERROR", `AgroPortal request failed: ${path}`);
}

async function agroFetchOnce<T>(
  path: string,
  { params, revalidate, timeoutMs = REQUEST_TIMEOUT_MS }: AgroFetchOptions
): Promise<T> {
  const url = new URL(path, env.AGROPORTAL_BASE_URL);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  // Deliberately not passing an AbortSignal into fetch itself: Next.js's
  // fetch patching (for `next.revalidate`) does not reliably honor a
  // caller-supplied signal — the request can hang past the deadline instead
  // of aborting. Racing the promise externally keeps the timeout but leaves
  // fetch's own signal handling untouched.
  let response: Response;
  try {
    response = await withTimeout(
      fetch(url, {
        headers: {
          Authorization: `apikey token=${env.API_KEY}`,
          Accept: "application/json",
        },
        ...(revalidate === false ? { cache: "no-store" } : { next: { revalidate } }),
      }),
      timeoutMs,
      path
    );
  } catch (cause) {
    if (cause instanceof AgroPortalError) throw cause;
    throw new AgroPortalError("NETWORK_ERROR", `AgroPortal request failed: ${path}`, { cause });
  }

  if (response.status === 404) {
    throw new AgroPortalError("NOT_FOUND", `Not found upstream: ${path}`, { status: 404 });
  }
  if (!response.ok) {
    throw new AgroPortalError(
      "UPSTREAM_ERROR",
      `AgroPortal responded ${response.status} for ${path}`,
      { status: response.status }
    );
  }

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new AgroPortalError("PARSE_ERROR", `AgroPortal returned invalid JSON: ${path}`, {
      cause,
    });
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new AgroPortalError("TIMEOUT", `AgroPortal request timed out: ${label}`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (cause) => {
        clearTimeout(timer);
        reject(cause);
      }
    );
  });
}
