/**
 * Decision Analysis TypeScript Types
 */

export type DecisionType =
  | "car_lease_vs_finance"
  | "home_buy_vs_rent"
  | "travel_booking";

export type RiskTolerance = "low" | "medium" | "high";

export interface LeaseOption {
  monthly_payment: number;
  down_payment: number;
  lease_term_months: number;
  mileage_cap?: number;
  acquisition_fee?: number;
  disposition_fee?: number;
  insurance_monthly?: number;
  fuel_monthly?: number;
  maintenance_monthly?: number;
}

export interface FinanceOption {
  purchase_price: number;
  down_payment: number;
  apr: number;
  loan_term_months: number;
  insurance_monthly?: number;
  fuel_monthly?: number;
  maintenance_monthly?: number;
}

export interface CarDecisionInputs {
  lease_option: LeaseOption;
  finance_option: FinanceOption;
  tenure_months: number;
}

export interface DecisionPreferences {
  max_acceptable_payment?: number;
  risk_tolerance?: RiskTolerance;
}

export interface DecisionConstraints {
  min_emergency_fund_months?: number;
}

export interface DecisionAnalysisRequest {
  user_id: string;
  session_id?: string;
  decision_type: DecisionType;
  decision_inputs: CarDecisionInputs;
  preferences: DecisionPreferences;
  constraints: DecisionConstraints;
}

export interface DecisionAnalysisResponse {
  status: "started" | "processing" | "completed" | "failed";
  session_id: string;
  analysis_id: string;
  message: string;
  websocket_url: string;
}

export interface DecisionOption {
  name: string;
  tco_expected: number;
  tco_range: [number, number];
  monthly_payment: number;
  liquidity_score: number;
  credit_impact: string;
  runway_breach_prob_6mo: number;
  utility: number;
  notes: string[];
}

export interface BudgetRebalancing {
  category: string;
  change: string;
  monthly_delta: number;
}

export interface DecisionAnalysisResult {
  decision: string;
  horizon_months: number;
  options: DecisionOption[];
  verdict: string;
  budget_rebalance: BudgetRebalancing[];
  actions: string[];
  explainability: string[];
}

// WebSocket Event Types
export type DecisionWebSocketEventType =
  | "analysis_started"
  | "agent_started"
  | "agent_progress"
  | "agent_completed"
  | "analysis_complete"
  | "error";

export interface DecisionWebSocketEvent {
  type: DecisionWebSocketEventType;
  data: any;
  timestamp: string;
}
