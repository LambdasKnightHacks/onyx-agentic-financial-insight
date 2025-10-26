# Visual Architecture Diagrams for Hackathon

## 1. Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Chat UI       │  │  Decision UI    │  │ Financial Sum   │  │
│  │  - Messages    │  │  - Options      │  │  - Overview     │  │
│  │  - Charts      │  │  - Results      │  │  - Risks        │  │
│  │  - Visualiz.   │  │  - Comparison   │  │  - Actions      │  │
│  └───────┬────────┘  └────────┬────────┘  └────────┬──────────┘  │
│          │                    │                    │             │
└──────────┼────────────────────┼────────────────────┼─────────────┘
           │                    │                    │
           │ HTTP/WebSocket    │ HTTP/WebSocket     │ HTTP
           │                    │                    │
┌──────────┼────────────────────┼────────────────────┼─────────────┐
│          ↓                    ↓                    ↓             │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ FastAPI (main)│  │ FastAPI      │  │ Financial Summary│   │
│  │               │  │ (decisions)  │  │ Generator        │   │
│  └───────┬───────┘  └──────┬───────┘  └────────┬───────────┘   │
│          │                  │                   │               │
└──────────┼──────────────────┼───────────────────┼───────────────┘
           │                  │                   │
           ↓                  ↓                   ↓
┌──────────┴────────────────────────────────────────────────────┐
│                    AGENTIC LAYER (Google ADK)                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ Chat Agent     │  │ Decision Agent │  │ Transaction    │  │
│  │                │  │ (7 sub-agents)│  │ Agent (10 sub) │  │
│  │ - 14 DB tools  │  │                │  │                │  │
│  │ - 14 Viz tools│  │ ┌────────────┐ │  │ ┌────────────┐ │  │
│  │ - User-scoped │  │ │Data Fusion │ │  │ │Init        │ │  │
│  │                │  │ │TCO Calc    │ │  │ │Categorize  │ │  │
│  │                │  │ │Risk/Liquid │ │  │ │Fraud       │ │  │
│  │                │  │ │Credit      │ │  │ │Budget      │ │  │
│  │                │  │ │Opportunity │ │  │ │Cashflow    │ │  │
│  │                │  │ │Behavioral  │ │  │ │Consensus   │ │  │
│  │                │  │ │Synthesis  │ │  │ │Reducer     │ │  │
│  │                │  │ └────────────┘ │  │ │Synthesizer │ │  │
│  └────────┬───────┘  └────────┬───────┘  │ └────────────┘ │  │
│           │                   │           │                │  │
└───────────┼───────────────────┼───────────┼────────────────┘
            │                   │           │
            │         WebSocket │           │
            │         Events    │           │
            ↓                   ↓           ↓
┌───────────┴─────────────────────────────────────────────────┐
│                     DATABASE (Supabase)                      │
│  ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────┐ │
│  │transactions│ │  budgets  │ │ alerts   │ │  insights   │ │
│  │            │ │           │ │          │ │             │ │
│  │ accounts   │ │ account_  │ │ feedback │ │ financial_  │ │
│  │            │ │ balances  │ │          │ │ summaries   │ │
│  └───────────┘ └───────────┘ └──────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Chat Agent Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    USER QUERY                              │
│         "Where is my money going?"                        │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ↓
            ┌────────────────┐
            │  Chat Agent     │
            │  (User-scoped)  │
            └────────┬─────────┘
                     │
                     ↓
        ┌────────────┴────────────┐
        │   LLM Decision          │
        │  "Visualization needed" │
        └────────────┬────────────┘
                     │
                     ↓
        ┌─────────────────────────┐
        │  Tool Execution          │
        │  get_spending_by_cat()  │
        │  ↓                       │
        │  generate_sankey()       │
        └────────────┬─────────────┘
                     │
                     ↓
        ┌─────────────────────────┐
        │  Interpretation         │
        │  - What it shows         │
        │  - Key insights           │
        │  - Actionable advice      │
        └────────────┬─────────────┘
                     │
                     ↓
            ┌────────────────┐
            │   RESPONSE     │
            │  Text + Charts │
            └────────────────┘
