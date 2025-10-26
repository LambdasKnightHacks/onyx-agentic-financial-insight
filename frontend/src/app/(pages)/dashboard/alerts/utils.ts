import { ShieldAlert, Info, DollarSign } from "lucide-react"
import type { Alert } from "./types"

export function getAlertIcon(type: string) {
  switch (type) {
    case 'budget':
      return DollarSign
    case 'fraud':
      return ShieldAlert
    default:
      return Info
  }
}

export function getAlertTitle(alert: Alert) {
  if (alert.type === 'budget') {
    // Extract category from reason
    const match = alert.reason?.match(/Budget exceeded for ([^:]+)/)
    return match ? match[1].trim() : 'Budget Alert'
  }
  return alert.merchant || 'Security Alert'
}

export function getAlertDescription(alert: Alert) {
  if (alert.type === 'budget') {
    return alert.reason || 'Budget limit exceeded'
  }
  return alert.date || new Date(alert.created_at).toLocaleDateString()
}

export function getSeverityColor(severity: string) {
  if (severity === "critical" || severity === "high") {
    return {
      bg: "bg-red-100",
      text: "text-red-600",
      badge: "destructive" as const
    }
  }
  if (severity === "warn" || severity === "medium") {
    return {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      badge: "secondary" as const
    }
  }
  return {
    bg: "bg-blue-100",
    text: "text-blue-600",
    badge: "secondary" as const
  }
}

