"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <AlertCircle className="size-8 text-status-critical" aria-hidden />
      <h1 className="text-lg font-semibold text-foreground">Something went wrong loading the thesaurus.</h1>
      <p className="text-sm text-muted-foreground">
        AgroPortal might be temporarily unreachable. Try again in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
