import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Debug: env presence
    console.log("[connect-bank] envs:", {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
    });

    // Debug: cookie names
    try {
      const names = (await cookies()).getAll().map((c) => c.name);
      console.log("[connect-bank] cookieNames:", names);
    } catch (e) {
      console.log(
        "[connect-bank] cookies() getAll threw:",
        (e as Error)?.message
      );
    }

    // Authenticate user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log("[connect-bank] user:", {
      id: user?.id,
      email: user?.email,
      error: error?.message,
    });

    if (error || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { public_token, metadata } = body;

    if (!public_token) {
      return NextResponse.json(
        { error: "Missing public_token" },
        { status: 400 }
      );
    }

    // Get backend URL
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

    // Forward to Express backend
    console.log(
      "[connect-bank] -> backend POST",
      `${backendUrl}/api/plaid/connect-bank`
    );
    const response = await fetch(`${backendUrl}/api/plaid/connect-bank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        public_token: public_token,
        metadata,
      }),
    });

    console.log("[connect-bank] backend status:", response.status);
    if (!response.ok) {
      const bodyText = await response.text().catch(() => "<no body>");
      console.log("[connect-bank] backend body:", bodyText);
      const errorData = (() => {
        try {
          return JSON.parse(bodyText);
        } catch {
          return { error: "Failed to connect bank account" };
        }
      })();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
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
