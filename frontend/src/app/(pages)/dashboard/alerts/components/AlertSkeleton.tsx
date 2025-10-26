import { Skeleton } from "@/components/ui/skeleton"

export function AlertSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-48" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}

