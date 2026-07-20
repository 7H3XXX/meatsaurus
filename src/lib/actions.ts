"use server";

import { searchTerms, getChildren } from "@/lib/agroportal/service";
import type { Lang, SearchResult, TermSummary } from "@/lib/agroportal/types";

const MIN_QUERY_LENGTH = 2;

/**
 * Called directly from the search box (a Client Component) on every
 * keystroke, debounced. Errors degrade to an empty result set rather than
 * surfacing — a failed search suggestion isn't worth an error state.
 */
export async function searchAction(query: string, lang: Lang): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];
  try {
    return await searchTerms(trimmed, lang, 8);
  } catch (error) {
    console.warn("searchAction failed —", error);
    return [];
  }
}

/** Called from the concept tree on first expand of a node. Same degrade-to-empty reasoning. */
export async function getChildrenAction(id: string, lang: Lang): Promise<TermSummary[]> {
  try {
    return await getChildren(id, lang);
  } catch (error) {
    console.warn("getChildrenAction failed —", error);
    return [];
  }
}
