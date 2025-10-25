import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/plaid/webhook
 *
 * PUBLIC endpoint for receiving Plaid webhook events.
 * Does NOT require authentication - called directly by Plaid.
 *
 * Handles:
 * - INITIAL_UPDATE: Triggers initial 2-year transaction sync
 * - DEFAULT_UPDATE: Syncs new/modified transactions
 * - ERROR: Updates item status
 * - PENDING_EXPIRATION: Notifies user to re-authenticate
 *
 * @body {webhook_type: string, webhook_code: string, item_id: string, ...}
 * @returns {received: boolean}
 */
export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const body = await request.json();
    const { webhook_type, webhook_code, item_id } = body;

    // Log webhook for debugging
    console.log("[Plaid Webhook Received]:", {
      type: webhook_type,
      code: webhook_code,
      itemId: item_id,
      timestamp: new Date().toISOString(),
    });

    // TODO: Verify Plaid webhook signature
    // const signature = request.headers.get('plaid-verification')
    // if (!verifyPlaidSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    // Get backend URL
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

    // Forward webhook to Express backend for processing
    const response = await fetch(`${backendUrl}/api/plaid/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("[Plaid Webhook Forward Error]:", response.status);
      // Still return 200 to Plaid to avoid retries
    }

    // Always return 200 to Plaid to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Plaid Webhook Error]:", error);

    // Return 200 even on error to prevent Plaid retries
    // Log error for manual investigation
    return NextResponse.json(
      {
        received: true,
        error: "Internal processing error - logged for review",
      },
      { status: 200 }
    );
  }
}
