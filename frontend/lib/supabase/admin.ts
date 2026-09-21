import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Service-role Supabase client. Bypasses RLS. Server-only.
 *
 * Used by the admin dashboard's Server Actions (`addDishAction`,
 * `updateDishAction`, etc.) and by the seed script. The
 * service-role key is the only key that can INSERT/UPDATE/DELETE
 * menu rows under the current RLS policies; without this client
 * the dashboard would have to add itself to the `profiles` table
 * via a roundabout sign-up dance.
 *
 * READ THIS BEFORE TOUCHING THIS FILE.
 *
 * - The `server-only` import is a build-time guard. If a client
 *   component ever tries to import this file, the build fails.
 * - The service-role key is treated as a production secret. NEVER
 *   expose it via a `NEXT_PUBLIC_*` env var.
 * - The browser never sees this key — every mutation the dashboard
 *   issues goes through a Server Action which calls this client.
 *   If you find yourself calling `getSupabaseAdmin` from a client
 *   component, stop: that's a security bug.
 */
export function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
