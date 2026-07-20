import type { Metadata } from "next";
import { getFacets } from "@/lib/agroportal/service";
import { parseLang } from "@/lib/search-params";
import { FacetGrid } from "@/components/facet-grid";

export const metadata: Metadata = { title: "Browse" };

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: langParam } = await searchParams;
  const lang = parseLang(langParam);
  const facets = await getFacets(lang);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-foreground">
        {lang === "fr" ? "Parcourir le thésaurus" : "Browse the thesaurus"}
      </h1>
      <FacetGrid facets={facets} lang={lang} />
    </div>
  );
}
