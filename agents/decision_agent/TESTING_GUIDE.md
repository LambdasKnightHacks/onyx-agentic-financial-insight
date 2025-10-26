# Financial Decision Analysis System - Testing Guide

## Prerequisites

### 1. Database Setup

Run the schema creation SQL:

```bash
# Connect to your Supabase instance
psql $DATABASE_URL -f refs/decision_analysis_schema.sql
```

### 2. Environment Variables

Ensure these are set:

```bash
GOOGLE_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_PROJECT=your-gcp-project
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
```

### 3. Start the Server

```bash
cd agents/
uvicorn main:app --reload
```

You should see: `✅ Decision analysis runner initialized`

---

## Testing Flow

### Step 1: Start Decision Analysis

**Request**:

```bash
curl -X POST http://localhost:8000/api/decisions/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "decision_type": "car_lease_vs_finance",
    "decision_inputs": {
      "lease_option": {
        "monthly_payment": 389,
        "down_payment": 2000,
        "lease_term_months": 36,
        "mileage_cap": 12000,
        "miles_per_year": 10000,
        "overage_fee_per_mile": 0.25,
        "acquisition_fee": 595,
        "disposition_fee": 395,
        "insurance_monthly": 120,
        "fuel_monthly": 80,
        "maintenance_monthly": 25,
        "registration_annual": 150
      },
      "finance_option": {
        "purchase_price": 32000,
        "down_payment": 3000,
        "apr": 0.049,
        "loan_term_months": 60,
        "insurance_monthly": 140,
        "fuel_monthly": 80,
        "maintenance_monthly": 50,
        "registration_annual": 150
      },
      "tenure_months": 36
    },
    "preferences": {
      "max_acceptable_payment": 500,
      "risk_tolerance": "medium"
    },
    "constraints": {
      "min_emergency_fund_months": 3
    }
  }'
```

**Response**:

```json
{
  "status": "started",
  "session_id": "uuid-here",
  "analysis_id": "uuid-here",
  "message": "Decision analysis started. Connect to WebSocket for real-time updates.",
  "websocket_url": "ws://localhost:8000/ws/decisions/{session_id}"
}
```

### Step 2: Connect WebSocket Client

**Python WebSocket Client**:

```python
import asyncio
import websockets
import json

async def test_decision_analysis(session_id):
    uri = f"ws://localhost:8000/ws/decisions/{session_id}"

    async with websockets.connect(uri) as websocket:
        print(f"✅ Connected to {uri}\n")

        while True:
            try:
                message = await websocket.recv()
                data = json.loads(message)

                event_type = data.get('type')
                event_data = data.get('data', {})

                if event_type == 'decision_analysis_started':
                    print(f"🚀 Analysis Started: {event_data.get('decision_type')}")
                    print(f"   Total steps: {event_data.get('total_steps')}\n")

                elif event_type == 'agent_started':
                    print(f"⚙️  Step {event_data.get('step')}/{event_data.get('total_steps')}: {event_data.get('agent_display_name')}")
                    print(f"   {event_data.get('description')}")
                    print(f"   Progress: {event_data.get('progress_pct')}%\n")

                elif event_type == 'agent_completed':
                    print(f"✅ {event_data.get('agent_display_name')} completed")
                    if event_data.get('summary'):
                        print(f"   {event_data.get('summary')}")
                    if event_data.get('key_insights'):
                        for insight in event_data.get('key_insights', []):
                            print(f"   • {insight}")
                    print()

                elif event_type == 'decision_analysis_complete':
                    print(f"\n🎉 Analysis Complete!")
                    print(f"   Processing time: {event_data.get('processing_time_seconds'):.2f}s")

                    result = event_data.get('result', {})
                    verdict = result.get('verdict', {})

                    print(f"\n📊 Recommendation: {verdict.get('recommended_option')}")
                    print(f"   Confidence: {verdict.get('confidence', 0)*100:.0f}%")
                    print(f"   Risk Level: {verdict.get('risk_level')}")
                    print(f"   Reasoning: {verdict.get('reasoning')}")

                    print(f"\n💾 Full result saved to file...")
                    with open(f"decision_result_{session_id}.json", "w") as f:
                        json.dump(result, f, indent=2)

                    break

                elif event_type == 'error':
                    print(f"❌ Error: {event_data.get('error_message')}")
                    break

            except websockets.exceptions.ConnectionClosed:
                print("Connection closed")
                break

# Usage
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python test_websocket.py <session_id>")
        sys.exit(1)

    session_id = sys.argv[1]
    asyncio.run(test_decision_analysis(session_id))
```