```

---

## 3. Decision Agent Pipeline Flow

```
INPUT: Car lease vs finance decision
       ↓
┌─────────────────────────────────────────────────────────┐
│  Agent 1: Data Fusion                                    │
│  - Fetch 90d transactions                               │
│  - Load budgets, balances                               │
│  - Calculate income/expenses                            │
│  → Financial profile                                     │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Agent 2: TCO Calculator                                │
│  - Option A: Lease $389/mo + fees                      │
│  - Option B: Finance $520/mo                            │
│  → TCO breakdown                                        │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Agent 3: Risk & Liquidity                              │
│  - Calculate runway impact                               │
│  - Run stress tests                                     │
│  → Risk assessment                                       │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Agent 4: Credit Impact                                 │
│  - Simulate DTI change                                  │
│  - Estimate credit impact                               │
│  → Credit assessment                                     │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Agent 5: Opportunity Cost                              │
│  - Invest $3000 instead?                                │
│  - Lost returns analysis                                │
│  → Opportunity analysis                                  │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Agent 6: Behavioral Coach                              │
│  - Which budgets to adjust?                             │
│  - How much? Where to cut?                             │
│  → Budget recommendations                                │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Agent 7: Synthesis                                      │
│  - Combine all results                                  │
│  - LLM verdict + reasoning                              │
│  - Comparison matrix                                    │
│  → Final recommendation                                  │
└──────────────────────┬──────────────────────────────────┘
                       ↓
              ┌─────────────────┐
              │   OUTPUT        │
              │ Recommendation │
              │ + Risks         │
              │ + Actions       │
              └─────────────────┘
```

---

## 4. Transaction Analysis Pipeline

```
NEW TRANSACTION (from Plaid)
       ↓
┌────────────────────────────────┐
│  Init Agent                     │
│  - Deduplication check         │
│  - Load user context           │
│  - Create run record           │
└────────────────┬───────────────┘
                 ↓
┌────────────────────────────────────────┐
│  Parallel Agent Pipeline               │
│                                        │
│  ┌────────────────┐ ┌──────────────┐ │
│  │Categorization  │ │ Fraud Agent  │ │
│  │- Parse merchant │ │- Z-score     │ │
│  │- Match pattern │ │- Velocity    │ │
│  │- Confidence    │ │- Geo anomaly │ │
│  └────────┬───────┘ └──────┬───────┘ │
│           │                │          │
│  ┌────────┴───────┐ ┌──────┴──────┐ │
│  │Budget Agent    │ │Cashflow    │ │
│  │- Check limits  │ │- Runway    │ │
│  │- Calculate %   │ │- Projection│ │
│  └────────┬───────┘ └──────┬─────┘ │
└───────────┼────────────────┼───────┘
            ↓                ↓
    ┌───────────────┐
    │ Consensus     │
    │ (A2A verify)  │
    └───────┬───────┘
            ↓
    ┌───────────────┐
    │ Reducer       │
    │ (merge)       │
    └───────┬───────┘
            ↓
    ┌───────────────┐
    │ Synthesizer   │
    │ (generate)    │
    └───────┬───────┘
            ↓
    ┌───────────────┐
    │ Database Agent│
    │ (store)       │
    └───────┬───────┘
            ↓
    ┌───────────────┐
    │ Final Insight │
    └───────────────┘
