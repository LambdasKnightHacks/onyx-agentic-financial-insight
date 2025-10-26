import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/lib/api-auth";

/**
 * POST /api/plaid/sync
 *
 * Manually triggers transaction sync for the authenticated user's Plaid items.
 *
 * @body {itemId?: string} - Optional: sync specific item
 * @returns {success: boolean, transactionCount: number}
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await getAuthenticatedUser();

    if (error || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Parse optional item ID
    const body = await request.json().catch(() => ({}));
    const { itemId } = body;

    // Get backend URL
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

    // Forward to Express backend
    const response = await fetch(`${backendUrl}/api/plaid/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        itemId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Failed to sync transactions",
      }));

      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[Plaid Sync Error]:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
