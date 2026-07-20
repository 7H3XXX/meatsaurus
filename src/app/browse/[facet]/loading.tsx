import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="mb-1.5 h-3 w-16" />
      <Skeleton className="mb-2 h-7 w-64" />
      <Skeleton className="mb-7 h-4 w-full max-w-md" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full max-w-sm" />
        ))}
      </div>
    </div>
  );
}
