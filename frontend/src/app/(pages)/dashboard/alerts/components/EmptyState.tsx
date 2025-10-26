import { Card } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
      <h2 className="text-2xl font-semibold mb-2">All clear!</h2>
      <p className="text-muted-foreground">No alerts require your attention at this time.</p>
    </Card>
  )
}

