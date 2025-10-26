import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * POST /api/plaid/create-link-token
 *
 * Generates a Plaid Link token for the authenticated user.
 * This token is used to initialize the Plaid Link component.
 *
 * @returns {link_token: string, expiration: string}
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user using Supabase SSR
    const { user, error } = await getAuthenticatedUser();

    if (error || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Get backend URL from environment
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Forward request to Express backend with user ID
    const response = await fetch(`${backendUrl}/api/plaid/create-link-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
      }),
    });

    // Handle backend errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Failed to create link token",
      }));

      return NextResponse.json(errorData, { status: response.status });
    }

    // Return link token to frontend
    const data = await response.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[Plaid Create Link Token Error]:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
