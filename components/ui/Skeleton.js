import { cn } from "@/lib/cn";

export function Skeleton({ className }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-14" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-5/6" />
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 6 }) {
  return (
    <div className="flex flex-col gap-4">  {/* ← Changed to single column */}
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}