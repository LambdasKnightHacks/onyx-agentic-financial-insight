export type AccountType = "checking" | "savings" | "credit" | "loan"
export type AccountStatus = "active" | "frozen" | "closed"
export type TransactionStatus = "posted" | "pending"
export type AlertSeverity = "high" | "medium" | "low"
export type AlertStatus = "new" | "ack" | "resolved"

export interface Account {
  id: string
  institution: string
  nickname: string
  last4: string
  type: AccountType
  currency: "USD"
  balanceCurrent: number
  balanceAvailable?: number
  status: AccountStatus
}

export interface Transaction {
  id: string
  accountId: string
  date: string
  merchant: string
  amount: number
  currency: "USD"
  category: string
  labels: string[]
  status: TransactionStatus
  agent: {
    categoryConfidence: number
    fraudScore: number
    explanations: string[]
  }
  raw: {
    plaidTransactionId: string
    mcc?: string
    location?: string
    channel?: string
  }
}

export interface Insight {
  id: string
  title: string
  metricDelta: number
  confidence: number
  why: string[]
  cta?: {
    label: string
    action: string
    params?: Record<string, any>
  }
}

export interface FraudAlert {
  id: string
  severity: AlertSeverity
  riskScore: number
  reasonCodes: string[]
  evidenceTxnIds: string[]
  status: AlertStatus
  merchant: string
  amount: number
  date: string
}

export interface AutomationRule {
  id: string
  enabled: boolean
  name: string
  trigger: {
    type: string
    conditions: Array<{
      field: string
      op: string
      value: any
    }>
  }
  actions: Array<{
    type: string
    severity?: string
  }>
  createdBy: string
  version: number
}

export interface AgentTask {
  id: string
  agent: "advisor" | "fraud" | "automation"
  status: "pending" | "in-progress" | "completed"
  description: string
  timestamp: string
}

export interface AuditLog {
  id: string
  timestamp: string
  agent: string
  action: string
  details: string
  userId?: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  subcategory?: string | null
  label?: string | null
  period: "day" | "week" | "month" | "year"
  cap_amount: number
  currency: string
  start_on: string
  rollover?: boolean | null
  priority: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}
