import Link from "next/link";
import { toSlug } from "@/lib/agroportal/slug";
import type { Facet, Lang } from "@/lib/agroportal/types";

export function FacetGrid({ facets, lang }: { facets: Facet[]; lang: Lang }) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {facets.map((facet) => (
        <li key={facet.id}>
          <Link
            href={`/browse/${toSlug(facet.id)}?lang=${lang}`}
            className="group relative flex flex-col gap-1.5 overflow-hidden rounded-md border border-border bg-card px-3.5 py-3 transition-colors hover:border-primary/40"
          >
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-0.5 origin-bottom scale-y-0 bg-primary transition-transform duration-200 ease-standard group-hover:scale-y-100"
            />
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground/70 uppercase">
              {toSlug(facet.id)}
            </span>
            <span className="text-sm font-medium text-foreground first-letter:uppercase">
              {facet.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
