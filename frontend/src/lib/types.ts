export type AccountType = "checking" | "savings" | "credit" | "loan";
export type AccountStatus = "active" | "frozen" | "closed";
export type TransactionStatus = "posted" | "processed";
export type AlertSeverity = "high" | "medium" | "low";
export type AlertStatus = "new" | "ack" | "resolved";

export interface Account {
  id: string;
  institution: string;
  nickname: string;
  last4: string;
  type: AccountType;
  currency: "USD";
  balanceCurrent: number;
  balanceAvailable?: number;
  status: AccountStatus;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  merchant: string;
  amount: number;
  currency: "USD";
  category: string;
  labels: string[];
  status: TransactionStatus;
  agent: {
    categoryConfidence: number;
    fraudScore: number;
    explanations: string[];
  };
  raw: {
    plaidTransactionId: string;
    mcc?: string;
    location?: string;
    channel?: string;
  };
}

export interface Insight {
  id: string;
  title: string;
  metricDelta: number;
  confidence: number;
  why: string[];
  cta?: {
    label: string;
    action: string;
    params?: Record<string, any>;
  };
}

export interface FraudAlert {
  id: string;
  severity: AlertSeverity;
  riskScore: number;
  reasonCodes: string[];
  evidenceTxnIds: string[];
  status: AlertStatus;
  merchant: string;
  amount: number;
  date: string;
}

export interface AutomationRule {
  id: string;
  enabled: boolean;
  name: string;
  trigger: {
    type: string;
    conditions: Array<{
      field: string;
      op: string;
      value: any;
    }>;
  };
  actions: Array<{
    type: string;
    severity?: string;
  }>;
  createdBy: string;
  version: number;
}

export interface AgentTask {
  id: string;
  agent: "advisor" | "fraud" | "automation";
  status: "pending" | "in-progress" | "completed";
  description: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  details: string;
  userId?: string;
}

// Chat Message Types
export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "sending" | "sent" | "error";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  charts?: ChartData[];
  timestamp: string;
  status?: MessageStatus;
}

export interface ChartData {
  chart_type: string;
  data: any[];
  config: {
    title?: string;
    xAxis?: any;
    yAxis?: any;
    legend?: any;
    tooltip?: any;
    [key: string]: any;
  };
  metadata: {
    description?: string;
    generated_at?: string;
    [key: string]: any;
  };
}

export interface ChatSession {
  session_id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// API Request/Response
export interface ChatRequest {
  user_id: string;
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  status: string;
  message: string;
  charts: ChartData[];
  session_id: string;
  timestamp: string;
}
