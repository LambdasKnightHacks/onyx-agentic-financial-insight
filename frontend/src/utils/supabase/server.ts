import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(
          name: string,
          value: string,
          options?: Parameters<typeof cookieStore.set>[2]
        ) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Ignored in Server Component contexts
          }
        },
        remove(name: string, options?: Parameters<typeof cookieStore.set>[2]) {
          try {
            cookieStore.set(name, "", { ...(options || {}), maxAge: 0 });
          } catch {
            // Ignored in Server Component contexts
          }
        },
      },
    }
  );
}

export function createRouteHandlerClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(
          name: string,
          value: string,
          options?: Parameters<typeof response.cookies.set>[2]
        ) {
          // set on request clone and propagate to response
          try {
            request.cookies.set(name, value);
          } catch {}
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          try {
            response.cookies.set(name, value, options);
          } catch {}
        },
        remove(
          name: string,
          options?: Parameters<typeof response.cookies.set>[2]
        ) {
          try {
            request.cookies.set(name, "");
          } catch {}
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          try {
            response.cookies.set(name, "", { ...(options || {}), maxAge: 0 });
          } catch {}
        },
      },
    }
  );

  return { supabase, response };
}
