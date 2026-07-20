import Link from "next/link";
import { toSlug } from "@/lib/agroportal/slug";
import type { TermSummary, Lang } from "@/lib/agroportal/types";

export function TermRelationList({
  title,
  terms,
  lang,
}: {
  title: string;
  terms: TermSummary[];
  lang: Lang;
}) {
  if (terms.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
      <ul className="space-y-1.5">
        {terms.map((term) => (
          <li key={term.id} className="flex items-baseline gap-2">
            <span aria-hidden className="size-1 shrink-0 rounded-[1px] bg-primary" />
            <Link
              href={`/term/${toSlug(term.id)}?lang=${lang}`}
              className="text-sm text-foreground first-letter:uppercase hover:text-primary"
            >
              {term.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
