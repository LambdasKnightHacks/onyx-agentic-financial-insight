import { createClient } from "@/src/utils/supabase/server";
import { NextRequest } from "next/server";

export async function getUserIdFromRequest(
  request: NextRequest
): Promise<string | null> {
  try {
    console.log("[Auth Utils] Getting user from request");
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log("[Auth Utils] Supabase auth result:", {
      user: user?.id,
      error: error?.message,
    });

    if (error || !user) {
      console.log("[Auth Utils] No user or error, returning null");
      return null;
    }

    console.log("[Auth Utils] Returning user ID:", user.id);
    return user.id;
  } catch (error) {
    console.error("[Auth Utils] Error getting user from request:", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

fetch("/api/plaid/create-link-token", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer sb-qxclcouymswbboclrhxk-auth-token",
  },
  body: JSON.stringify({}),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
