// Updated types to work with Supabase database schema
export type AccountType = "checking" | "savings" | "credit" | "loan"
export type AccountStatus = "active" | "frozen" | "closed"
export type TransactionStatus = "posted" | "pending"
export type AlertSeverity = "high" | "medium" | "low"
export type AlertStatus = "new" | "ack" | "resolved"

// Supabase Account type (matches your database schema)
export interface SupabaseAccount {
  id: string
  user_id: string
  name: string
  type: string | null
  currency: string
  last4: string | null
  created_at: string
  institution: string | null
  balance_current: number
  balance_available: number
}

// Frontend Account interface (compatible with your existing UI)
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

// Supabase Transaction type (matches your database schema)
export interface SupabaseTransaction {
  id: string
  user_id: string
  account_id: string | null
  plaid_transaction_id: string | null
  source: string
  posted_at: string
  authorized_date: string | null
  amount: number
  currency: string | null
  merchant_name: string | null
  merchant: string | null
  description: string | null
  category: string | null
  subcategory: string | null
  pending: boolean
  payment_channel: string | null
  status: string
  location_city: string | null
  location_state: string | null
  geo_lat: number | null
  geo_lon: number | null
  mcc: number | null
  category_confidence: number | null
  fraud_score: number | null
  category_reason: string | null
  raw: any | null
  hash: string | null
  ingested_at: string
}

// Frontend Transaction interface (compatible with your existing UI)
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

// Supabase Insight type (matches your database schema)
export interface SupabaseInsight {
  id: string
  user_id: string
  run_id: string | null
  title: string
  body: string | null
  data: any | null
  severity: string | null
  created_at: string
}

// Frontend Insight interface (compatible with your existing UI)
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

// Supabase Alert type (matches your database schema)
export interface SupabaseAlert {
  id: string
  user_id: string
  tx_id: string
  type: string
  score: number | null
  reason: string | null
  severity: string | null
  created_at: string
  resolved: boolean
  status: string | null
}

// Frontend FraudAlert interface (compatible with your existing UI)
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

// Utility functions to transform Supabase data to frontend format
export function transformSupabaseAccountToAccount(supabaseAccount: SupabaseAccount): Account {
  return {
    id: supabaseAccount.id,
    institution: supabaseAccount.institution || 'Unknown',
    nickname: supabaseAccount.name,
    last4: supabaseAccount.last4 || '****',
    type: (supabaseAccount.type as AccountType) || 'checking',
    currency: 'USD',
    balanceCurrent: supabaseAccount.balance_current == null ? 0 : Number(supabaseAccount.balance_current),
    balanceAvailable: supabaseAccount.balance_available == null ? undefined : Number(supabaseAccount.balance_available),
    status: 'active' // Default status
  }
}

export function transformSupabaseTransactionToTransaction(supabaseTransaction: SupabaseTransaction): Transaction {
  return {
    id: supabaseTransaction.id,
    accountId: supabaseTransaction.account_id || '',
    date: supabaseTransaction.posted_at,
    merchant: supabaseTransaction.merchant_name || supabaseTransaction.merchant || 'Unknown',
    amount: supabaseTransaction.amount,
    currency: 'USD',
    category: supabaseTransaction.category || 'Uncategorized',
    labels: [
      `recurring:${supabaseTransaction.pending ? 'false' : 'true'}`,
      `channel:${supabaseTransaction.payment_channel || 'unknown'}`
    ],
    status: supabaseTransaction.pending ? 'pending' : 'posted',
    agent: {
      categoryConfidence: supabaseTransaction.category_confidence || 0,
      fraudScore: supabaseTransaction.fraud_score || 0,
      explanations: supabaseTransaction.category_reason ? [supabaseTransaction.category_reason] : []
    },
    raw: {
      plaidTransactionId: supabaseTransaction.plaid_transaction_id || '',
      mcc: supabaseTransaction.mcc?.toString(),
      location: supabaseTransaction.location_city && supabaseTransaction.location_state 
        ? `${supabaseTransaction.location_city}, ${supabaseTransaction.location_state}`
        : undefined,
      channel: supabaseTransaction.payment_channel || undefined
    }
  }
}

export function transformSupabaseInsightToInsight(supabaseInsight: SupabaseInsight): Insight {
  const data = supabaseInsight.data as any
  return {
    id: supabaseInsight.id,
    title: supabaseInsight.title,
    metricDelta: data?.metricDelta || 0,
    confidence: data?.confidence || 0,
    why: data?.why || [],
    cta: data?.cta
  }
}

export function transformSupabaseAlertToFraudAlert(supabaseAlert: SupabaseAlert, transaction?: Transaction): FraudAlert {
  return {
    id: supabaseAlert.id,
    severity: (supabaseAlert.severity as AlertSeverity) || 'medium',
    riskScore: supabaseAlert.score || 0,
    reasonCodes: supabaseAlert.reason ? [supabaseAlert.reason] : [],
    evidenceTxnIds: [supabaseAlert.tx_id],
    status: supabaseAlert.resolved ? 'resolved' : (supabaseAlert.status as AlertStatus) || 'new',
    merchant: transaction?.merchant || 'Unknown',
    amount: transaction?.amount || 0,
    date: supabaseAlert.created_at
  }
}
