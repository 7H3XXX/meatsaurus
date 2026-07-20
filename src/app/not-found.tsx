import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-lg font-semibold text-foreground">Term not found</h1>
      <p className="text-sm text-muted-foreground">
        This concept doesn&apos;t exist in the MEAT-T thesaurus, or the link is out of date.
      </p>
      <Button asChild>
        <Link href="/">Back to search</Link>
      </Button>
    </div>
  );
}
