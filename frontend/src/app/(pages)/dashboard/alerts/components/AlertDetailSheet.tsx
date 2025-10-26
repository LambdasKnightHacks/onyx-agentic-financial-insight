import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/src/components/ui/sheet"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Progress } from "@/src/components/ui/progress"
import { Info } from "lucide-react"
import type { Alert } from "../types"
import { getAlertTitle } from "../utils"

interface AlertDetailSheetProps {
  alert: Alert | null
  onResolve: (alertId: string) => Promise<void>
}

export function AlertDetailSheet({ alert, onResolve }: AlertDetailSheetProps) {
  if (!alert) return null

  const isBudgetAlert = alert.type === 'budget'
  const isFraudAlert = alert.type === 'fraud'

  return (
    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Alert Details</SheetTitle>
        <SheetDescription>
          {isBudgetAlert 
            ? 'Review your budget status and take action'
            : 'Review this suspicious transaction and take action'
          }
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-6 mt-6">
        {isBudgetAlert ? (
          // Budget Alert Details
          <>
            <div>
              <h3 className="font-semibold mb-2">Budget Alert</h3>
              <p className="text-sm text-muted-foreground">{alert.reason}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="text-sm font-medium">{getAlertTitle(alert)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Severity</span>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {alert.score && (
              <div>
                <h3 className="font-semibold mb-2">Budget Usage</h3>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Spending</span>
                  <span className="text-sm font-bold">{(alert.score * 100).toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(alert.score * 100, 100)} className="h-2" />
              </div>
            )}

            <div className="pt-4">
              <Button 
                className="w-full" 
                onClick={() => onResolve(alert.id)}
              >
                Mark as Resolved
              </Button>
            </div>
          </>
        ) : (
          // Fraud Alert Details
          <>
            <div>
              <h3 className="font-semibold mb-2">Transaction</h3>
              <div className="space-y-2">
                {alert.merchant && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Merchant</span>
                    <span className="text-sm font-medium">{alert.merchant}</span>
                  </div>
                )}
                {alert.amount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-sm font-medium">${Math.abs(alert.amount).toFixed(2)}</span>
                  </div>
                )}
                {alert.date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm font-medium">{alert.date}</span>
                  </div>
                )}
              </div>
            </div>

            {alert.riskScore !== undefined && (
              <div>
                <h3 className="font-semibold mb-2">Risk Assessment</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Risk Score</span>
                      <span className="text-sm font-bold">{(alert.riskScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={alert.riskScore * 100} className="h-2" />
                  </div>
                  {alert.reasonCodes && alert.reasonCodes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Why we flagged this:</p>
                      <ul className="space-y-2">
                        {alert.reasonCodes.map((code) => (
                          <li key={code} className="flex items-start gap-2 text-sm">
                            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span>{code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button variant="destructive" className="w-full" onClick={() => onResolve(alert.id)}>
                Dispute Transaction
              </Button>
            </div>
          </>
        )}
      </div>
    </SheetContent>
  )
}

