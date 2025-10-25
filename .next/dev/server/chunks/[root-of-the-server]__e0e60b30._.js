module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/KH25/Main/lib/mock-data.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mockAccounts",
    ()=>mockAccounts,
    "mockAgentTasks",
    ()=>mockAgentTasks,
    "mockAuditLogs",
    ()=>mockAuditLogs,
    "mockAutomationRules",
    ()=>mockAutomationRules,
    "mockFraudAlerts",
    ()=>mockFraudAlerts,
    "mockInsights",
    ()=>mockInsights,
    "mockTransactions",
    ()=>mockTransactions
]);
const mockAccounts = [
    {
        id: "acc_001",
        institution: "Chase",
        nickname: "Main Checking",
        last4: "4829",
        type: "checking",
        currency: "USD",
        balanceCurrent: 12847.32,
        balanceAvailable: 12847.32,
        status: "active"
    },
    {
        id: "acc_002",
        institution: "Bank of America",
        nickname: "Savings",
        last4: "7621",
        type: "savings",
        currency: "USD",
        balanceCurrent: 45230.18,
        balanceAvailable: 45230.18,
        status: "active"
    },
    {
        id: "acc_003",
        institution: "Capital One",
        nickname: "Rewards Card",
        last4: "3492",
        type: "credit",
        currency: "USD",
        balanceCurrent: -2184.67,
        balanceAvailable: 7815.33,
        status: "active"
    },
    {
        id: "acc_004",
        institution: "Ally Bank",
        nickname: "Emergency Fund",
        last4: "9103",
        type: "savings",
        currency: "USD",
        balanceCurrent: 18500.0,
        balanceAvailable: 18500.0,
        status: "active"
    }
];
const mockTransactions = [
    {
        id: "txn_001",
        accountId: "acc_001",
        date: "2025-10-22",
        merchant: "UBER *TRIP",
        amount: -18.72,
        currency: "USD",
        category: "Transport/Rideshare",
        labels: [
            "recurring:false",
            "channel:in_app"
        ],
        status: "posted",
        agent: {
            categoryConfidence: 0.86,
            fraudScore: 0.12,
            explanations: [
                "Matches historical rideshare pattern"
            ]
        },
        raw: {
            plaidTransactionId: "plaid_txn_001",
            mcc: "4121",
            location: "San Francisco, CA",
            channel: "online"
        }
    },
    {
        id: "txn_002",
        accountId: "acc_003",
        date: "2025-10-21",
        merchant: "Amazon.com",
        amount: -127.45,
        currency: "USD",
        category: "Shopping/Online",
        labels: [
            "recurring:false",
            "channel:online"
        ],
        status: "posted",
        agent: {
            categoryConfidence: 0.94,
            fraudScore: 0.08,
            explanations: [
                "Frequent merchant",
                "Normal amount range"
            ]
        },
        raw: {
            plaidTransactionId: "plaid_txn_002",
            mcc: "5942",
            channel: "online"
        }
    },
    {
        id: "txn_003",
        accountId: "acc_001",
        date: "2025-10-21",
        merchant: "Whole Foods Market",
        amount: -84.32,
        currency: "USD",
        category: "Food & Dining/Groceries",
        labels: [
            "recurring:false",
            "channel:pos"
        ],
        status: "posted",
        agent: {
            categoryConfidence: 0.91,
            fraudScore: 0.05,
            explanations: [
                "Regular grocery pattern",
                "Expected location"
            ]
        },
        raw: {
            plaidTransactionId: "plaid_txn_003",
            mcc: "5411",
            location: "Palo Alto, CA",
            channel: "pos"
        }
    },
    {
        id: "txn_004",
        accountId: "acc_003",
        date: "2025-10-20",
        merchant: "LUXURY ELECTRONICS INT",
        amount: -2849.99,
        currency: "USD",
        category: "Shopping/Electronics",
        labels: [
            "recurring:false",
            "channel:online",
            "flagged"
        ],
        status: "posted",
        agent: {
            categoryConfidence: 0.72,
            fraudScore: 0.87,
            explanations: [
                "New merchant",
                "High amount",
                "Unusual time (3:42 AM)"
            ]
        },
        raw: {
            plaidTransactionId: "plaid_txn_004",
            mcc: "5732",
            location: "Unknown",
            channel: "online"
        }
    },
    {
        id: "txn_005",
        accountId: "acc_001",
        date: "2025-10-20",
        merchant: "Starbucks",
        amount: -6.75,
        currency: "USD",
        category: "Food & Dining/Coffee",
        labels: [
            "recurring:true",
            "channel:pos"
        ],
        status: "posted",
        agent: {
            categoryConfidence: 0.98,
            fraudScore: 0.02,
            explanations: [
                "Daily recurring pattern",
                "Known location"
            ]
        },
        raw: {
            plaidTransactionId: "plaid_txn_005",
            mcc: "5814",
            location: "San Francisco, CA",
            channel: "pos"
        }
    },
    {
        id: "txn_006",
        accountId: "acc_001",
        date: "2025-10-19",
        merchant: "Netflix",
        amount: -15.99,
        currency: "USD",
        category: "Entertainment/Streaming",
        labels: [
            "recurring:true",
            "subscription",
            "channel:online"
        ],
        status: "posted",
        agent: {
            categoryConfidence: 0.99,
            fraudScore: 0.01,
            explanations: [
                "Monthly subscription",
                "Expected billing date"
            ]
        },
        raw: {
            plaidTransactionId: "plaid_txn_006",
            mcc: "4899",
            channel: "online"
        }
    },
    {
        id: "txn_007",
        accountId: "acc_002",
        date: "2025-10-18",
        merchant: "Payroll Deposit - ACME Corp",
        amount: 4250.0,
        currency: "USD",
        category: "Income/Salary",
        labels: [
            "recurring:true",
            "income"
        ],
        status: "posted",
        agent: {
            categoryConfidence: 1.0,
            fraudScore: 0.0,
            explanations: [
                "Bi-weekly payroll pattern"
            ]
        },
        raw: {
            plaidTransactionId: "plaid_txn_007",
            channel: "ach"
        }
    },
    {
        id: "txn_008",
        accountId: "acc_001",
        date: "2025-10-17",
        merchant: "Shell Gas Station",
        amount: -52.18,
        currency: "USD",
        category: "Transport/Gas",
        labels: [
            "recurring:false",
            "channel:pos"
        ],
        status: "posted",
        agent: {
            categoryConfidence: 0.89,
            fraudScore: 0.06,
            explanations: [
                "Regular gas station pattern"
            ]
        },
        raw: {
            plaidTransactionId: "plaid_txn_008",
            mcc: "5541",
            location: "San Jose, CA",
            channel: "pos"
        }
    }
];
const mockInsights = [
    {
        id: "ins_001",
        title: "Dining spend 32% above 3-month average",
        metricDelta: 0.32,
        confidence: 0.81,
        why: [
            "Higher weekend frequency",
            "Average ticket up 18%",
            "New restaurants added"
        ],
        cta: {
            label: "Set $250 dining budget",
            action: "create_budget",
            params: {
                category: "dining",
                amount: 250
            }
        }
    },
    {
        id: "ins_002",
        title: "Potential savings: Switch to annual Netflix",
        metricDelta: -0.15,
        confidence: 0.92,
        why: [
            "Annual plan saves $32/year",
            "Consistent usage pattern"
        ],
        cta: {
            label: "View subscription options",
            action: "view_subscriptions"
        }
    },
    {
        id: "ins_003",
        title: "Cashflow projection: Shortfall on Nov 15",
        metricDelta: -0.24,
        confidence: 0.76,
        why: [
            "Current burn rate: $2,840/mo",
            "Upcoming bills: $1,200",
            "Buffer below threshold"
        ],
        cta: {
            label: "Move $400 to checking",
            action: "transfer_funds",
            params: {
                amount: 400
            }
        }
    },
    {
        id: "ins_004",
        title: "3 subscriptions unused in 60 days",
        metricDelta: 0.0,
        confidence: 0.88,
        why: [
            "No activity detected",
            "Total cost: $47/month"
        ],
        cta: {
            label: "Review subscriptions",
            action: "review_subscriptions"
        }
    }
];
const mockFraudAlerts = [
    {
        id: "alert_001",
        severity: "high",
        riskScore: 0.87,
        reasonCodes: [
            "new_merchant",
            "high_amount",
            "unusual_time"
        ],
        evidenceTxnIds: [
            "txn_004"
        ],
        status: "new",
        merchant: "LUXURY ELECTRONICS INT",
        amount: 2849.99,
        date: "2025-10-20"
    },
    {
        id: "alert_002",
        severity: "medium",
        riskScore: 0.64,
        reasonCodes: [
            "geo_velocity",
            "new_device"
        ],
        evidenceTxnIds: [
            "txn_002"
        ],
        status: "ack",
        merchant: "Amazon.com",
        amount: 127.45,
        date: "2025-10-21"
    },
    {
        id: "alert_003",
        severity: "low",
        riskScore: 0.42,
        reasonCodes: [
            "unusual_category"
        ],
        evidenceTxnIds: [
            "txn_001"
        ],
        status: "resolved",
        merchant: "UBER *TRIP",
        amount: 18.72,
        date: "2025-10-22"
    }
];
const mockAutomationRules = [
    {
        id: "rule_001",
        enabled: true,
        name: "High-value transaction alert",
        trigger: {
            type: "transaction_created",
            conditions: [
                {
                    field: "amount",
                    op: ">",
                    value: 500
                }
            ]
        },
        actions: [
            {
                type: "create_alert",
                severity: "high"
            }
        ],
        createdBy: "admin",
        version: 1
    },
    {
        id: "rule_002",
        enabled: true,
        name: "New merchant notification",
        trigger: {
            type: "transaction_created",
            conditions: [
                {
                    field: "merchant",
                    op: "is_new",
                    value: true
                }
            ]
        },
        actions: [
            {
                type: "notify_user"
            }
        ],
        createdBy: "admin",
        version: 1
    }
];
const mockAgentTasks = [
    {
        id: "task_001",
        agent: "advisor",
        status: "in-progress",
        description: "Analyzing spending patterns for October",
        timestamp: "2025-10-24T10:32:00Z"
    },
    {
        id: "task_002",
        agent: "fraud",
        status: "completed",
        description: "Risk assessment for txn_004",
        timestamp: "2025-10-24T09:15:00Z"
    },
    {
        id: "task_003",
        agent: "automation",
        status: "pending",
        description: "Evaluating rule_001 on new transactions",
        timestamp: "2025-10-24T10:45:00Z"
    }
];
const mockAuditLogs = [
    {
        id: "log_001",
        timestamp: "2025-10-24T10:32:15Z",
        agent: "Fraud Agent",
        action: "Alert Created",
        details: "High-risk transaction detected: LUXURY ELECTRONICS INT ($2,849.99)",
        userId: "system"
    },
    {
        id: "log_002",
        timestamp: "2025-10-24T09:18:42Z",
        agent: "Advisor Agent",
        action: "Insight Generated",
        details: "Dining spend analysis completed with 81% confidence",
        userId: "system"
    },
    {
        id: "log_003",
        timestamp: "2025-10-23T14:22:10Z",
        agent: "Automation Agent",
        action: "Rule Executed",
        details: "rule_001 triggered for transaction txn_004",
        userId: "system"
    }
];
}),
"[project]/KH25/Main/app/api/insights/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$KH25$2f$Main$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/KH25/Main/node_modules/.pnpm/next@16.0.0_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$KH25$2f$Main$2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/KH25/Main/lib/mock-data.ts [app-route] (ecmascript)");
;
;
async function GET() {
    await new Promise((resolve)=>setTimeout(resolve, 350));
    return __TURBOPACK__imported__module__$5b$project$5d2f$KH25$2f$Main$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(__TURBOPACK__imported__module__$5b$project$5d2f$KH25$2f$Main$2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mockInsights"]);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e0e60b30._.js.map