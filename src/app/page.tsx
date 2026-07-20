import { getFacets } from "@/lib/agroportal/service";
import { parseLang } from "@/lib/search-params";
import { SearchBox } from "@/components/search-box";
import { FacetGrid } from "@/components/facet-grid";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: langParam } = await searchParams;
  const lang = parseLang(langParam);
  const facets = await getFacets(lang);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="mb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase">
        {lang === "fr" ? "Thésaurus MEAT-T · FR / EN" : "MEAT-T Thesaurus · EN / FR"}
      </p>
      <h1 className="mb-7 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {lang === "fr" ? "Cherchez un terme de la filière viande." : "Look up a meat-industry term."}
      </h1>

      <SearchBox autoFocus large />

      <div className="mt-16">
        <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {lang === "fr" ? `Parcourir · ${facets.length} domaines` : `Browse · ${facets.length} domains`}
        </h2>
        <FacetGrid facets={facets} lang={lang} />
      </div>
    </div>
  );
}
