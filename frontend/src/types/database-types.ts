// Updated types to work with Supabase database schema
export type AccountType = "checking" | "savings" | "credit" | "loan"
export type AccountStatus = "active" | "frozen" | "closed"
export type TransactionStatus = "posted" | "pending"
export type AlertSeverity = "high" | "medium" | "low"
export type AlertStatus = "new" | "ack" | "resolved"

// Supabase Account type
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

// Frontend Account interface
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

// Supabase Transaction type
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

// Frontend Transaction interface
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

// Supabase Insight type
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

// Frontend Insight interface
export interface Insight {
  id: string
  title: string
  body?: string
  severity?: 'info' | 'warning' | 'critical'
  metricDelta: number
  confidence: number
  why: string[]
  cta?: {
    label: string
    action: string
    params?: Record<string, any>
  }
}

// Supabase Alert type
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

// Frontend FraudAlert interface
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
  const severity = (supabaseInsight.severity as 'info' | 'warning' | 'critical') || 'info'
  
  // Extract information from the nested data structure
  const riskAssessment = data?.risk_assessment || {}
  const keyMetrics = data?.key_metrics || {}
  const recommendations = data?.recommendations || []
  const alerts = data?.alerts || []
  const insights = data?.insights || []
  
  // Calculate metricDelta from key metrics if available
  const fraudScore = keyMetrics?.fraud_score || 0
  const cashflowRunway = keyMetrics?.cashflow_runway || 0
  const budgetStatus = keyMetrics?.budget_status || 'unknown'
  
  // Determine confidence based on fraud score for fraud-related alerts
  let confidence: number
  
  if (fraudScore > 0) {

    // Higher fraud score = higher confidence in the alert
    confidence = fraudScore
  } else {
    // For non-fraud alerts, use risk score
    confidence = riskAssessment?.risk_score || (severity === 'critical' ? 0.9 : severity === 'warning' ? 0.7 : 0.5)
  }
  
  // Build "why" array from available data
  const whyArray: string[] = []
  
  // Helper function to convert technical terms to user-friendly language
  const makeUserFriendly = (text: string): string => {
    return text
      .replace(/velocity_issue/gi, 'unusual spending pattern detected')
      .replace(/fraud_indicator/gi, 'potentially suspicious activity')
      .replace(/z_score/gi, 'spending anomaly')
      .replace(/geo_anomaly/gi, 'location mismatch')
      .replace(/budget_exceeded/gi, 'budget limit exceeded')
      .replace(/cashflow_crisis/gi, 'cash flow concerns')
  }
  
  // Check if text is a technical error that shouldn't be shown to users
  const isTechnicalError = (text: string): boolean => {
    const technicalPatterns = [
      'event loop',
      'event loop closed',
      'connection error',
      'timeout',
      'json decode',
      'attribute error',
      'key error',
      'parse error',
      'invalid response'
    ]
    const textLower = text.toLowerCase()
    return technicalPatterns.some(pattern => textLower.includes(pattern))
  }
  
  // Add alerts to why array (filter and clean)
  if (Array.isArray(alerts) && alerts.length > 0) {
    alerts.forEach(alert => {
      const cleaned = makeUserFriendly(String(alert))
      // Filter out technical errors
      if (!isTechnicalError(cleaned) && cleaned.length > 20 && cleaned !== alert) {
        whyArray.push(cleaned)
      }
    })
  }
  
  // Add insights to why array
  if (Array.isArray(insights) && insights.length > 0) {
    insights.forEach(insight => {
      const cleaned = makeUserFriendly(String(insight))
      // Filter out technical errors
      if (!isTechnicalError(cleaned) && cleaned && cleaned.trim().length > 15) {
        whyArray.push(cleaned)
      }
    })
  }
  
  // Add recommendations as explanations
  if (recommendations.length > 0) {
    recommendations.forEach((rec: any) => {
      if (rec.reasoning && rec.reasoning.trim().length > 15 && !isTechnicalError(rec.reasoning)) {
        whyArray.push(rec.reasoning)
      }
    })
  }
  
  // extract from body if no specific "why" data
  if (whyArray.length === 0 && supabaseInsight.body) {
    // Try to extract meaningful sentences from body
    const sentences = supabaseInsight.body.split(/[.!?]+/)
      .filter(s => s.trim().length > 20 && s.trim().length < 120)
      .slice(0, 2) // Limit to 2 concise sentences
    whyArray.push(...sentences)
  }
  
  // Limit why array to 3 items max for concise display
  if (whyArray.length > 3) {
    whyArray.splice(3)
  }
  
  // Calculate metricDelta based on available metrics
  let metricDelta = data?.metricDelta || 0
  
  // If no metricDelta but we have fraud score, use that
  if (metricDelta === 0 && fraudScore > 0) {
    metricDelta = fraudScore
  }
  
  // If cashflow runway is a concern, use that
  if (metricDelta === 0 && cashflowRunway > 0 && cashflowRunway < 30) {
    metricDelta = 1 - (cashflowRunway / 30) // Inverse relationship
  }
  
  // Build CTA from recommendations
  let cta = data?.cta
  if (!cta && recommendations.length > 0) {
    const firstRec = recommendations[0]
    // Create a shorter, more friendly label
    let label = firstRec.action || 'Take action'
    // Truncate to reasonable length for button
    if (label.length > 50) {
      label = label.substring(0, 47) + '...'
    }
    
    cta = {
      label,
      action: 'dashboard',
      params: {
        category: firstRec.category,
        priority: firstRec.priority
      }
    }
  }
  
  // Truncate body if too long
  let bodyText = supabaseInsight.body

  return {
    id: supabaseInsight.id,
    title: supabaseInsight.title,
    body: bodyText || undefined,
    severity,
    metricDelta,
    confidence,
    why: whyArray.length > 0 ? whyArray : ['Analysis completed'],
    cta
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
