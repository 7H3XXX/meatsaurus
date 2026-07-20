const MEAT_T_PREFIX = "http://opendata.inrae.fr/ThViande/";

/**
 * Every MEAT-T concept IRI shares this prefix (confirmed against the live
 * API — C853, C1013, C1363, ...). Stripping it gives short, readable,
 * shareable URLs instead of exposing the raw IRI. Anything that doesn't
 * match falls back to plain URI-encoding so the round trip never breaks.
 */
export function toSlug(iri: string): string {
  return iri.startsWith(MEAT_T_PREFIX) ? iri.slice(MEAT_T_PREFIX.length) : encodeURIComponent(iri);
}

export function fromSlug(slug: string): string {
  return /^[A-Za-z0-9_-]+$/.test(slug) ? `${MEAT_T_PREFIX}${slug}` : decodeURIComponent(slug);
}
