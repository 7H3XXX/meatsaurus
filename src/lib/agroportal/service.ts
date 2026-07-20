import Fuse from "fuse.js";
import { agroFetch, CACHE_SECONDS } from "./client";
import {
  rawClassSchema,
  rawClassArraySchema,
  rawPaginatedClassesSchema,
  rawSearchIndexResponseSchema,
  rawMappingsResponseSchema,
  type RawSearchIndexEntry,
} from "./schemas";
import {
  toFacet,
  toTermSummary,
  toSearchResult,
  toSearchResultFromIndex,
  toMappingRef,
} from "./normalize";
import type { Facet, SearchResult, TermSummary, TermDetail, MappingRef, Lang } from "./types";

const ONTOLOGY = "MEAT-T";

export async function getFacets(lang: Lang): Promise<Facet[]> {
  const raw = await agroFetch(`/ontologies/${ONTOLOGY}/classes/roots`, {
    params: { lang },
    revalidate: CACHE_SECONDS.ontology,
  });
  return rawClassArraySchema.parse(raw).map(toFacet);
}

/** Just the narrower concepts, one upstream call — what the tree UI actually needs. */
export async function getChildren(id: string, lang: Lang): Promise<TermSummary[]> {
  const raw = await agroFetch(`/ontologies/${ONTOLOGY}/classes/${encodeURIComponent(id)}/children`, {
    params: { lang },
    revalidate: CACHE_SECONDS.ontology,
  });
  return rawPaginatedClassesSchema.parse(raw).collection.map(toTermSummary);
}

export async function getTerm(id: string, lang: Lang): Promise<TermDetail> {
  const basePath = `/ontologies/${ONTOLOGY}/classes/${encodeURIComponent(id)}`;

  // One round trip from our client fans out to four upstream calls. AgroPortal
  // gets markedly slower under its own concurrency — measured live: ~5s per
  // call alone, ~10s when these four run together — so `detail` still fails
  // loudly (there's no term page without it), but parents/children/mappings
  // degrade to empty on failure rather than taking the whole page down over
  // one slow secondary call.
  const [detailResult, parentsResult, childrenResult, mappingsResult] = await Promise.allSettled([
    agroFetch(basePath, { params: { lang }, revalidate: CACHE_SECONDS.ontology }),
    agroFetch(`${basePath}/parents`, { params: { lang }, revalidate: CACHE_SECONDS.ontology }),
    agroFetch(`${basePath}/children`, { params: { lang }, revalidate: CACHE_SECONDS.ontology }),
    agroFetch(`${basePath}/mappings`, { revalidate: CACHE_SECONDS.ontology }),
  ]);

  if (detailResult.status === "rejected") throw detailResult.reason;
  const detail = rawClassSchema.parse(detailResult.value);

  // /parents is a bare array (see rawClassArraySchema), /children is paginated — not a typo.
  let broader: TermSummary[] = [];
  if (parentsResult.status === "fulfilled") {
    broader = rawClassArraySchema.parse(parentsResult.value).map(toTermSummary);
  } else {
    console.warn(`getTerm(${id}): /parents failed, showing the term without it —`, parentsResult.reason);
  }

  let narrower: TermSummary[] = [];
  if (childrenResult.status === "fulfilled") {
    narrower = rawPaginatedClassesSchema.parse(childrenResult.value).collection.map(toTermSummary);
  } else {
    console.warn(`getTerm(${id}): /children failed, showing the term without it —`, childrenResult.reason);
  }

  let mappings: MappingRef[] = [];
  if (mappingsResult.status === "fulfilled") {
    const resolved = rawMappingsResponseSchema
      .parse(mappingsResult.value)
      .map(toMappingRef)
      .filter((m): m is MappingRef => m !== null);
    // AgroPortal can list the same target concept more than once (different
    // mapping provenance/process landing on the same result) — dedupe by
    // target id, since showing the same mapping badge twice is never correct.
    mappings = Array.from(new Map(resolved.map((m) => [m.id, m])).values());
  } else {
    console.warn(`getTerm(${id}): /mappings failed, showing the term without it —`, mappingsResult.reason);
  }

  return {
    id: detail["@id"],
    label: detail.prefLabel ?? detail["@id"],
    definition: detail.definition[0],
    synonyms: detail.synonym,
    obsolete: detail.obsolete,
    broader,
    narrower,
    mappings,
  };
}

