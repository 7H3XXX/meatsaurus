import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Skeleton className="mb-2 h-3 w-16" />
      <Skeleton className="mb-7 h-9 w-3/4" />
      <div className="space-y-2 border-l-2 border-border py-0.5 pl-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    </div>
  );
}
