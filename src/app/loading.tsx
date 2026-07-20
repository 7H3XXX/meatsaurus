import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <Skeleton className="mb-2 h-3 w-40" />
      <Skeleton className="mb-7 h-7 w-72" />
      <Skeleton className="h-11 w-full" />
      <div className="mt-16">
        <Skeleton className="mb-3 h-3 w-32" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}
