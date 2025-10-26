# Financial Decision Analysis Agent

A sophisticated multi-agent system for analyzing major financial decisions using Google ADK.

## Overview

The Decision Agent provides comprehensive financial analysis for major life decisions such as:

- **Car Decisions**: Lease vs Finance vs Buy
- **Home Decisions**: Mortgage vs Rent
- **Travel Decisions**: Timing and affordability analysis
- **Generic Purchases**: Custom large purchase analysis

## Architecture

### Multi-Agent Pipeline

The system uses a **Sequential Agent** architecture with 7 specialized sub-agents:

```
1. Data Fusion Agent       → Enriches user financial context
2. TCO Calculator Agent     → Calculates Total Cost of Ownership
3. Risk & Liquidity Agent   → Assesses financial risk via stress tests
4. Credit Impact Agent      → Simulates credit score impact
5. Opportunity Cost Agent   → Analyzes alternative uses of money
6. Behavioral Coach Agent   → Generates personalized budget recommendations
7. Synthesis Agent          → Produces final verdict with reasoning
```

Each agent writes its results to session state, and the next agent uses those results as inputs.

### Directory Structure

```
decision_agent/
├── __init__.py
├── README.md
├── config.py                          # All thresholds and configurations
├── agent.py                           # Root SequentialAgent orchestrator
│
├── subagents/
│   ├── data_fusion_agent/
│   │   ├── agent.py                   # Enriches financial data
│   │   └── tools.py                   # Income cadence, spending volatility, etc.
│   │
│   ├── tco_calculator_agent/
│   │   ├── agent.py                   # Routes to appropriate calculator
│   │   └── calculators/
│   │       ├── car_calculator.py      # Lease vs Finance TCO
│   │       ├── home_calculator.py     # Mortgage vs Rent (TODO)
│   │       └── travel_calculator.py   # Travel timing (TODO)
│   │
│   ├── risk_liquidity_agent/
│   │   ├── agent.py                   # Risk assessment
│   │   └── tools.py                   # Runway, stress tests, liquidity scoring
│   │
│   ├── credit_impact_agent/
│   │   ├── agent.py                   # Credit score simulation
│   │   └── tools.py                   # Hard pulls, utilization, AAoA impacts
│   │
│   ├── opportunity_cost_agent/
│   │   ├── agent.py                   # Investment vs spending analysis
│   │   └── tools.py                   # NPV calculations, deferral benefits
│   │
│   ├── behavioral_coach_agent/
│   │   ├── agent.py                   # LLM-powered recommendations
│   │   ├── prompts.py                 # Gemini prompts for budget advice
│   │   └── tools.py                   # Parsing and validation
│   │
│   └── synthesis_agent/
│       ├── agent.py                   # Final verdict generator
│       └── prompts.py                 # Gemini prompts for decision synthesis
│
├── tools/
│   ├── database.py                    # Supabase queries
│   └── validators.py                  # Input validation
│
└── websocket/
    ├── __init__.py
    ├── publisher.py                   # Real-time updates (TODO)
    └── extractor.py                   # Result extraction (TODO)
```

## Usage

### Basic Example

```python
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from agents.decision_agent.agent import root_decision_agent

# Create session
session_service = InMemorySessionService()
session = await session_service.create_session(
    app_name="decision_analyzer",
    session_id="unique-session-id",
    user_id="user-123"
)

# Set initial state with decision parameters
session.state.update({
    "analysis_id": "analysis-uuid",
    "user_id": "user-123",
    "decision_type": "car_lease_vs_finance",
    "decision_inputs": {
        "lease_option": {
            "monthly_payment": 389,
            "down_payment": 2000,
            "lease_term_months": 36,
            "mileage_cap": 12000,
            "acquisition_fee": 595,
            "disposition_fee": 395,
            # ... more details
        },
        "finance_option": {
            "purchase_price": 32000,
            "down_payment": 3000,
            "apr": 0.049,
            "loan_term_months": 60,
            # ... more details
        },
        "tenure_months": 36
    }
})

# Run decision agent pipeline
runner = Runner(agent=root_decision_agent, session_service=session_service)

async for event in runner.run(session_id=session.session_id):
    # Each agent will yield events as it processes
    print(f"{event.author}: {event.content}")

# Get final result
final_output = session.state.get("final_decision_output")
```

### Expected Output Structure

