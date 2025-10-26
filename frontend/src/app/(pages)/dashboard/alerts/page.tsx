"use client"

import { useState } from "react"
import { Sheet } from "@/components/ui/sheet"
import { Pagination } from "@/components/ui/pagination"
import type { Alert } from "./types"
import { useAlerts } from "./hooks/useAlerts"
import { AlertCard } from "./components/AlertCard"
import { AlertDetailSheet } from "./components/AlertDetailSheet"
import { ResolvedAlertCard } from "./components/ResolvedAlertCard"
import { EmptyState } from "./components/EmptyState"
import { AlertSkeleton } from "./components/AlertSkeleton"

const ALERTS_PER_PAGE = 5

export default function AlertsPage() {
  const { activeAlerts, resolvedAlerts, loading, resolveAlert, deleteAlert } = useAlerts()
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeAlertsPage, setActiveAlertsPage] = useState(1)
  const [resolvedAlertsPage, setResolvedAlertsPage] = useState(1)

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert)
    setSheetOpen(true)
  }

  const handleResolve = async (alertId: string) => {
    await resolveAlert(alertId)
    setSheetOpen(false)
    setSelectedAlert(null)
  }

  // Pagination helper
  const getPaginatedAlerts = (alerts: Alert[], page: number) => {
    const startIndex = (page - 1) * ALERTS_PER_PAGE
    const endIndex = startIndex + ALERTS_PER_PAGE
    return alerts.slice(startIndex, endIndex)
  }

  const paginatedActiveAlerts = getPaginatedAlerts(activeAlerts, activeAlertsPage)
  const paginatedResolvedAlerts = getPaginatedAlerts(resolvedAlerts, resolvedAlertsPage)

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
          {paginatedActiveAlerts.map((alert) => (
            <Sheet key={alert.id} open={sheetOpen && selectedAlert?.id === alert.id} onOpenChange={setSheetOpen}>
              <AlertCard alert={alert} onClick={() => handleAlertClick(alert)} />
              <AlertDetailSheet
                alert={selectedAlert}
                onResolve={handleResolve}
              />
            </Sheet>
          ))}
          <Pagination
            currentPage={activeAlertsPage}
            totalItems={activeAlerts.length}
            itemsPerPage={ALERTS_PER_PAGE}
            onPageChange={setActiveAlertsPage}
            itemLabel="alerts"
          />
        </div>
      )}

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Resolved ({resolvedAlerts.length})</h2>
          {paginatedResolvedAlerts.map((alert) => (
            <ResolvedAlertCard
              key={alert.id}
              alert={alert}
              onDelete={deleteAlert}
            />
          ))}
          <Pagination
            currentPage={resolvedAlertsPage}
            totalItems={resolvedAlerts.length}
            itemsPerPage={ALERTS_PER_PAGE}
            onPageChange={setResolvedAlertsPage}
            itemLabel="alerts"
          />
        </div>
      )}
    </div>
  )
}

