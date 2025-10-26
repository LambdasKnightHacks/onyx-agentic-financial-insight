import { Card } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { DollarSign, Plus } from "lucide-react"

interface EmptyStateProps {
  onCreateBudget: () => void
}

export function EmptyState({ onCreateBudget }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="inline-flex p-3 rounded-full bg-muted mb-4">
        <DollarSign className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
      <p className="text-muted-foreground mb-4">
        Create your first budget to start tracking spending limits
      </p>
      <Button onClick={onCreateBudget}>
        <Plus className="h-4 w-4 mr-2" />
        Create Budget
      </Button>
    </Card>
  )
}

