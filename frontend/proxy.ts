import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Session refresh + admin gate.
 *
 * EVERY request runs through here (matched below). The proxy:
 *
 *  1. Builds a Supabase server client with the request's cookies,
 *     calls `auth.getUser()`, and writes the response cookies back —
 *     this is the canonical `@supabase/ssr` Next.js pattern. Without
 *     the refresh the session goes stale after its TTL and the user
 *     silently signs themselves out.
 *  2. Gates `/admin/*` (except `/admin/login`): no user, redirect to
 *     the login page; user without `profiles.role = 'admin'`, redirect
 *     to login. The role check is repeated server-side in
 *     `app/(admin)/admin/layout.tsx` as defence-in-depth.
 *
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` and the exported
 * `middleware` function to `proxy`. The body is identical — the rename
 * is purely a name collision with edge runtime terminology.
 *
 * Matcher excludes `/_next/static`, `/_next/image`, the favicon, and
 * common static asset extensions. The CMS dish images live in
 * `menu-assets` on Supabase Storage and are fetched via `next/image`'s
 * optimizer, so they never reach this proxy.
 */
export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const sb = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refresh the session if needed. `getUser()` triggers a JWT refresh
  // when the access token is within ~60s of expiry, and the refreshed
  // cookies flow out via `res.cookies.set`.
  const {
    data: { user },
  } = await sb.auth.getUser();

  const pathname = req.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (isAdminRoute && !isLoginPage) {
    if (!user) {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Role check. `profiles.role = 'admin'` is the gate — the
    // `profiles` table has RLS that lets users read their own row,
    // and admins read all rows. A non-admin user reads their own
    // row, gets `{ role: 'viewer' }` back, and is redirected.
    const { data: profile } = await sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  /**
   * Run on every route except the Next.js asset paths and common
   * image/font extensions. Keeping this list tight means the
   * middleware doesn't fire on `/_next/image?url=...` (which would
   * be a cookie-refresh storm) or on the public favicon.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|webp|avif|woff2?)$).*)",
  ],
};
