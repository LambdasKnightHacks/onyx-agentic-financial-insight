import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/plaid/create-link-token
 *
 * Creates a Plaid link token for the authenticated user.
 *
 * @returns {link_token: string}
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
    console.log("[create-link-token] envs:", {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      backendUrl:
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
    });

    // Debug: cookie names
    try {
      const names = (await cookies()).getAll().map((c) => c.name);
      console.log("[create-link-token] cookieNames:", names);
    } catch (e) {
      console.log(
        "[create-link-token] cookies() getAll threw:",
        (e as Error)?.message
      );
    }

    // Authenticate user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log("[create-link-token] user:", {
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

    // Get backend URL
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

    // Forward request to Express backend with user ID
    console.log(
      "[create-link-token] -> backend POST",
      `${backendUrl}/api/plaid/create-link-token`
    );
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

    console.log("[create-link-token] backend status:", response.status);
    if (!response.ok) {
      const bodyText = await response.text().catch(() => "<no body>");
      console.log("[create-link-token] backend body:", bodyText);
      const errorData = (() => {
        try {
          return JSON.parse(bodyText);
        } catch {
          return { error: "Failed to create link token" };
        }
      })();
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
