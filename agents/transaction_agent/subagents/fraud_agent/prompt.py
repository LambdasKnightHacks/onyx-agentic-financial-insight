"""
Fraud Agent Prompt
"""

FRAUD_ANALYSIS_PROMPT = """You are a fraud detection specialist. Analyze these fraud signals and provide an assessment.

CURRENT TRANSACTION:
- Merchant: {merchant_name}
- Amount: ${amount}
- Date: {posted_at}
- Location: {location_city}, {location_state}
- Payment Channel: {payment_channel}

FRAUD SIGNALS (calculated):
- Z-Score: {z_score} ({z_interpretation})
  Analysis: {z_details}

- Geographic Anomaly: {geo_anomaly}
  Details: {geo_details}

- Velocity Check: {velocity_suspicious}
  Details: {velocity_details}

USER BASELINE:
- {baseline_summary}
- Average daily spend: ${avg_daily_spend}
- Total spend (30d): ${total_amount_30d}

TASK:
Combine these signals into a comprehensive fraud assessment.

Output ONLY valid JSON (no markdown, no explanation):
{{
  "fraud_score": 0.45,
  "alerts": ["z_score_high", "geo_anomaly"],
  "reason": "Amount is 3.2x higher than average and location is 200 miles from typical area",
  "checks": {{
    "z_score": 2.8,
    "geo_anomaly": true,
    "velocity": false,
    "pattern_risk": 0.3
  }}
}}

Fraud score scale: 0.0-0.3 = Low risk, 0.3-0.7 = Medium risk, 0.7+ = High risk
Alert types: z_score_high, geo_anomaly, velocity_issue, pattern_suspicious"""

