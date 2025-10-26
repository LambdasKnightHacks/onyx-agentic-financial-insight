# Hackathon Presentation: FinFlow AI Agentic Financial Platform

## Overview

FinFlow AI is a comprehensive financial intelligence platform powered by multiple specialized AI agents that work together to analyze transactions, provide financial insights, make personalized recommendations, and offer educational guidance.

---

## 🎯 Core Agentic Systems

### 1. **Chat Agent** - Conversational Financial Assistant

**Purpose:** Natural language interface for financial queries and general assistance

**Architecture:**

```
User Query → Chat Agent → [Tool Selection] → Database Queries / Visualizations → Response
```

**Key Features:**

- **Dual-purpose**: Financial queries AND general assistance
- **Smart tool selection**: Automatically queries database or generates visualizations
- **14 database tools**: Transaction history, budgets, alerts, cashflow
- **14 visualization tools**: Charts, graphs, heatmaps, projections
- **Proactive visualization**: Never asks permission - generates charts immediately when helpful
- **Educational**: Explains data, provides context, teaches financial concepts
- **User-scoped security**: All tools automatically use authenticated user_id

**Example Interaction:**

```
User: "Where is my money going?"
Agent: [Queries spending data] → [Generates Sankey diagram]
→ "Your top category is Dining at 35% ($420).
Top merchants: Chipotle, DoorDash... [interpretation and recommendations]"
```

**Tools Available:**

- Database: Alerts, insights, transactions, balances, spending, budgets
- Visualization: Cashflow projection, money flow Sankey, category drift, merchant analysis, heatmaps, subscription detection, budget scenarios

---

### 2. **Decision Agent** - Multi-Agent Financial Decision Analysis

**Purpose:** Comprehensive analysis for major financial decisions (e.g., car lease vs finance)

**Architecture:**

```
Decision Request → SequentialAgent → [7 Sub-Agents in Sequence]
```

**7-Agent Pipeline:**

1. **Data Fusion Agent** - Enriches context

   - Fetches 90 days of transaction history
   - Loads active budgets
   - Computes income/expense patterns
   - Calculates behavioral metrics (elasticity, payment patterns)
   - Packages complete financial profile

2. **TCO Calculator Agent** - Total Cost of Ownership

   - Calculates TCO for each option
   - Breaks down: down payment, interest, fees, insurance, maintenance
   - Computes monthly equivalents
   - Uses specialized calculators (car, home, travel)

3. **Risk & Liquidity Agent** - Financial risk assessment

   - Analyzes debt-to-income (DTI) impact
   - Calculates runway days before/after decision
   - Runs stress tests (income drops, expense spikes)
   - Assesses liquidity adequacy
   - Evaluates emergency fund coverage

4. **Credit Impact Agent** - Credit score simulation

   - Estimates credit score impact
   - Models DTI change
   - Predicts credit usage impact
   - Provides risk ranges

5. **Opportunity Cost Agent** - Alternative uses analysis

   - Compares other uses for the money
   - Calculates lost returns if invested instead
   - Evaluates other purchases/trade-offs

6. **Behavioral Coach Agent** - Budget recommendations

   - Generates budget rebalancing suggestions
   - Identifies which categories to adjust
   - Provides actionable budget modifications
   - Creates detailed recommendations

7. **Synthesis Agent** - Final verdict
   - Combines all agent outputs
   - LLM-powered recommendation with reasoning
   - Builds comparison matrix
   - Assesses overall risk
   - Compiles options with full metadata
   - Generates action checklist

**Output Structure:**

- Verdict: Recommended option with confidence and reasoning
- Options: Complete TCO, risk, credit impact for each
- Comparison matrix: Winners by different metrics
- Risk assessment: DTI, runway, stress tests
- Budget rebalancing: Specific recommendations
- Financial impact: Current vs new expenses

---

### 3. **Financial Summary Generator** - Comprehensive Financial Health Report

**Purpose:** Generate holistic financial overview with educational insights

**Data Aggregation:**

```python
1. Fetch Transactions (30-90 days)
2. Fetch Budgets & Account Balances
3. Calculate Core Metrics:
   - Income vs Expenses
   - Net cash flow
   - Category breakdown & trends
   - Budget progress
   - Runway days
4. Identify Risks (non-fraud)
5. Generate Next Best Actions
6. Create Micro Lesson
7. Celebrate Wins
```

**Output Sections:**

**Financial Overview:**

- Total income/expenses/net flow
- Daily averages
- Savings rate

**Spending Breakdown:**

