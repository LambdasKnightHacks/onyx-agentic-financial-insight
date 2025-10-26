import { useState, useEffect } from 'react'
import type { Alert } from '../types'

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  async function fetchAlerts() {
    try {
      const res = await fetch("/api/alerts")
      const data = await res.json()
      setAlerts(data)
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  async function resolveAlert(alertId: string) {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", resolved: true }),
      })
      setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, status: "resolved" } : a)))
    } catch (error) {
      console.error("Failed to resolve alert:", error)
      throw error
    }
  }

  async function deleteAlert(alertId: string) {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
      })
      setAlerts(alerts.filter((a) => a.id !== alertId))
    } catch (error) {
      console.error("Failed to delete alert:", error)
      throw error
    }
  }

  const activeAlerts = alerts.filter((a) => a.status === "new" || a.status === "active")
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved")

  return {
    alerts,
    activeAlerts,
    resolvedAlerts,
    loading,
    resolveAlert,
    deleteAlert
  }
}

