import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Trash2 } from "lucide-react"
import type { Alert } from "../types"
import { getAlertTitle } from "../utils"

interface ResolvedAlertCardProps {
  alert: Alert
  onDelete: (alertId: string) => Promise<void>
}

export function ResolvedAlertCard({ alert, onDelete }: ResolvedAlertCardProps) {
  return (
    <Card className="p-6 opacity-60 hover:opacity-100 transition-opacity">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-gray-100">
          <CheckCircle className="h-6 w-6 text-gray-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{getAlertTitle(alert)}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {alert.type === 'budget' ? alert.reason : 
                 `${alert.amount ? '$' + Math.abs(alert.amount).toFixed(2) : ''} ${alert.date ? '• ' + alert.date : ''}`
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Resolved</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(alert.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