```

---

## 5. WebSocket Event Flow

```
CLIENT                            SERVER
─────────────────────────────────────────────────
│                                             │
│  Connect to WebSocket                       │
├─────────────────────────────────────────────►│
│                                             │
│  Send Transaction                           │
├─────────────────────────────────────────────►│
│                                             │
│                           analysis_started  │
│◄────────────────────────────────────────────┤
│                                             │
│                           agent_started    │
│◄────────────────────────────────────────────┤
│     (categorization_agent)                 │
│                                             │
│                    agent_completed          │
│◄────────────────────────────────────────────┤
│     {category, confidence, subcategory}    │
│                                             │
│                           agent_started     │
│◄────────────────────────────────────────────┤
│     (fraud_agent)                          │
│                                             │
│                    agent_completed          │
│◄────────────────────────────────────────────┤
│     {fraud_score, alerts}                  │
│                                             │
│      [Continue for budget, cashflow...]     │
│                                             │
│                    analysis_complete        │
│◄────────────────────────────────────────────┤
│     {final_insight, run_id, insights_id}   │
│                                             │
```

---

## 6. Financial Summary Data Flow

```
API Request: POST /api/financial-summary/generate
       ↓
┌──────────────────┐
│ Check Cache      │
│ (6-hour TTL)     │
└──────┬───────────┘
       │
       ↓ Not cached?
┌──────────────────────────────────────────┐
│ Data Fetching (Parallel)                │
│                                          │
│  ┌────────────┐  ┌──────────────┐      │
│  │ Trans-     │  │ Budgets      │      │
│  │ actions    │  │ Accounts     │      │
│  └─────┬──────┘  └──────┬───────┘      │
│        │                │              │
│  ┌─────┴──────┐  ┌──────┴───────┐      │
│  │ Alerts     │  │ Insights     │      │
│  │ Account    │  │              │      │
│  │ balances   │  │              │      │
│  └────────────┘  └──────────────┘      │
└────────────┬────────────────────────────┘
             ↓
┌──────────────────────────────────────────┐
│ Calculation Engine                       │
│  - Income vs Expenses                    │
│  - Category breakdown                    │
│  - Budget progress                       │
│  - Spending trends                       │
│  - Runway days                           │
└────────────┬─────────────────────────────┘
             ↓
┌──────────────────────────────────────────┐
│ Intelligence Layer                       │
│  - Risk identification                   │
│  - Next best actions                     │
│  - Micro lesson (educational)            │
│  - Wins (celebrations)                   │
└────────────┬─────────────────────────────┘
             ↓
┌──────────────────────────────────────────┐
│ Storage & Response                       │
│  - Store in database                     │
│  - Return JSON summary                   │
└──────────────────────────────────────────┘
```

---

## 7. Security Model

```
┌────────────────────────────────────────────────┐
│          USER AUTHENTICATION                   │
│  (JWT token, session_id)                       │
└────────────────────┬───────────────────────────┘
                     │
                     ↓
┌────────────────────────────────────────────────┐
│       create_user_agent(user_id)               │
│                                                 │
│  UserContextWrapper(user_id)                   │
│       ↓                                         │
│  Wrap all tools with user context              │
│       ↓                                         │
│  Base tools become user-scoped:                │
│  - get_transactions(user_id)                  │
│  - get_budgets(user_id)                        │
│  - get_balances(user_id)                       │
│                                                 │
│  LLM CANNOT specify different user_id          │
└────────────────────────────────────────────────┘
```

---

## 8. Chat Agent Tool Architecture

```
CHAT AGENT (Google ADK Agent)
├─ USER_ID: Auto-injected via wrapper
├─ TOOLS (28 total):
│  ├─ DATABASE TOOLS (14):
│  │  ├─ get_recent_alerts()
│  │  ├─ get_recent_insights()
│  │  ├─ get_recent_transactions()
│  │  ├─ get_account_balances()
│  │  ├─ get_spending_by_category()
│  │  ├─ get_budget_status()
│  │  ├─ get_cashflow_summary()
│  │  ├─ update_budget()
│  │  ├─ create_budget()
│  │  ├─ resolve_alert()
│  │  ├─ [4 more...]
│  │
│  └─ VISUALIZATION TOOLS (14):
│     ├─ generate_cashflow_projection_chart()
│     ├─ generate_money_flow_sankey()
│     ├─ generate_category_drift_chart()
│     ├─ generate_top_merchants_pareto()
│     ├─ generate_spending_heatmap()
│     ├─ generate_subscription_analysis()
│     ├─ generate_budget_scenario_chart()
│     ├─ generate_budget_pace_chart()
│     ├─ generate_category_volatility_scatter()
│     ├─ generate_budget_breach_curve()
│     ├─ generate_budget_manager()
│     ├─ generate_income_expense_comparison()
│     ├─ generate_subcategory_comparison()
│     └─ [1 more...]
│
└─ INSTRUCTION: User-facing financial assistant with
   educational focus, proactive visualization,
   automatic interpretation of results
