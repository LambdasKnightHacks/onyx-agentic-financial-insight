# Phase 4: Frontend UI Implementation Plan

## 🎯 Goal

Build a beautiful, modern UI for the Decision Analysis system with real-time WebSocket updates.

## 📋 Components to Build

### 1. Main Decision Analysis Page (`/dashboard/decisions`)

**File:** `frontend/src/app/(pages)/dashboard/decisions/page.tsx`

Features:

- Decision type selector (Car Lease vs Finance, Travel, Home, etc.)
- Dynamic form based on selected decision type
- User preferences input
- Constraints configuration
- "Analyze Decision" button
- Navigation to analysis results

### 2. Decision Form Component

**File:** `frontend/src/app/(pages)/dashboard/decisions/components/DecisionForm.tsx`

Features:

- Car Lease vs Finance form (MVP)
- Input validation
- Clean, modern design matching existing app style
- Tooltips for guidance

### 3. Live Analysis Panel

**File:** `frontend/src/app/(pages)/dashboard/decisions/components/LiveAnalysisPanel.tsx`

Features:

- Real-time WebSocket connection
- Agent progress visualization (similar to transaction analysis)
- 7-step progress indicator
- Current agent status
- Animated progress bars

### 4. Results Display Page

**File:** `frontend/src/app/(pages)/dashboard/decisions/results/[analysisId]/page.tsx`

Features:

- Executive verdict card
- TCO comparison chart
- Risk assessment display
- Budget rebalancing recommendations
- Action checklist
- Option comparison table

### 5. Results Components

**Verdict Card:**
`frontend/src/app/(pages)/dashboard/decisions/components/VerdictCard.tsx`

- Recommendation summary
- Confidence score
- Risk level indicator

**TCO Comparison Chart:**
`frontend/src/app/(pages)/dashboard/decisions/components/TCOChart.tsx`

- Visual comparison of lease vs finance
- Breakdown by category
- Interactive tooltips

**Risk Assessment:**
`frontend/src/app/(pages)/dashboard/decisions/components/RiskAssessment.tsx`

- DTI ratio
- Emergency fund status
- Runway days
- Stress test results

**Budget Rebalancing:**
`frontend/src/app/(pages)/dashboard/decisions/components/BudgetRebalancing.tsx`

- Suggested budget cuts
- Category adjustments
- Apply recommendation button

**Action Checklist:**
`frontend/src/app/(pages)/dashboard/decisions/components/ActionChecklist.tsx`

- Step-by-step actions
- Checkable items
- Priority indicators

### 6. History Page

**File:** `frontend/src/app/(pages)/dashboard/decisions/history/page.tsx`

Features:

- List of past analyses
- Filter by decision type
- View past results
- Compare decisions

### 7. WebSocket Hook

**File:** `frontend/src/app/(pages)/dashboard/decisions/hooks/useDecisionWebSocket.ts`

Features:

- WebSocket connection management
- Event handling
- State updates
- Reconnection logic

### 8. API Integration

**File:** `frontend/src/app/api/decisions/route.ts`

Features:

- POST `/api/decisions/analyze` - Start analysis
- GET `/api/decisions/history/{userId}` - Get history
- GET `/api/decisions/{analysisId}` - Get specific analysis
- POST `/api/decisions/{analysisId}/apply-recommendation` - Apply recommendation

## 🎨 Design System

Using existing components from the app:

- `Card` from `@/components/ui/card`
- `Button` from `@/components/ui/button`
- `Input` from `@/components/ui/input`
- `Select` from `@/components/ui/select`
- `Progress` from `@/components/ui/progress`
- `Badge` from `@/components/ui/badge`
- `Skeleton` from `@/components/ui/skeleton`

Color scheme:

- Success: Green (`text-green-600`, `bg-green-100`)
- Warning: Yellow (`text-yellow-600`, `bg-yellow-100`)
- Danger: Red (`text-red-600`, `bg-red-100`)
- Info: Blue (`text-blue-600`, `bg-blue-100`)

## 📱 User Flow

1. User navigates to `/dashboard/decisions`
2. Selects decision type (e.g., "Car: Lease vs Finance")
3. Fills out decision form with car details
4. Clicks "Analyze Decision"
5. Redirected to live analysis page with WebSocket connection
6. Sees real-time progress as each of 7 agents processes
7. When complete, sees comprehensive results
8. Can apply budget recommendations
9. Can view in history later

## 🚀 Implementation Order

**Step 1:** Main page + Decision type selector
**Step 2:** Car decision form
**Step 3:** API routes
**Step 4:** Live analysis panel with WebSocket
**Step 5:** Results display components
**Step 6:** History page

## 📦 TypeScript Types

```typescript
// Decision Analysis Types
interface DecisionAnalysisRequest {
  user_id: string;
  decision_type: "car_lease_vs_finance" | "home_buy_vs_rent" | "travel_booking";
  decision_inputs:
    | CarDecisionInputs
    | HomeDecisionInputs
    | TravelDecisionInputs;
  preferences: {
    max_acceptable_payment?: number;
    risk_tolerance?: "low" | "medium" | "high";
  };
  constraints: {
    min_emergency_fund_months?: number;
  };
}

interface CarDecisionInputs {
  lease_option: LeaseOption;
  finance_option: FinanceOption;
  tenure_months: number;
}

interface DecisionAnalysisResponse {
  status: "started" | "processing" | "completed" | "failed";
  session_id: string;
  analysis_id: string;
  message: string;
  websocket_url: string;
}
```

---

**Phase 4 Status:** 🚧 **STARTING** - Building frontend UI components!
