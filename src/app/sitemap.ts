import type { MetadataRoute } from "next";
import { getFacets } from "@/lib/agroportal/service";
import { toSlug } from "@/lib/agroportal/slug";
import { siteUrl } from "@/lib/metadata";

/**
 * Lists the facets (one cheap /classes/roots call, 12 concepts) rather than
 * all ~1,500 individual terms — search engines reach those fine by crawling
 * the links every facet tree and term page already carries, without this
 * route holding the full catalog just to enumerate URLs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const facets = await getFacets("en");

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/browse`, changeFrequency: "weekly", priority: 0.8 },
    ...facets.map(
      (facet): MetadataRoute.Sitemap[number] => ({
        url: `${siteUrl}/browse/${toSlug(facet.id)}`,
        changeFrequency: "monthly",
        priority: 0.6,
      })
    ),
  ];
}