```

---

## 9. Decision Agent WebSocket Communication

```
┌──────────────────────────────────────────────────┐
│  CLIENT                                           │
│                                                   │
│  1. POST /api/decisions/analyze                   │
│     {decision_type, decision_inputs}             │
│         ↓                                         │
│  2. Receive session_id + websocket_url           │
│         ↓                                         │
│  3. Connect: ws://decisions/{session_id}         │
│                                                   │
└──────────────────────────────────────────────────┘
              ↓              ↓
    ┌────────┴────────────────┴──────┐
    │                                │
HTTP Request                  WebSocket Stream
    │                                │
    └────────────────┬───────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│  SERVER                                           │
│                                                   │
│  Background Task:                                │
│  ├─ agent_started (Data Fusion)                  │
│  ├─ agent_completed (Data Fusion)               │
│  ├─ agent_started (TCO Calculator)               │
│  ├─ agent_completed (TCO Calculator)             │
│  ├─ ... [continue for all 7 agents]             │
│  └─ analysis_complete (final verdict)            │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## 10. Complete Data Flow Example: "Where is my money going?"

```
┌────────────────────────────────────────────────────────┐
│ USER INPUT: "Where is my money going?"                │
└────────────────────────┬───────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│ Chat Agent (LLM Decision)                          │
│  - "This requires spending data"                   │
│  - "Visualization would be helpful"                │
└──────────────────┬─────────────────────────────────┘
                   ↓
┌────────────────────────────────────────────────────┐
│ Tool Execution:                                     │
│                                                     │
│  1. get_spending_by_category(user_id)              │
│     → Query Supabase                               │
│     → Return: {dining: 420, rent: 480, ...}        │
│                                                     │
│  2. generate_money_flow_sankey(user_id)            │
│     → Fetch transaction details                    │
│     → Calculate flows (income → cats → merchants) │
│     → Generate Plotly JSON                         │
└──────────────────┬─────────────────────────────────┘
                   ↓
┌────────────────────────────────────────────────────┐
│ LLM Interpretation                                  │
│                                                     │
│  "Your Money Flow for October 2025"                │
│                                                     │
│  📊 What This Shows:                               │
│  - Dining represents 35% ($420)                   │
│  - Top merchants: Chipotle, DoorDash              │
│                                                     │
│  🔍 Key Insights:                                  │
│  - Higher than typical 25% benchmark              │
│                                                     │
│  ✅ Action Steps:                                  │
│  - Meal prep 2-3x/week saves $150/mo             │
│  - Set $300 dining budget                         │
└──────────────────┬─────────────────────────────────┘
                   ↓
┌────────────────────────────────────────────────────┐
│ RESPONSE (JSON)                                     │
│  {                                                 │
│    message: "...interpretation...",               │
│    charts: [{                                      │
│      chart_type: "sankey",                        │
│      data: {flows: [...]},                        │
│      layout: {...}                                 │
│    }]                                              │
│  }                                                  │
└────────────────────────────────────────────────────┘
```

These diagrams can be used for:

- Presentation slides
- Architectural documentation
- Team onboarding
- Investor pitch deck
- Technical blog posts
