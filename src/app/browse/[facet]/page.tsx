import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getTerm } from "@/lib/agroportal/service";
import { fromSlug, toSlug } from "@/lib/agroportal/slug";
import { parseLang } from "@/lib/search-params";
import { AgroPortalError } from "@/lib/agroportal/errors";
import { langAlternates } from "@/lib/metadata";
import { ConceptTree } from "@/components/concept-tree";

interface PageProps {
  params: Promise<{ facet: string }>;
  searchParams: Promise<{ lang?: string }>;
}

async function loadFacet(facetSlug: string, langParam: string | undefined) {
  const lang = parseLang(langParam);
  try {
    const term = await getTerm(fromSlug(facetSlug), lang);
    return { term, lang };
  } catch (error) {
    if (error instanceof AgroPortalError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { facet } = await params;
  const { lang: langParam } = await searchParams;
  const { term, lang } = await loadFacet(facet, langParam);
  return {
    title: term.label,
    description: term.definition?.slice(0, 160),
    alternates: langAlternates(`/browse/${facet}`, lang),
  };
}

export default async function FacetPage({ params, searchParams }: PageProps) {
  const { facet } = await params;
  const { lang: langParam } = await searchParams;
  const { term: root, lang } = await loadFacet(facet, langParam);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href={`/browse?lang=${lang}`} className="hover:text-foreground">
          {lang === "fr" ? "Parcourir" : "Browse"}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-foreground first-letter:uppercase">{root.label}</span>
      </nav>

      <span className="mb-1.5 block font-mono text-xs tracking-wider text-muted-foreground/70 uppercase">
        {toSlug(root.id)}
      </span>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground first-letter:uppercase">
        {root.label}
      </h1>
      {root.definition && (
        <p className="mb-7 max-w-prose text-sm text-muted-foreground">{root.definition}</p>
      )}

      <ConceptTree terms={root.narrower} lang={lang} />
    </div>
  );
}
