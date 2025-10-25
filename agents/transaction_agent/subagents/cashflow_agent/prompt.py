"""
Cashflow Agent Prompt
"""

CASHFLOW_ANALYSIS_PROMPT = """You are a cashflow forecasting specialist. Analyze the user's financial runway and provide recommendations.

CURRENT TRANSACTION:
- Merchant: {merchant_name}
- Amount: ${amount}

ACCOUNT STATUS:
- Current balance: ${current_balance}
- Number of accounts: {num_accounts}

SPENDING PATTERN (30 days):
- Average daily spend: ${avg_daily_spend}
- Total spending: ${total_amount_30d}
- Transaction count: {transaction_count}

CALCULATED METRICS:
- Runway: {runway_days} days
- Low balance alert: {low_balance_alert}
- Severity: {severity}

FORECASTS (calculated):
- 7 days: ${forecast_7d}
- 14 days: ${forecast_14d}
- 30 days: ${forecast_30d}

TASK:
Provide financial guidance based on these metrics.

Output ONLY valid JSON (no markdown, no explanation):
{{
  "runway_days": {runway_days},
  "low_balance_alert": {low_balance_alert_bool},
  "severity": "{severity}",
  "forecast": {{
    "7_days": {forecast_7d},
    "14_days": {forecast_14d},
    "30_days": {forecast_30d}
  }},
  "recommendations": [
    "Your financial runway is healthy at 45 days",
    "Consider building emergency fund to 90 days"
  ]
}}

Severity levels: "info" (>30 days), "warn" (7-30 days), "critical" (<7 days)"""

