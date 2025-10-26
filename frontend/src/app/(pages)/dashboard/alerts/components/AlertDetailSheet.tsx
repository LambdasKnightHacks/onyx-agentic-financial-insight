import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ShieldAlert, DollarSign, AlertTriangle } from "lucide-react"
import type { Alert } from "../types"
import { getAlertTitle, getAlertIcon } from "../utils"

interface AlertDetailSheetProps {
  alert: Alert | null
  onResolve: (alertId: string) => Promise<void>
}

export function AlertDetailSheet({ alert, onResolve }: AlertDetailSheetProps) {
  if (!alert) return null

  const isBudgetAlert = alert.type === 'budget'
  const isFraudAlert = alert.type === 'fraud'
  const AlertIcon = getAlertIcon(alert.type)
  const isCritical = alert.severity === 'critical' || alert.severity === 'high'

  return (
    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-xl shadow-lg ${
            isFraudAlert 
              ? 'bg-gradient-to-br from-red-500 to-red-600' 
              : 'bg-gradient-to-br from-amber-500 to-orange-500'
          }`}>
            <AlertIcon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <SheetTitle className="text-2xl">Alert Details</SheetTitle>
            <SheetDescription className="mt-2">
              {isBudgetAlert 
                ? 'Review your budget status and take action'
                : 'Review this suspicious transaction and take action'
              }
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>
      <div className="space-y-6">
        {isBudgetAlert ? (
          // Budget Alert Details
          <>
            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                <h3 className="font-semibold text-lg">Budget Alert</h3>
              </div>
              <p className="text-sm text-muted-foreground">{alert.reason}</p>
            </div>

            <div className="p-4 bg-card rounded-lg border border-border">
              <h3 className="font-semibold text-lg mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0">
                  <span className="text-sm text-muted-foreground font-medium">Category</span>
                  <span className="text-sm font-semibold">{getAlertTitle(alert)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0">
                  <span className="text-sm text-muted-foreground font-medium">Severity</span>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="font-semibold">
                    {alert.severity}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground font-medium">Created</span>
                  <span className="text-sm font-semibold">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {alert.score && (
              <div className="p-4 bg-card rounded-lg border border-border">
                <h3 className="font-semibold text-lg mb-3">Budget Usage</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Spending Level</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-500">
                    {(alert.score * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(alert.score * 100, 100)} 
                  className="h-3 [&>div]:bg-amber-500"
                />
              </div>
            )}

            <div className="pt-2">
              <Button 
                className="w-full h-12 text-base font-semibold" 
                onClick={() => onResolve(alert.id)}
              >
                Mark as Resolved
              </Button>
            </div>
          </>
        ) : (
          // Fraud Alert Details
          <>
            <div className={`p-5 rounded-lg border-2 ${
              isCritical 
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-orange-500/10 border-orange-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className={`h-5 w-5 ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`} />
                <h3 className={`font-bold text-lg ${isCritical ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'}`}>
                  {isCritical ? 'Critical Security Alert' : 'Security Alert'}
                </h3>
              </div>
              {alert.merchant && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Merchant</p>
                  <p className="text-lg font-bold">{alert.merchant}</p>
                </div>
              )}
              {alert.amount !== undefined && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Transaction Amount</p>
                  <p className="text-4xl font-bold tracking-tight">
                    ${Math.abs(alert.amount).toFixed(2)}
                  </p>
                </div>
              )}
              {alert.date && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Date</p>
                  <p className="text-base font-semibold">{alert.date}</p>
                </div>
              )}
            </div>

            {alert.riskScore !== undefined && (
              <div className="p-4 bg-card rounded-lg border border-border">
                <h3 className="font-semibold text-lg mb-4">Risk Assessment</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Risk Level</span>
                      <span className={`text-lg font-bold ${
                        alert.riskScore > 0.7 ? 'text-red-600' : 
                        alert.riskScore > 0.4 ? 'text-orange-500' : 
                        'text-yellow-500'
                      }`}>
                        {(alert.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={alert.riskScore * 100} 
                      className={`h-3 ${
                        alert.riskScore > 0.7 ? '[&>div]:bg-red-600' : 
                        alert.riskScore > 0.4 ? '[&>div]:bg-orange-500' : 
                        '[&>div]:bg-yellow-500'
                      }`}
                    />
                  </div>
                  {alert.reasonCodes && alert.reasonCodes.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm font-semibold mb-3">Why this transaction was flagged:</p>
                      <ul className="space-y-2">
                        {alert.reasonCodes.map((code) => (
                          <li key={code} className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <Button 
                variant="destructive" 
                className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700" 
                onClick={() => onResolve(alert.id)}
              >
                <ShieldAlert className="mr-2 h-5 w-5" />
                Dismiss
              </Button>
            </div>
          </>
        )}
      </div>
    </SheetContent>
  )
}