**Save as**: `agents/testing/test_decision_websocket.py`

**Run**:

```bash
python agents/testing/test_decision_websocket.py <session_id_from_api_response>
```

### Step 3: Verify Database Records

```sql
-- Check analysis record
SELECT id, decision_type, status, processing_time_seconds, created_at
FROM decision_analyses
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;

-- Check options generated
SELECT option_name, tco_expected, monthly_payment, liquidity_score
FROM decision_options
WHERE analysis_id = 'YOUR_ANALYSIS_ID';

-- Check budget recommendations
SELECT category, subcategory, monthly_impact, reasoning
FROM decision_recommendations
WHERE analysis_id = 'YOUR_ANALYSIS_ID';

-- Check agent execution times
SELECT agent_name, status, processing_time_ms
FROM decision_agent_runs
WHERE analysis_id = 'YOUR_ANALYSIS_ID'
ORDER BY started_at;
```

### Step 4: Query Analysis History

```bash
curl http://localhost:8000/api/decisions/history/YOUR_USER_ID
```

### Step 5: Get Specific Analysis

```bash
curl http://localhost:8000/api/decisions/YOUR_ANALYSIS_ID
```

---

## Expected WebSocket Event Sequence

```
1. decision_analysis_started (Step 0/7)
2. agent_started: data_fusion_agent (Step 1/7, 0%)
3. agent_completed: data_fusion_agent
4. agent_started: tco_calculator_agent (Step 2/7, 14%)
5. agent_completed: tco_calculator_agent
6. agent_started: risk_liquidity_agent (Step 3/7, 28%)
7. agent_completed: risk_liquidity_agent
8. agent_started: credit_impact_agent (Step 4/7, 42%)
9. agent_completed: credit_impact_agent
10. agent_started: opportunity_cost_agent (Step 5/7, 57%)
11. agent_completed: opportunity_cost_agent
12. agent_started: behavioral_coach_agent (Step 6/7, 71%)
13. agent_completed: behavioral_coach_agent
14. agent_started: synthesis_agent (Step 7/7, 85%)
15. agent_completed: synthesis_agent
16. decision_analysis_complete (100% + Full JSON)
```

---

## Troubleshooting

### Issue: "Decision runner not initialized"

**Solution**: Make sure the server started properly. Check logs for:

```
✅ Decision analysis runner initialized
```

If not present, check:

- WebSocket manager is initialized
- No import errors in decision_agent module

### Issue: "Missing user profile or TCO results"

**Solution**: Ensure the user has:

- At least one account with a balance
- Transaction history in the database
- User record exists in `users` table

### Issue: Analysis stays in "processing" status

**Solution**:

- Check server logs for exceptions
- Verify all agents are completing (check `decision_agent_runs` table)
- Ensure Gemini API key is valid (for Behavioral Coach and Synthesis agents)

### Issue: WebSocket connection fails

**Solution**:

- Verify WebSocket URL format: `ws://localhost:8000/ws/decisions/{session_id}`
- Check CORS settings in FastAPI
- Ensure session_id matches the one from API response

---

## Performance Benchmarks

Expected timings (with real user data):

| Agent            | Expected Time |
| ---------------- | ------------- |
| Data Fusion      | 0.5 - 1.5s    |
| TCO Calculator   | 0.1 - 0.3s    |
| Risk & Liquidity | 0.3 - 0.5s    |
| Credit Impact    | 0.1 - 0.2s    |
| Opportunity Cost | 0.1 - 0.2s    |
| Behavioral Coach | 2 - 4s (LLM)  |
| Synthesis        | 2 - 4s (LLM)  |
| **Total**        | **5 - 11s**   |

---

## Sample Test Data

If you don't have a user with sufficient data, create test data:

```python
# Run this to populate test data
python agents/testing/populate_transactions.py
```

---

## Integration Test Script

**File**: `agents/testing/test_decision_analysis_full.py`

