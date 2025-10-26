// frontend/src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/src/utils/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/error", url));
  }
  return NextResponse.redirect(new URL(next, url));
}
