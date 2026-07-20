"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { getChildrenAction } from "@/lib/actions";
import { toSlug } from "@/lib/agroportal/slug";
import type { TermSummary, Lang } from "@/lib/agroportal/types";

/**
 * Children are fetched lazily on first expand — a facet's full subtree can
 * run deep, so eagerly loading everything up front would turn one page load
 * into dozens of upstream calls for branches the user never opens.
 */
function TreeNode({ term, lang, depth }: { term: TermSummary; lang: Lang; depth: number }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<TermSummary[]>([]);

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen || loaded) return;
    setLoading(true);
    try {
      setChildren(await getChildrenAction(term.id, lang));
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  return (
    <li role="treeitem" aria-expanded={open} aria-selected={false} aria-level={depth + 1}>
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <div
          className="group relative flex items-center gap-1 rounded-md py-1 pr-2 hover:bg-muted"
          style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
        >
          <span
            aria-hidden
            className="absolute inset-y-0.5 left-0 w-0.5 origin-bottom scale-y-0 bg-primary transition-transform duration-200 ease-standard group-hover:scale-y-100"
          />
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              aria-label={open ? "Collapse" : "Expand"}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} aria-hidden />
              )}
            </button>
          </CollapsibleTrigger>
          <Link
            href={`/term/${toSlug(term.id)}?lang=${lang}`}
            className="flex-1 truncate py-0.5 text-sm text-foreground first-letter:uppercase hover:text-primary"
          >
            {term.label}
          </Link>
        </div>
        <CollapsibleContent>
          {loaded && children.length > 0 && (
            <ul role="group">
              {children.map((child) => (
                <TreeNode key={child.id} term={child} lang={lang} depth={depth + 1} />
              ))}
            </ul>
          )}
          {loaded && children.length === 0 && (
            <p className="py-1 text-xs text-muted-foreground" style={{ paddingLeft: `${(depth + 1) * 1.25 + 1.25}rem` }}>
              {lang === "fr" ? "Aucun terme plus spécifique." : "No narrower terms."}
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

export function ConceptTree({ terms, lang }: { terms: TermSummary[]; lang: Lang }) {
  if (terms.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {lang === "fr" ? "Aucun terme plus spécifique." : "No narrower terms."}
      </p>
    );
  }

  return (
    <ul role="tree" aria-label={lang === "fr" ? "Arborescence des termes" : "Concept hierarchy"}>
      {terms.map((term) => (
        <TreeNode key={term.id} term={term} lang={lang} depth={0} />
      ))}
    </ul>
  );
}
