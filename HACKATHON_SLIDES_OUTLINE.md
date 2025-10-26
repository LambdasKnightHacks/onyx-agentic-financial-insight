# Hackathon Presentation Slides Outline

## Slide Deck Structure (12 slides)

---

### Slide 1: Title

**FinFlow AI: Agentic Financial Intelligence Platform**

- Multi-agent architecture for financial decisions
- Real-time transaction analysis
- Conversational AI assistant

---

### Slide 2: Problem Statement

**Challenges in Personal Finance:**

- ❌ Lack of comprehensive decision analysis
- ❌ Reactive instead of proactive insights
- ❌ No educational context
- ❌ Fragmented tools
- ✅ FinFlow AI solves all of this

---

### Slide 3: Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │ Chat UI    │  │ Decision   │  │ Financial  │         │
│  │            │  │ UI         │  │ Summary UI │         │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘         │
│        │               │              │                 │
└────────┼───────────────┼──────────────┼─────────────────┘
         │               │              │
         ↓               ↓              ↓
┌─────────────────────────────────────────────────────────┐
│              API LAYER (FastAPI)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ /chat    │  │/decisions│  │/summary  │              │
│  │ WebSocket│  │WebSocket │  │ endpoint │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                      │
└───────┼─────────────┼─────────────┼──────────────────────┘
        │             │             │
        ↓             ↓             ↓
┌─────────────────────────────────────────────────────────┐
│            AGENTIC SYSTEM (Google ADK)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐    │
│  │ Chat Agent  │  │ Decision    │  │ Financial    │    │
│  │             │  │ Agent (7)    │  │ Summary Gen │    │
│  └─────────────┘  └──────────────┘  └────────────┘    │
│                                                           │
│  ┌────────────────────────────────────────────────┐    │
│  │ Transaction Agent (10 sub-agents)              │    │
│  └────────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓
            ┌──────────────────────┐
            │  SUPABASE (Postgres) │
            │  - transactions      │
            │  - budgets           │
            │  - alerts            │
            │  - insights          │
            └──────────────────────┘
```

---

### Slide 4: Chat Agent Deep Dive

**Conversational Financial Assistant**

**Capabilities:**

- 📊 14 Database Tools (transactions, budgets, alerts, cashflow)
- 📈 14 Visualization Tools (Sankey, heatmaps, projections)
- 🤖 Dual-purpose: Financial queries + general assistance
- 🔒 User-scoped security (automatic authentication)
- ⚡ Proactive visualization (no permission needed)

**Example:**

```
User: "Where is my money going?"

Agent: [Queries DB] → [Generates Sankey]
       "Dining is 35% of your spending ($420).
        Top merchants: Chipotle, DoorDash.
        [Educational explanation and recommendations]"
```

---

### Slide 5: Decision Agent Pipeline

**7-Agent Sequential Pipeline:**

```
Input: "Should I lease or finance a car?"

1. Data Fusion Agent      → Load 90 days financial history
2. TCO Calculator Agent   → Calculate total costs for each option
3. Risk & Liquidity Agent  → Assess runway, stress tests
4. Credit Impact Agent     → Simulate credit score impact
5. Opportunity Cost Agent  → Analyze alternative uses of money
6. Behavioral Coach Agent  → Generate budget recommendations
7. Synthesis Agent         → Final verdict + comparison matrix

Output: Recommendation with reasoning, risks, actions
```

**Output Example:**

- ✅ Recommendation: Finance (67% confidence)
- 💰 TCO: $42,500 vs $45,200
- ⚠️ Risk: Low-medium
- 📋 Budget adjustment needed

---

### Slide 6: Financial Summary Generator

**Comprehensive Financial Health Report**

**Generated Every Login (30-day period):**

```
┌──────────────────────────────────────────┐
│  FINANCIAL OVERVIEW                      │
│  • Income: $3,500                        │
│  • Expenses: $2,800                       │
│  • Net Flow: +$700 ✅                     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  TOP 5 CATEGORIES                        │
│  • Dining: 35% ($420)                    │
│  • Rent: 40% ($480)                      │
│  • Shopping: 15% ($180)                  │
│  • Entertainment: 8% ($96)               │
│  • Misc: 2% ($24)                        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  RISKS                                   │
│  ⚠️ Low cash reserve: 45 day runway       │
│  ⚠️ 2 budgets approaching limits         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  NEXT BEST ACTIONS                       │
│  1. Build emergency fund (High)          │
│  2. Optimize dining budget (Medium)      │
│  3. Review subscriptions (Low)          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  MICRO LESSON                            │
│  "Understanding Net Cash Flow..."         │
│  [Educational content]                    │
└──────────────────────────────────────────┘
```

---

### Slide 7: WebSocket Real-Time Streaming

**Event-Driven Architecture**

```
Client → WebSocket Connection
         ↓
    Agent Starts → "agent_started" event
         ↓
    Agent Processing → Status updates
         ↓
    Agent Completes → "agent_completed" event
                     ├─ Result data
                     ├─ UI formatting
                     └─ Chart links
         ↓
    Final Pipeline → "analysis_complete" event
                     └─ Full insight