- Top 5 categories with percentages
- Category diversity score

**Spending Trends:**

- Direction (increasing/decreasing)
- Change percentage
- Interpretation

**Budget Progress:**

- Total budgets / on track / warning / breached
- Health score
- Detailed per-category status

**Balance & Cashflow:**

- Current/available balance
- Runway days calculation
- Health rating

**Risks:**

- Low cash reserve alerts
- Budget breaches
- Critical alerts

**Next Best Actions:**

- Prioritized recommendations
- Why each matters
- Estimated impact
- Specific choices/actions

**Micro Lesson:**

- Educational content based on user's patterns
- Explains financial concepts
- Provides context from user's own data

**Wins:**

- Achievements to celebrate
- Positive patterns recognized

**Output Example:**

```json
{
  "period": {"days": 30, "start_date": "2024-01-01"},
  "financial_overview": {
    "total_income": 3500.00,
    "total_expenses": 2800.00,
    "net_flow": 700.00
  },
  "risks": [
    {
      "type": "low_cashflow",
      "severity": "warn",
      "title": "Low Cash Reserve",
      "description": "At current spending rate, funds may deplete in ~45 days"
    }
  ],
  "next_best_actions": [...],
  "micro_lesson": {
    "title": "Understanding Net Cash Flow",
    "content": "Your positive cash flow means you're building wealth..."
  },
  "wins": [...]
}
```

---

### 4. **WebSocket Infrastructure** - Real-Time Event Streaming

**Purpose:** Real-time updates for transaction analysis and decision analysis

**Architecture:**

```
Agent Execution → WebSocketManager → EventPublisher → WebSocketClient
```

**Components:**

1. **WebSocketManager** (`websocket/manager.py`)

   - Manages active connections by user_id
   - Tracks session states
   - Routes messages to specific sessions
   - Handles connection lifecycle
   - Stores analysis sessions

2. **WebSocketEventPublisher** (`websocket/publisher.py`)

   - Publishes agent lifecycle events
   - Formats results for UI
   - Streams progress updates

3. **AgentResultExtractor** (`websocket/extractor.py`)
   - Extracts agent-specific results
   - Formats for UI display
   - Handles error cases gracefully

**Event Types:**

- `analysis_started` - Analysis beginning
- `agent_started` - Individual agent started processing
- `agent_completed` - Agent finished with results
- `analysis_complete` - Full pipeline complete
- `error` - Error during processing

**Example Flow:**

```
Client connects → ws://transaction/analyze
↓
Transaction sent → analysis_started
↓
Categorization agent → agent_started (categorization_agent)
↓
Category result → agent_completed (categorization_agent) with UI data
↓
Fraud agent → agent_started (fraud_agent)
↓
Fraud result → agent_completed (fraud_agent) with UI data
↓
[Repeat for budget, cashflow, synthesizer agents]
↓
Full analysis → analysis_complete with final insights
```

**UI Data Format:**

```json
{
  "type": "agent_completed",
  "data": {
    "agent_name": "categorization_agent",
    "status": "completed",
    "message": "Categorized as dining/restaurants",
    "ui_data": {
      "category": "dining",
      "subcategory": "restaurants",
      "confidence": 0.95,
      "confidence_percentage": "95.0%",
      "color": "green"
    }
  }
}
```

**Endpoints:**

- `ws://transaction/analyze` - Real-time transaction analysis
- `ws://chat/{user_id}` - Real-time chat with financial AI
- `ws://decisions/{session_id}` - Real-time decision analysis

---

## 🔄 System Integration Flow

### Transaction Analysis Flow:

```
New Transaction → POST /api/transaction/analyze
                 ↓
            Init Agent (deduplication, context loading)
                 ↓
        Parallel Agent Pipeline:
            ├─ Categorization Agent
            ├─ Fraud Agent
            ├─ Budget Agent
            └─ Cashflow Agent
                 ↓
            Consensus Agent (A2A verification)
                 ↓
            Reducer Agent (merge results)
                 ↓
            Synthesizer Agent (generate insight)
                 ↓
            Database Agent (store insight)
                 ↓
            WebSocket streams all events to client
```

### Decision Analysis Flow:

```
POST /api/decisions/analyze
                 ↓
            Create session, register WebSocket
                 ↓
        Sequential Pipeline (7 agents):
            └─ Data Fusion → TCO → Risk → Credit → Opportunity → Coach → Synthesis
                 ↓
            Each agent streams progress via WebSocket
                 ↓
            Final verdict with comparison matrix
```

### Financial Summary Flow:

