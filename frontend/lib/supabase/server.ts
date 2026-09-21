import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Server-side Supabase client, used by every Server Component,
 * Route Handler, and Server Action that respects RLS.
 *
 * - Reads cookies via `next/headers` (the Next 16 Promise-returning
 *   API). The Supabase Auth helpers depend on a `getAll()` / `setAll()`
 *   pair; the `setAll` only matters on the auth pages and during a
 *   session refresh.
 * - Memoised per request via module scope. Next resets module state
 *   between requests so a fresh instance is allocated each time.
 * - Honours `SUPABASE_FALLBACK_TO_STATIC` only at the query layer
 *   (`lib/menu/queries.ts`) — the client itself is always live.
 *
 * NEVER import this file from a client component. The
 * `server-only` package throws at build time if the import graph
 * reaches a `"use client"` boundary, which is the safety net for
 * the bigger RLS mistake of leaking the service-role key to the
 * browser.
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `set` fails when called from a Server Component (Next
            // doesn't expose a setter there). The middleware in
            // `middleware.ts` is the right place to refresh cookies,
            // so this catch is silent by design.
          }
        },
      },
    },
  );
}
