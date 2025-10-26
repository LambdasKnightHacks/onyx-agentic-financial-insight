// Alert interface handles both fraud alerts and budget alerts
export interface Alert {
  id: string
  type: string // 'fraud', 'budget', etc.
  severity: string
  status: string
  created_at: string
  reason: string
  score: number
  // Transaction data (if available)
  merchant?: string
  amount?: number
  date?: string
  // Fraud-specific
  reasonCodes?: string[]
  evidenceTxnIds?: string[]
  riskScore?: number
}

export type AlertType = 'fraud' | 'budget'
export type AlertSeverity = 'info' | 'warn' | 'medium' | 'high' | 'critical'
export type AlertStatus = 'new' | 'active' | 'resolved'

