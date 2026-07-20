import type { Lang } from "./agroportal/types";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Language is a query param (`?lang=`), not a route segment, so each
 * translated page needs an explicit hreflang set — Next can't infer it from
 * the URL structure the way it would for `/en/...` vs `/fr/...` routing.
 * Canonical points at the current language's own URL (a translation, not a
 * duplicate, so it shouldn't collapse to one "true" version).
 */
export function langAlternates(path: string, lang: Lang) {
  return {
    canonical: `${path}?lang=${lang}`,
    languages: {
      en: `${path}?lang=en`,
      fr: `${path}?lang=fr`,
      "x-default": `${path}?lang=en`,
    },
  };
}
