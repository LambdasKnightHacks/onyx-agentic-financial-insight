import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/lib/api-auth";

/**
 * POST /api/plaid/connect-bank
 *
 * Exchanges Plaid public token for access token and saves bank connection.
 * Called after user successfully completes Plaid Link flow.
 *
 * @body {public_token: string, metadata: object}
 * @returns {success: boolean, accounts: array}
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await getAuthenticatedUser();

    if (error || !user) {
      console.error("[Connect Bank] Authentication failed:", error);
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { public_token, metadata } = body;

    if (!public_token) {
      console.error("[Connect Bank] Missing public_token in request");
      return NextResponse.json(
        { error: "Missing public_token" },
        { status: 400 }
      );
    }

    console.log("[Connect Bank] Processing request for user:", user.id);
    console.log("[Connect Bank] Institution:", metadata?.institution?.name);

    // Get backend URL
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

    // Forward to Express backend with correct parameter name
    const response = await fetch(`${backendUrl}/api/plaid/connect-bank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        publicToken: public_token,
        metadata,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Failed to connect bank account",
      }));

      console.error("[Connect Bank] Backend error:", errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log("[Connect Bank] Success - Item ID:", data.item_id);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[Plaid Connect Bank Error]:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
