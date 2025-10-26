import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Alert } from "../types"
import { getAlertIcon, getAlertTitle, getAlertDescription, getSeverityColor } from "../utils"

interface AlertCardProps {
  alert: Alert
  onClick: () => void
}

export function AlertCard({ alert, onClick }: AlertCardProps) {
  const AlertIcon = getAlertIcon(alert.type)
  const isBudgetAlert = alert.type === 'budget'
  const isFraudAlert = alert.type === 'fraud'
  const severityColors = getSeverityColor(alert.severity)

  return (
    <Card
      className="p-6 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${severityColors.bg}`}>
          <AlertIcon className={`h-6 w-6 ${severityColors.text}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{getAlertTitle(alert)}</h3>
                <Badge variant="outline" className="text-xs">
                  {isBudgetAlert ? 'Budget' : isFraudAlert ? 'Fraud' : alert.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getAlertDescription(alert)}
              </p>
            </div>
            <Badge variant={severityColors.badge} className="capitalize">
              {alert.severity}
            </Badge>
          </div>

          {isBudgetAlert && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{alert.reason}</p>
              {alert.score && (
                <div className="mt-2">
                  <Progress value={Math.min(alert.score * 100, 100)} className="h-2" />
                </div>
              )}
            </div>
          )}

          {isFraudAlert && alert.amount !== undefined && (
            <>
              <div className="flex items-center gap-4 mt-4">
                <div>
                  <p className="text-2xl font-bold">${Math.abs(alert.amount).toFixed(2)}</p>
                </div>
                {alert.riskScore !== undefined && (
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Risk Score</span>
                      <span className="text-sm font-bold">{(alert.riskScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={alert.riskScore * 100} className="h-2" />
                  </div>
                )}
              </div>
              {alert.reasonCodes && alert.reasonCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {alert.reasonCodes.map((code) => (
                    <Badge key={code} variant="outline" className="text-xs">
                      {code.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