```

**Event Types:**

- `analysis_started`
- `agent_started` (per agent)
- `agent_completed` (with results)
- `analysis_complete`

**Supported Endpoints:**

- `ws://transaction/analyze` - Real-time transaction analysis
- `ws://chat/{user_id}` - Real-time chat
- `ws://decisions/{session_id}` - Real-time decision analysis

---

### Slide 8: Transaction Analysis Pipeline

**10-Agent Pipeline with Parallel Processing:**

```
1. Init Agent
   └─ Deduplication + Context Loading

2. Parallel Analysis:
   ├─ Categorization Agent (A2A verified)
   ├─ Fraud Agent (A2A verified)
   ├─ Budget Agent
   └─ Cashflow Agent

3. Consensus Agent (A2A verification)
4. Reducer Agent (merge results)
5. Synthesizer Agent (generate insight)
6. Database Agent (store insight)
```

**Features:**

- 🔍 Automatic categorization
- 🚨 Fraud detection (Z-score, velocity, geo)
- 💰 Budget checking
- 📊 Cashflow runway calculation
- ✅ A2A verification for critical agents

---

### Slide 9: Security Architecture

**User-Scoped Security Model**

```python
# Every tool automatically uses user_id
def create_user_agent(user_id: str):
    context = UserContextWrapper(user_id)
    user_tools = context.wrap_all_tools(BASE_TOOLS)
    # LLM cannot override user_id
    return Agent(
        tools=user_tools,  # Auto-scoped
        ...
    )
```

**Key Features:**

- ✅ Tools automatically use authenticated user_id
- ✅ LLM cannot specify different user
- ✅ All database queries scoped to user
- ✅ Session-based authentication
- ✅ No data leakage between users

---

### Slide 10: Technical Stack

**Built With:**

- **Framework**: Google ADK (Agent Development Kit)
- **Language**: Python 3.9+
- **LLM**: Google Gemini 2.5 Flash Lite
- **Database**: Supabase (PostgreSQL)
- **Web Framework**: FastAPI
- **WebSockets**: FastAPI WebSocket support
- **Visualization**: Plotly, Pandas, NumPy
- **Architecture**: Sequential & Parallel agents
- **Protocol**: A2A (Agent-to-Agent communication)

---

### Slide 11: Key Innovations

**Technical Innovation:**

1. 🔄 **Multi-Agent Orchestration**: Specialized agents for specific tasks
2. 🔐 **Automatic User Scoping**: Security built into every tool
3. 📡 **Real-Time Streaming**: WebSocket events for live updates
4. 🤝 **A2A Verification**: Agents verify each other's work
5. 📊 **Proactive Visualization**: Charts generated without asking
6. 🎓 **Educational AI**: Teaches concepts using user's own data

**Business Value:**

1. 📈 **Comprehensive**: 7-agent decision analysis
2. ⚡ **Real-Time**: Live updates during processing
3. 🎯 **Personalized**: User-specific insights and recommendations
4. 💡 **Educational**: Micro-lessons and financial literacy
5. 🔔 **Proactive**: Identifies risks and next actions

---

### Slide 12: Live Demo

**Demo Flow:**

1. **Transaction Analysis** (2 min)

   - Show incoming transaction
   - Real-time agent streaming
   - Final categorization + insight

2. **Chat Agent** (2 min)

   - "Where is my money going?"
   - Generate Sankey diagram
   - Show interpretation

3. **Decision Agent** (3 min)

   - Car lease vs finance
   - 7-agent pipeline executing
   - Final recommendation

4. **Financial Summary** (1 min)
   - 30-day report
   - Risks, actions, wins

**Total: 8 minutes** ✅

---

## Backup Slides (If Time Permits)

### Slide 13: Agent Communication (A2A)

**How Agents Verify Each Other:**

```
Categorization Agent:
1. Analyzes transaction
2. Sends message via A2A protocol
3. Verification agent reviews
4. Consensus reached
```

### Slide 14: Data Flow

**End-to-End Data Flow:**

```
Plaid → Transaction → Init → Parallel Analysis →
Consensus → Synthesis → Insight → Database → Frontend
```

### Slide 15: Scaling Architecture

**How We Scale:**

- Cached financial summaries (6-hour freshness)
- Efficient agent pipelines
- Parallel processing where possible
- WebSocket connection pooling
- Session-based state management

---

## Speaker Notes

### Introduction (Slide 1)

"FinFlow AI is a comprehensive financial intelligence platform powered by multiple specialized AI agents..."

### Problem (Slide 2)

"Traditional financial apps are reactive. They show you what happened, but don't help you make better decisions..."

### Demo (Slide 12)

"Let me show you how this works in real-time..."

---

## Q&A Preparation

**Q: How do you ensure accuracy?**
A: A2A verification - agents verify each other's work, plus statistical validation

**Q: What about privacy?**
A: User-scoped tools with automatic authentication - no data leakage possible

**Q: How fast is it?**
A: Parallel processing where possible, cached summaries, optimized pipelines

**Q: Why multiple agents vs one?**
A: Each agent specializes - better accuracy, maintainability, and debugging

**Q: How do you handle errors?**
A: Graceful degradation, error events via WebSocket, fallback mechanisms
