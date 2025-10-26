import { Skeleton } from "@/components/ui/skeleton"

export function BudgetSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-48" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}

