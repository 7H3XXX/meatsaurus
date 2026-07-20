"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/agroportal/types";

const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
];

export function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current: Lang = searchParams.get("lang") === "fr" ? "fr" : "en";

  function setLang(lang: Lang) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", lang);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div role="group" aria-label="Language" className="inline-flex shrink-0 rounded-md border border-border p-0.5">
      {LANGS.map(({ value, label }) => (
        <Button
          key={value}
          type="button"
          size="sm"
          variant={current === value ? "default" : "ghost"}
          className="h-7 px-2.5 text-xs"
          aria-pressed={current === value}
          onClick={() => setLang(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