```
POST /api/financial-summary/generate
                 ↓
            Check cache (< 6 hours old)
                 ↓
            Fetch: transactions, budgets, balances, alerts, insights
                 ↓
            Calculate: metrics, trends, risks, actions
                 ↓
            Generate: educational lesson, wins
                 ↓
            Store in database & return
```

### Chat Flow:

```
POST /api/chat (or WebSocket)
                 ↓
            User-specific agent (security wrapper)
                 ↓
            LLM decides: query DB or generate chart
                 ↓
            Returns: text + charts array
                 ↓
            Frontend renders: message + visualizations
```

---

## 🎨 Key Differentiators

1. **Multi-Agent Architecture**: Specialized agents for specific tasks
2. **Real-Time Feedback**: WebSocket streaming for live updates
3. **Educational Focus**: Teaches financial concepts using user's own data
4. **Comprehensive Analysis**: 7-agent decision analysis for major decisions
5. **Security First**: User-scoped tools with automatic authentication
6. **Visualization-First**: Charts generated proactively, not on-demand
7. **A2A Verification**: Agents verify each other's work via A2A protocol
8. **Caching**: Efficient financial summary caching (6-hour freshness)

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
└────────────┬────────────┬────────────┬────────────┬─────────┘
             │            │            │            │
             ↓            ↓            ↓            ↓
    ┌────────┴┐   ┌────────┴┐  ┌────────┴┐  ┌────────┴┐
    │  Chat   │   │Decision│  │Financial│  │WebSocket│
    │ Agent   │   │ Agent  │  │Summary  │  │Streaming│
    └────┬────┘   └───┬────┘  └────┬─────┘  └────┬─────┘
         │           │           │           │
         ↓           ↓           ↓           ↓
    ┌────────────────────────────────────────────────┐
    │           DATABASE (Supabase)                   │
    │  ┌─────────┐ ┌────────┐ ┌─────────┐ ┌────────┐│
    │  │Transac │ │Budgets │ │Alerts   │ │Insights││
    │  │tions   │ │        │ │         │ │        ││
    │  └────────┘ └────────┘ └─────────┘ └────────┘│
    └────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

- **Framework**: Google ADK (Agent Development Kit)
- **Language**: Python 3.9+
- **LLM**: Google Gemini 2.5 Flash Lite
- **Database**: Supabase (PostgreSQL)
- **WebSockets**: FastAPI WebSocket support
- **Visualization**: Plotly, Pandas, NumPy
- **Architecture**: Sequential & Parallel agents

---

## 💡 Presentation Tips

1. **Demo Flow:**

   - Start with transaction analysis (show real-time streaming)
   - Show chat agent with visualization
   - Demo decision agent (car lease vs finance)
   - Show financial summary

2. **Highlight Technical Innovation:**

   - Multi-agent orchestration
   - A2A verification
   - Real-time WebSocket streaming
   - User-scoped security model

3. **Emphasize User Value:**

   - Educational financial insights
   - Comprehensive decision analysis
   - Proactive visualization
   - Personalized recommendations

4. **Technical Depth:**
   - Explain agent pipeline design
   - Show WebSocket event structure
   - Demonstrate session state management
   - Highlight security architecture

---

## 📝 Quick Reference: Agent Responsibilities

| Agent             | Purpose                  | Key Output              |
| ----------------- | ------------------------ | ----------------------- |
| Chat Agent        | Conversational interface | Text + Charts           |
| Data Fusion       | Enrich context           | Financial profile       |
| TCO Calculator    | Calculate total costs    | Cost breakdown          |
| Risk Agent        | Assess financial risk    | Risk score + scenarios  |
| Credit Agent      | Simulate credit impact   | Score change estimate   |
| Opportunity Agent | Analyze alternatives     | Lost returns analysis   |
| Behavioral Coach  | Budget recommendations   | Rebalancing suggestions |
| Synthesis Agent   | Final verdict            | Recommendation + matrix |

---

## 🎯 Live Demo Script

1. **"Let me show you transaction analysis..."**

   - Incoming transaction → real-time agent streaming
   - Show each agent completing
   - Final insight generated

2. **"Now let's ask the chat agent..."**

   - "Where is my money going?"
   - Show Sankey diagram generation
   - Demonstrate interpretation

3. **"For major decisions, we have the decision agent..."**

   - Car lease vs finance example
   - Show 7-agent pipeline executing
   - Final recommendation with reasoning

4. **"Finally, the financial summary..."**
   - 30-day comprehensive report
   - Risks, actions, micro lesson
   - Celebrating wins
