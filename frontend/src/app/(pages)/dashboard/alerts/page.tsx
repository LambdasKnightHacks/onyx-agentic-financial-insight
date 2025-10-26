"use client"

import { useState } from "react"
import { Sheet } from "@/src/components/ui/sheet"
import type { Alert } from "./types"
import { useAlerts } from "./hooks/useAlerts"
import { AlertCard } from "./components/AlertCard"
import { AlertDetailSheet } from "./components/AlertDetailSheet"
import { ResolvedAlertCard } from "./components/ResolvedAlertCard"
import { EmptyState } from "./components/EmptyState"
import { AlertSkeleton } from "./components/AlertSkeleton"

export default function AlertsPage() {
  const { activeAlerts, resolvedAlerts, loading, resolveAlert, deleteAlert } = useAlerts()
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert)
    setSheetOpen(true)
  }

  const handleResolve = async (alertId: string) => {
    await resolveAlert(alertId)
    setSheetOpen(false)
    setSelectedAlert(null)
  }

  if (loading) {
    return <AlertSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage budget alerts and suspicious activity
        </p>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Needs Review ({activeAlerts.length})</h2>
          {activeAlerts.map((alert) => (
            <Sheet key={alert.id} open={sheetOpen && selectedAlert?.id === alert.id} onOpenChange={setSheetOpen}>
              <AlertCard alert={alert} onClick={() => handleAlertClick(alert)} />
              <AlertDetailSheet
                alert={selectedAlert}
                onResolve={handleResolve}
              />
            </Sheet>
          ))}
        </div>
      )}

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Resolved ({resolvedAlerts.length})</h2>
          {resolvedAlerts.map((alert) => (
            <ResolvedAlertCard
              key={alert.id}
              alert={alert}
              onDelete={deleteAlert}
            />
          ))}
        </div>
      )}
    </div>
  )
}