```json
{
  "decision_type": "car_lease_vs_finance",
  "analysis_id": "uuid",
  "timestamp": "2024-01-15T10:30:00Z",
  "verdict": {
    "recommended_option": "Finance",
    "confidence": 0.78,
    "reasoning": "Financing saves $2,130 over 36 months with acceptable risk",
    "risk_level": "low",
    "key_factors": [
      "APR advantage (4.9% vs 6.2% equivalent)",
      "Equity building opportunity",
      "Expected mileage within lease cap"
    ],
    "trade_offs": ["Higher monthly payment", "Maintenance responsibility"],
    "action_checklist": [
      "Get preapproval from 2-3 lenders",
      "Compare insurance quotes",
      "Negotiate dealer fees"
    ]
  },
  "options": [
    {
      "name": "Finance",
      "tco_expected": 28750,
      "monthly_payment": 465,
      "liquidity_score": 0.72,
      "credit_impact": "-6 to -12 points",
      "runway_impact": {...}
    },
    {
      "name": "Lease",
      "tco_expected": 30880,
      "monthly_payment": 389,
      "liquidity_score": 0.76,
      "credit_impact": "-3 to -7 points",
      "runway_impact": {...}
    }
  ],
  "risk_assessment": {...},
  "stress_scenarios": [...],
  "budget_rebalancing": {
    "recommendations": [
      {
        "category": "food",
        "specific_change": "Skip 2 restaurant meals per month",
        "monthly_savings": 95,
        "behavioral_tip": "Meal prep on Sundays"
      }
    ],
    "total_monthly_savings": 250
  }
}
```

## Configuration

All thresholds and parameters are centralized in `config.py`:

- **DTI Thresholds**: Critical (36%), Warning (28%), Optimal (20%)
- **Emergency Fund**: Minimum (3 months), Optimal (6 months)
- **Liquidity Scores**: Low (<0.4), Good (>0.7)
- **Stress Scenarios**: Income drops, expense spikes, rate shocks, emergencies
- **Category Elasticity**: Spending flexibility by category (0.0-1.0)

## Database Schema

The system requires these Supabase tables (see `refs/decision_analysis_schema.sql`):

- `decision_analyses` - Main analysis records
- `decision_options` - Individual option comparisons
- `decision_recommendations` - Budget rebalancing suggestions
- `decision_agent_runs` - Agent execution tracking
- `decision_scenarios` - Stress test results

## Development Status

### Phase 1: Foundation ✅

- Database schema
- Core configuration
- Validation tools
- Database tools

### Phase 2: Multi-Agent Architecture ✅

- All 7 agents implemented
- Root orchestrator complete
- ADK best practices followed

### Phase 3: API & WebSocket Integration (TODO)

- FastAPI endpoints
- WebSocket streaming
- Session management
- Database persistence

### Phase 4: Frontend UI (TODO)

- Decision wizard form
- Real-time progress display
- Results dashboard
- Budget recommendation UI

## Key Features

1. **Comprehensive Analysis**: 7 specialized agents cover all aspects of financial decisions
2. **Real-Time Streaming**: WebSocket updates show agent progress (ChatGPT-style thinking)
3. **Personalization**: LLM-powered recommendations based on actual spending patterns
4. **Risk Assessment**: Stress testing under multiple adverse scenarios
5. **Actionable Insights**: Specific action items and budget adjustments
6. **Extensibility**: Easy to add new decision types or calculators

## Testing

```bash
# Unit tests (TODO)
pytest tests/decision_agent/

# Integration test (TODO)
pytest tests/decision_agent/test_full_pipeline.py

# Specific agent test (TODO)
pytest tests/decision_agent/test_tco_calculator.py
```

## Dependencies

- Google ADK (`google-adk`)
- Google GenAI (`google-generativeai`)
- Supabase Python client
- FastAPI (for API)
- Pydantic (for validation)

## Environment Variables

```bash
# Required
GOOGLE_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_PROJECT=your-gcp-project
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key

# Optional
LLM_MODEL=gemini-2.0-flash-exp  # Default model
```

## Contributing

When adding new decision types:

1. Create calculator in `subagents/tco_calculator_agent/calculators/`
2. Update `TCOCalculatorAgent` routing logic
3. Add any new thresholds to `config.py`
4. Update database schema if needed
5. Add tests

## License

[Your License]

## Contact

[Your Contact Info]
