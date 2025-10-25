"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldAlert, CheckCircle, Info } from "lucide-react"
import type { FraudAlert } from "@/lib/types"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch("/api/fraud/alerts")
        const data = await res.json()
        setAlerts(data)
      } catch (error) {
        console.error("Failed to fetch alerts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [])

  const handleResolve = async (alertId: string) => {
    try {
      await fetch(`/api/fraud/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      })
      setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, status: "resolved" } : a)))
      setSelectedAlert(null)
    } catch (error) {
      console.error("Failed to resolve alert:", error)
    }
  }

  if (loading) {
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

  const newAlerts = alerts.filter((a) => a.status === "new")
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Alerts</h1>
        <p className="text-muted-foreground mt-2">Review and manage suspicious activity on your accounts</p>
      </div>

      {newAlerts.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">All clear!</h2>
          <p className="text-muted-foreground">No security alerts require your attention at this time.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Needs Review ({newAlerts.length})</h2>
          {newAlerts.map((alert) => (
            <Sheet key={alert.id}>
              <SheetTrigger asChild>
                <Card
                  className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        alert.severity === "high"
                          ? "bg-red-100"
                          : alert.severity === "medium"
                            ? "bg-yellow-100"
                            : "bg-blue-100"
                      }`}
                    >
                      <ShieldAlert
                        className={`h-6 w-6 ${
                          alert.severity === "high"
                            ? "text-red-600"
                            : alert.severity === "medium"
                              ? "text-yellow-600"
                              : "text-blue-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{alert.merchant}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{alert.date}</p>
                        </div>
                        <Badge variant={alert.severity === "high" ? "destructive" : "secondary"} className="capitalize">
                          {alert.severity} Risk
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <div>
                          <p className="text-2xl font-bold">${alert.amount.toFixed(2)}</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">Risk Score</span>
                            <span className="text-sm font-bold">{(alert.riskScore * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={alert.riskScore * 100} className="h-2" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {alert.reasonCodes.map((code) => (
                          <Badge key={code} variant="outline" className="text-xs">
                            {code.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Alert Details</SheetTitle>
                  <SheetDescription>Review this suspicious transaction and take action</SheetDescription>
                </SheetHeader>
                {selectedAlert && (
                  <div className="space-y-6 mt-6">
                    <div>
                      <h3 className="font-semibold mb-2">Transaction</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Merchant</span>
                          <span className="text-sm font-medium">{selectedAlert.merchant}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Amount</span>
                          <span className="text-sm font-medium">${selectedAlert.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Date</span>
                          <span className="text-sm font-medium">{selectedAlert.date}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Risk Assessment</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Risk Score</span>
                            <span className="text-sm font-bold">{(selectedAlert.riskScore * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={selectedAlert.riskScore * 100} className="h-2" />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Why we flagged this:</p>
                          <ul className="space-y-2">
                            {selectedAlert.reasonCodes.map((code) => (
                              <li key={code} className="flex items-start gap-2 text-sm">
                                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <span>{code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => setSelectedAlert(null)}
                      >
                        Mark as OK
                      </Button>
                      <Button variant="destructive" className="flex-1" onClick={() => handleResolve(selectedAlert.id)}>
                        Dispute Transaction
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          ))}
        </div>
      )}

      {resolvedAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Resolved ({resolvedAlerts.length})</h2>
          {resolvedAlerts.map((alert) => (
            <Card key={alert.id} className="p-6 opacity-60">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-gray-100">
                  <CheckCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{alert.merchant}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${alert.amount.toFixed(2)} • {alert.date}
                      </p>
                    </div>
                    <Badge variant="secondary">Resolved</Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
