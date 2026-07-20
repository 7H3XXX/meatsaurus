import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTerm } from "@/lib/agroportal/service";
import { fromSlug, toSlug } from "@/lib/agroportal/slug";
import { parseLang } from "@/lib/search-params";
import { AgroPortalError } from "@/lib/agroportal/errors";
import { langAlternates } from "@/lib/metadata";
import { Separator } from "@/components/ui/separator";
import { TermRelationList } from "@/components/term-relation-list";
import { MappingList } from "@/components/mapping-list";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

async function loadTerm(slug: string, langParam: string | undefined) {
  const lang = parseLang(langParam);
  try {
    const term = await getTerm(fromSlug(slug), lang);
    return { term, lang };
  } catch (error) {
    if (error instanceof AgroPortalError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { lang: langParam } = await searchParams;
  const { term, lang } = await loadTerm(slug, langParam);
  const description = term.definition?.slice(0, 160);
  return {
    title: term.label,
    description,
    alternates: langAlternates(`/term/${slug}`, lang),
    openGraph: { title: term.label, description },
  };
}

export default async function TermPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { lang: langParam } = await searchParams;
  const { term, lang } = await loadTerm(slug, langParam);

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-7">
        <div className="mb-2 flex items-center gap-2.5">
          <span className="font-mono text-xs tracking-wider text-muted-foreground/70 uppercase">
            {toSlug(term.id)}
          </span>
          {term.obsolete && (
            <span className="text-xs text-status-critical italic">
              {lang === "fr" ? "obsolète" : "obsolete"}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
          {term.label}
        </h1>
        {term.synonyms.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "fr" ? "Aussi appelé : " : "Also known as: "}
            {term.synonyms.join(", ")}
          </p>
        )}
      </header>

      {term.definition ? (
        <p className="border-l-2 border-primary py-0.5 pl-4 text-lg leading-relaxed text-foreground">
          {term.definition}
        </p>
      ) : (
        <p className="rounded-md border border-dashed border-border bg-surface-sunken px-4 py-3 text-sm text-muted-foreground">
          {lang === "fr"
            ? "Pas encore de définition en français pour ce terme."
            : "No definition available in English for this term yet."}
        </p>
      )}

      {(term.broader.length > 0 || term.narrower.length > 0) && (
        <>
          <Separator className="my-8" />
          <div className="grid gap-8 sm:grid-cols-2">
            <TermRelationList
              title={lang === "fr" ? "Terme(s) plus général(aux)" : "Broader"}
              terms={term.broader}
              lang={lang}
            />
            <TermRelationList
              title={lang === "fr" ? "Terme(s) plus spécifique(s)" : "Narrower"}
              terms={term.narrower}
              lang={lang}
            />
          </div>
        </>
      )}

      {term.mappings.length > 0 && (
        <>
          <Separator className="my-8" />
          <MappingList
            mappings={term.mappings}
            title={lang === "fr" ? "Également référencé dans" : "Also mapped in"}
          />
        </>
      )}
    </article>
  );
}
