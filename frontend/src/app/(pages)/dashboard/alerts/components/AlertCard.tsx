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

  // Enhanced color scheme for fraud alerts
  const isCritical = alert.severity === 'critical' || alert.severity === 'high'
  const fraudGradient = isCritical 
    ? "bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-l-4 border-red-500" 
    : "bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-l-4 border-orange-500"

  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
        isFraudAlert ? fraudGradient : 'hover:border-primary/20'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-5 p-6">
        {/* Enhanced Icon Section */}
        <div className={`relative flex-shrink-0 ${isFraudAlert && isCritical ? 'animate-pulse' : ''}`}>
          <div className={`p-4 rounded-xl shadow-lg ${
            isFraudAlert 
              ? 'bg-gradient-to-br from-red-500 to-red-600' 
              : isBudgetAlert
              ? 'bg-gradient-to-br from-amber-500 to-orange-500'
              : severityColors.bg
          }`}>
            <AlertIcon className="h-7 w-7 text-white" />
          </div>
          {isCritical && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 rounded-full border-2 border-background animate-ping" />
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-xl text-foreground truncate">
                  {getAlertTitle(alert)}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getAlertDescription(alert)}
              </p>
            </div>
            <Badge 
              variant={isCritical ? "destructive" : "secondary"} 
              className={`capitalize font-semibold px-3 py-1 text-xs ${
                isCritical ? 'animate-pulse' : ''
              }`}
            >
              {alert.severity}
            </Badge>
          </div>

          {/* Fraud Alert Details */}
          {isFraudAlert && alert.amount !== undefined && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border/50">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Transaction Amount</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${Math.abs(alert.amount).toFixed(2)}
                  </p>
                </div>
                {alert.riskScore !== undefined && (
                  <div className="flex-1 max-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground">Risk Level</span>
                      <span className={`text-xs font-bold ${
                        alert.riskScore > 0.7 ? 'text-red-600' : 
                        alert.riskScore > 0.4 ? 'text-orange-500' : 
                        'text-yellow-500'
                      }`}>
                        {(alert.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={alert.riskScore * 100} 
                      className={`h-2.5 ${
                        alert.riskScore > 0.7 ? '[&>div]:bg-red-600' : 
                        alert.riskScore > 0.4 ? '[&>div]:bg-orange-500' : 
                        '[&>div]:bg-yellow-500'
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

