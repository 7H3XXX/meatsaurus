import type { RawClass, RawMapping, RawSearchIndexEntry } from "./schemas";
import type { Facet, TermSummary, SearchResult, MappingRef } from "./types";

export function toFacet(raw: RawClass): Facet {
  return { id: raw["@id"], label: raw.prefLabel ?? raw["@id"] };
}

export function toTermSummary(raw: RawClass): TermSummary {
  return { id: raw["@id"], label: raw.prefLabel ?? raw["@id"] };
}

/** From AgroPortal's own /search (the resilience fallback) — has definitions. */
export function toSearchResult(raw: RawClass): SearchResult {
  return {
    ...toTermSummary(raw),
    matchType: raw.matchType,
    definition: raw.definition[0],
    synonyms: raw.synonym,
  };
}

/** From our own fuzzy index (the primary path) — label/synonym only, by design. */
export function toSearchResultFromIndex(raw: RawSearchIndexEntry): SearchResult {
  return {
    id: raw["@id"],
    label: raw.prefLabel ?? raw["@id"],
    synonyms: raw.synonym,
  };
}

const ONTOLOGY = "MEAT-T";

/**
 * A mapping's `classes` pair holds [this concept, the equivalent concept in
 * another ontology] — but order isn't a documented guarantee, so pick the
 * side that isn't MEAT-T rather than assuming index 1.
 */
export function toMappingRef(raw: RawMapping): MappingRef | null {
  const target = raw.classes.find((c) => !c.links?.ontology?.endsWith(`/${ONTOLOGY}`));
  if (!target) return null;
  const ontology = target.links?.ontology?.split("/").pop() ?? "unknown";
  return { ontology, id: target["@id"] };
}
