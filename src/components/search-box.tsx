"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { searchAction } from "@/lib/actions";
import { toSlug } from "@/lib/agroportal/slug";
import type { SearchResult } from "@/lib/agroportal/types";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

export function SearchBox({
  autoFocus = false,
  large = false,
}: {
  autoFocus?: boolean;
  large?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "fr" ? "fr" : "en";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  // Server Actions have no AbortController equivalent — guard against a
  // slower, earlier request resolving after a faster, later one instead.
  const latestQueryRef = useRef("");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;
    latestQueryRef.current = trimmed;

    const timer = setTimeout(() => {
      startTransition(async () => {
        const found = await searchAction(trimmed, lang);
        if (latestQueryRef.current === trimmed) setResults(found);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, lang]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function goToTerm(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/term/${toSlug(id)}?lang=${lang}`);
  }

  const showPanel = open && query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={cn(
          "rounded-md border border-input bg-background transition-colors",
          "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
          large && "shadow-xs"
        )}
      >
        <Command shouldFilter={false} className="overflow-visible !rounded-none !bg-transparent !p-0">
          <CommandInput
            autoFocus={autoFocus}
            value={query}
            onValueChange={(value) => {
              setQuery(value);
              setOpen(true);
            }}
            onFocus={() => query.trim().length >= MIN_QUERY_LENGTH && setOpen(true)}
            placeholder={lang === "fr" ? "Chercher un terme…" : "Search a term…"}
            className={large ? "h-11 text-base" : undefined}
          />
          {showPanel && (
            <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-overlay">
              <CommandList>
                {isPending ? (
                  <div className="space-y-3 p-2" aria-hidden>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-1.5 px-1">
                        <Skeleton className="h-3.5 w-2/5" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <CommandEmpty>{lang === "fr" ? "Aucun terme trouvé." : "No terms found."}</CommandEmpty>
                    <CommandGroup>
                      {results.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => goToTerm(result.id)}
                          className="flex-col items-start gap-0.5"
                        >
                          <span className="font-medium text-foreground first-letter:uppercase">
                            {result.label}
                          </span>
                          {result.definition && (
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                              {result.definition}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
              <span role="status" className="sr-only">
                {isPending
                  ? lang === "fr"
                    ? "Recherche en cours…"
                    : "Searching…"
                  : lang === "fr"
                    ? `${results.length} résultat${results.length === 1 ? "" : "s"}`
                    : `${results.length} result${results.length === 1 ? "" : "s"}`}
              </span>
            </div>
          )}
        </Command>
      </div>
    </div>
  );
}
