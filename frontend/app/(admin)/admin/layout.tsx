import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Admin shell.
 *
 * SERVER-SIDE AUTH CHECK. The proxy already gates `/admin/*` on
 * `auth.getUser()` + `profiles.role = 'admin'`, but the layout re-
 * checks on every request. Two reasons:
 *
 *   1. Defence-in-depth. A future change to the matcher that accidentally
 *      excludes `/admin` would not silently open the dashboard.
 *   2. The proxy can only read the cookie; the layout can call
 *      `getUser()` directly and resolve to the same user without a
 *      second redirect.
 *
 * The login page lives at `/admin/login` OUTSIDE this route group so
 * the gate does not run on it — otherwise an unauthenticated visit
 * would be redirected back to `/admin/login` in an infinite loop.
 *
 * Dark theme. The public site is light-by-default with `data-tone="dark"`
 * for the hero and bar book. The admin dashboard flips the whole shell
 * to dark via `[data-tone="dark"]` on the wrapping `<div>`, so the
 * semantic token layer (`text-ink`, `bg-surface`, `border-line`) re-
 * maps to the dark values automatically — no per-component hardcoding.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div data-tone="dark" className="min-h-screen bg-surface text-ink">
      {children}
    </div>
  );
}
