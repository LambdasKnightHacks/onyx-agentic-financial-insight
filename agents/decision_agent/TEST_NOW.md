# ✅ Phase 3 Testing - Quick Start Guide

## Prerequisites

✅ Database schema created (5 tables)  
✅ Environment variables set (GOOGLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY)  
✅ User with financial data in database

## Step-by-Step Testing

### Step 1: Create Database Schema (if not done yet)

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Copy entire contents from: refs/decision_analysis_schema.sql
```

Or via command line:

```bash
psql "$SUPABASE_URL" -f refs/decision_analysis_schema.sql
```

### Step 2: Find a Test User

```bash
cd agents/testing
python check_test_users.py
```

This will show users with accounts, transactions, and balances. **Copy a user ID** that says "GOOD FOR TESTING".

### Step 3: Start the FastAPI Server

Open a **new terminal** and run:

```bash
cd agents
uvicorn main:app --reload
```

Wait for:

```
✅ Decision analysis runner initialized
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 4: Start the Analysis

Open **another terminal** and run:

```bash
cd agents/testing
./test_decision_api.sh <YOUR_USER_ID>
```

Replace `<YOUR_USER_ID>` with the ID from Step 2.

This will:

- ✅ Send POST request to `/api/decisions/analyze`
- ✅ Return session_id and analysis_id
- ✅ Show you the WebSocket command

### Step 5: Monitor Real-Time Progress

Copy the command from Step 4 output (it will look like):

```bash
python agents/testing/test_decision_websocket.py <session_id>
```

You should see:

```
🚀 Analysis Started: Car Lease Vs Finance
⚙️  Step 1/7 (0%): Analyzing Financial Profile
   ✅ Analyzing Financial Profile completed
⚙️  Step 2/7 (14%): Calculating Total Cost of Ownership
   ✅ Calculating Total Cost of Ownership completed
... (continues for all 7 agents)
🎉 Analysis Complete!
```

### Step 6: Verify Results

The WebSocket client will:

- ✅ Display the recommendation
- ✅ Show options comparison
- ✅ List budget recommendations
- ✅ Save full JSON to `decision_result_<session_id>.json`

### Step 7: Check Database

```sql
-- Check analysis record
SELECT * FROM decision_analyses ORDER BY created_at DESC LIMIT 1;

-- Check options
SELECT option_name, tco_expected, monthly_payment
FROM decision_options
WHERE analysis_id = '<your_analysis_id>';

-- Check agent runs
SELECT agent_name, status, processing_time_ms
FROM decision_agent_runs
WHERE analysis_id = '<your_analysis_id>'
ORDER BY started_at;
```

---

## Expected Results

### ✅ API Response (Step 4)

```json
{
  "status": "started",
  "session_id": "uuid-here",
  "analysis_id": "uuid-here",
  "message": "Decision analysis started. Connect to WebSocket for real-time updates.",
  "websocket_url": "ws://localhost:8000/ws/decisions/{session_id}"
}
```

### ✅ WebSocket Events (Step 5)

You should see **16 events**:

1. `decision_analysis_started` (1x)
2. `agent_started` (7x) - One for each agent
3. `agent_completed` (7x) - One for each agent
4. `decision_analysis_complete` (1x) - Final results

### ✅ Final Output

```
📊 RECOMMENDATION
   Option: Finance
   Confidence: 78%
   Risk Level: LOW
   Reasoning: Financing saves $2,130 over 36 months with acceptable risk

💰 OPTIONS COMPARISON
⭐ Finance:
      TCO: $28,750.00
      Monthly: $465.00
      Liquidity: 0.72

   Lease:
      TCO: $30,880.00
      Monthly: $389.00
      Liquidity: 0.76

💡 BUDGET RECOMMENDATIONS
   1. Skip 2 restaurant meals per month
      Saves: $95.00/month
   2. Pause 1 streaming subscription
      Saves: $14.99/month
   ...

✅ NEXT STEPS
   1. Get preapproval from 2-3 lenders
   2. Compare insurance quotes
   ...
```

---

## Troubleshooting

### ❌ "Decision runner not initialized"

**Solution**: Check server logs. Make sure you see:

```
✅ Decision analysis runner initialized
```

If not, check for import errors in decision_agent module.

### ❌ "Connection refused" on WebSocket

**Solution**:

- Make sure FastAPI server is running (`uvicorn main:app --reload`)
- Check that port 8000 is not blocked
- Verify session_id is correct

### ❌ Analysis stays in "processing"

**Solution**:

- Check server logs for errors
- Verify GOOGLE_API_KEY is set (needed for LLM agents)
- Check database tables exist

### ❌ "Missing user profile"

**Solution**:

- User needs at least 1 account with balance
- User needs some transaction history
- Run `python check_test_users.py` to verify

---

## Performance Benchmarks

Expected timing (with real data):

| Step      | Agent            | Expected Time |
| --------- | ---------------- | ------------- |
| 1/7       | Data Fusion      | 0.5 - 1.5s    |
| 2/7       | TCO Calculator   | 0.1 - 0.3s    |
| 3/7       | Risk & Liquidity | 0.3 - 0.5s    |
| 4/7       | Credit Impact    | 0.1 - 0.2s    |
| 5/7       | Opportunity Cost | 0.1 - 0.2s    |
| 6/7       | Behavioral Coach | 2 - 4s (LLM)  |
| 7/7       | Synthesis        | 2 - 4s (LLM)  |
| **TOTAL** | **All Agents**   | **5 - 11s**   |

---

## What's Being Tested

✅ **Backend API**

- POST `/api/decisions/analyze` - Starts analysis
- Returns session_id immediately
- Creates database records

✅ **WebSocket Streaming**

- Real-time event streaming
- 7 agents broadcasting progress
- ChatGPT-style thinking display

✅ **Multi-Agent Pipeline**

- 7 specialized agents running sequentially
- Each agent adds to session state
- Final synthesis combines all outputs

✅ **Database Persistence**

- Analysis records
- Options comparison
- Budget recommendations
- Agent execution tracking

✅ **JSON Output**

- Complete decision analysis
- Formatted for frontend consumption
- Includes charts data, recommendations, action items

---

## Next: Phase 4 (Frontend UI)

Once Phase 3 testing is successful, we'll build:

1. **Decision Wizard** - Beautiful multi-step form
2. **Real-Time Progress UI** - ChatGPT-style thinking display
3. **Results Dashboard** - Interactive charts and comparisons
4. **Budget Recommendations UI** - Apply with one click

---

**Questions? Issues? Let me know!** 🚀
