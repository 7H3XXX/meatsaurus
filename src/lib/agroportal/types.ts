export type Lang = "en" | "fr";

/** A top concept of the thesaurus (e.g. "meat market", "breed") — the entry points for Browse. */
export interface Facet {
  id: string;
  label: string;
}

/** A concept as it appears in a broader/narrower list — id + label only, one click from the full term. */
export interface TermSummary {
  id: string;
  label: string;
}

/** A search hit — full enough to read without a follow-up request; only broader/narrower/mappings require one. */
export interface SearchResult extends TermSummary {
  matchType?: string;
  definition?: string;
  synonyms: string[];
}

/** A cross-ontology equivalent, e.g. this MEAT-T concept mapped to a class in EFO. */
export interface MappingRef {
  ontology: string;
  id: string;
}

/** The full term detail page: everything MEAT-T knows about one concept. */
export interface TermDetail {
  id: string;
  label: string;
  definition?: string;
  synonyms: string[];
  obsolete: boolean;
  broader: TermSummary[];
  narrower: TermSummary[];
  mappings: MappingRef[];
}
