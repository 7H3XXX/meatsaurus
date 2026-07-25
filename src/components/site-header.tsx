import { Suspense } from "react";
import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { LanguageToggle } from "@/components/language-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-20 max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-foreground">
          <Image
            src={'/logo.png'}
            loading="eager"
            width={64}
            height={64}
            alt="Logo de l'Académie de la Viande"
            className="aspect-square [@media(prefers-color-scheme:dark)]:invert"
          />
        </Link>
        <div className="max-w-sm flex-1">
          {/* Both children read useSearchParams(); a Suspense boundary is
              required here so pages without their own dynamic data (like
              Next's generated /_not-found) can still be statically prerendered. */}
          <Suspense fallback={<Skeleton className="h-9 w-full" />}>
            <SearchBox />
          </Suspense>
        </div>
        <Suspense fallback={<Skeleton className="h-7 w-16" />}>
          <LanguageToggle />
        </Suspense>
      </div>
    </header>
  );
}
