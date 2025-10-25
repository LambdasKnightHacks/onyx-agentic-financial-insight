import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/lib/api-auth";

/**
 * GET /api/plaid/status
 *
 * Checks if the authenticated user has connected Plaid accounts.
 * Used to determine whether to show onboarding modal.
 *
 * @returns {hasPlaidItems: boolean, items: array}
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await getAuthenticatedUser();

    if (error || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Get backend URL
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

    // Forward to Express backend
    const response = await fetch(
      `${backendUrl}/api/plaid/status?userId=${user.id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Failed to fetch Plaid status",
      }));

      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[Plaid Status Error]:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
