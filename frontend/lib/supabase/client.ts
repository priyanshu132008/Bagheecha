"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Browser-side Supabase client, used by the admin dashboard's
 * client components — most notably the sign-in form.
 *
 * This client carries the *anon* key, which respects RLS. Every
 * write the dashboard makes goes through a Server Action that uses
 * the service-role client (see `lib/supabase/admin.ts`); this client
 * only authenticates.
 */
let memo: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getSupabaseBrowser() {
  if (memo) return memo;
  memo = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return memo;
}