```python
import asyncio
import requests
import websockets
import json
from datetime import datetime

async def full_integration_test(user_id: str):
    """Complete end-to-end test of decision analysis system"""

    print("=" * 60)
    print("Financial Decision Analysis - Integration Test")
    print("=" * 60)

    # Step 1: Start analysis
    print("\n1️⃣  Starting analysis...")

    response = requests.post(
        "http://localhost:8000/api/decisions/analyze",
        json={
            "user_id": user_id,
            "decision_type": "car_lease_vs_finance",
            "decision_inputs": {
                "lease_option": {
                    "monthly_payment": 389,
                    "down_payment": 2000,
                    "lease_term_months": 36,
                    "mileage_cap": 12000,
                    "miles_per_year": 10000,
                    "overage_fee_per_mile": 0.25,
                    "acquisition_fee": 595,
                    "disposition_fee": 395,
                    "insurance_monthly": 120,
                    "fuel_monthly": 80,
                    "maintenance_monthly": 25,
                    "registration_annual": 150
                },
                "finance_option": {
                    "purchase_price": 32000,
                    "down_payment": 3000,
                    "apr": 0.049,
                    "loan_term_months": 60,
                    "insurance_monthly": 140,
                    "fuel_monthly": 80,
                    "maintenance_monthly": 50,
                    "registration_annual": 150
                },
                "tenure_months": 36
            }
        }
    )

    if response.status_code != 200:
        print(f"❌ Failed to start analysis: {response.text}")
        return

    data = response.json()
    session_id = data["session_id"]
    analysis_id = data["analysis_id"]

    print(f"✅ Analysis started")
    print(f"   Session ID: {session_id}")
    print(f"   Analysis ID: {analysis_id}")

    # Step 2: Connect WebSocket and monitor
    print(f"\n2️⃣  Connecting to WebSocket...")

    uri = f"ws://localhost:8000/ws/decisions/{session_id}"

    async with websockets.connect(uri) as websocket:
        print(f"✅ Connected to {uri}")

        start_time = datetime.now()

        while True:
            message = await websocket.recv()
            event = json.loads(message)

            if event["type"] == "decision_analysis_complete":
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()

                print(f"\n3️⃣  Analysis Complete!")
                print(f"   Duration: {duration:.2f}s")

                result = event["data"]["result"]
                verdict = result["verdict"]

                print(f"\n4️⃣  Results:")
                print(f"   Recommendation: {verdict['recommended_option']}")
                print(f"   Confidence: {verdict['confidence']*100:.0f}%")
                print(f"   Risk Level: {verdict['risk_level']}")

                # Save result
                with open(f"test_result_{analysis_id}.json", "w") as f:
                    json.dump(result, f, indent=2)

                print(f"\n✅ Full result saved to: test_result_{analysis_id}.json")
                break

    # Step 3: Verify database
    print(f"\n5️⃣  Verifying database records...")

    response = requests.get(f"http://localhost:8000/api/decisions/{analysis_id}")
    if response.status_code == 200:
        print(f"✅ Analysis record found in database")
    else:
        print(f"❌ Analysis record not found")

    print(f"\n{'=' * 60}")
    print("✅ Integration test complete!")
    print(f"{'=' * 60}\n")

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python test_decision_analysis_full.py <user_id>")
        sys.exit(1)

    user_id = sys.argv[1]
    asyncio.run(full_integration_test(user_id))
```

**Run**:

```bash
python agents/testing/test_decision_analysis_full.py YOUR_USER_ID
```

---

## Success Criteria

✅ **API Response**:

- Returns 200 status
- Includes `session_id` and `analysis_id`
- Returns within 100ms

✅ **WebSocket Streaming**:

- Connects successfully
- Receives 16 events (7 started + 7 completed + 1 started + 1 complete)
- Events arrive in correct order
- Progress percentages increase correctly

✅ **Database Persistence**:

- `decision_analyses` record created with status "completed"
- `decision_options` records created (2+ options)
- `decision_recommendations` records created (if applicable)
- `decision_agent_runs` records show all 7 agents completed

✅ **Output Quality**:

- JSON structure matches schema
- TCO calculations are realistic
- Budget recommendations are specific and actionable
- Verdict includes clear reasoning

✅ **Performance**:

- Total processing time < 15 seconds
- Each agent completes within expected time
- No timeout errors

---

## Next Steps After Testing

Once Phase 3 is validated:

1. **Phase 4: Frontend UI**

   - Decision Wizard component
   - Real-time progress display
   - Results dashboard
   - Budget recommendation cards

2. **Production Readiness**
   - Add retry logic for failed analyses
   - Implement rate limiting
   - Add comprehensive logging
   - Create monitoring dashboards
   - Write unit tests for each agent