/*
 * Search
 * ------
 * AgroPortal's own /search does exact stemmed-token matching: "cut" matches
 * "cutting" (stemmer), but "bre" (a real prefix of "breed") and "cuting" (a
 * typo of "cutting") both return zero results — confirmed live. There's no
 * prefix or fuzzy option on that endpoint, and no way to get one from it.
 *
 * MEAT-T is small (1,504 concepts, confirmed live), so real fuzzy matching
 * means holding *something* in memory to match against — there's no way
 * around that. What we hold is kept deliberately thin: id + label + synonym
 * only (rawSearchIndexEntrySchema drops definitions at parse time, not just
 * in what we choose to keep — see schemas.ts), fetched once per language and
 * cached in-process. If that fetch ever fails, search falls back to
 * AgroPortal's native endpoint rather than breaking — degraded results, not
 * a broken feature.
 */

const INDEX_TTL_MS = CACHE_SECONDS.ontology * 1000;
// A failed build shouldn't sour the cache for a full day — let the next
// request retry well before then, without hammering a struggling upstream.
const INDEX_RETRY_MS = 5 * 60 * 1000;

interface IndexCacheEntry {
  promise: Promise<Fuse<RawSearchIndexEntry>>;
  expiresAt: number;
}

// Caches the in-flight *promise*, not just its resolved value — concurrent
// callers while the cache is cold (e.g. several searches landing before the
// first bulk fetch finishes) share one build instead of each triggering
// their own ~6MB fetch.
const searchIndexCache = new Map<Lang, IndexCacheEntry>();

async function buildSearchIndex(lang: Lang): Promise<Fuse<RawSearchIndexEntry>> {
  const raw = await agroFetch(`/ontologies/${ONTOLOGY}/classes`, {
    params: { lang, pagesize: 1600 },
    revalidate: false, // ~6MB response, over Next's 2MB cache limit — we cache the built index ourselves
    timeoutMs: 30_000,
  });
  const terms = rawSearchIndexResponseSchema.parse(raw).collection;

  return new Fuse(terms, {
    keys: [
      { name: "prefLabel", weight: 0.7 },
      { name: "synonym", weight: 0.3 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
}

function getSearchIndex(lang: Lang): Promise<Fuse<RawSearchIndexEntry>> {
  const cached = searchIndexCache.get(lang);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = buildSearchIndex(lang);
  searchIndexCache.set(lang, { promise, expiresAt: Date.now() + INDEX_TTL_MS });
  promise.catch((error) => {
    console.warn(`Search index build failed for lang=${lang}, falling back to native search —`, error);
    searchIndexCache.set(lang, { promise, expiresAt: Date.now() + INDEX_RETRY_MS });
  });
  return promise;
}

async function searchNative(query: string, lang: Lang, limit: number): Promise<SearchResult[]> {
  const raw = await agroFetch("/search", {
    params: { q: query, ontologies: ONTOLOGY, lang, pagesize: limit },
    revalidate: CACHE_SECONDS.ontology,
  });
  return rawPaginatedClassesSchema.parse(raw).collection.map(toSearchResult);
}

export async function searchTerms(query: string, lang: Lang, limit: number): Promise<SearchResult[]> {
  try {
    const fuse = await getSearchIndex(lang);
    return fuse.search(query, { limit }).map((result) => toSearchResultFromIndex(result.item));
  } catch {
    return searchNative(query, lang, limit);
  }
}

/**
 * Builds both language indexes at server startup (see instrumentation.ts) so
 * the first real search doesn't pay the ~15-20s bulk-fetch cost. Best-effort:
 * a failure here just means the first search falls back to the normal
 * lazy build (and from there, to native search), not a crashed server.
 */
export async function warmSearchIndexes(): Promise<void> {
  await Promise.allSettled([getSearchIndex("en"), getSearchIndex("fr")]);
}
