"use server";

import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Sign out and bounce to the login page.
 *
 * The Server Action wraps the auth call so it can be triggered from a
 * `<form action={signOutAction}>` — no client component needed, and
 * the cookies get cleared server-side.
 */
export async function signOutAction() {
  const sb = await getSupabaseServer();
  await sb.auth.signOut();
  redirect("/admin/login");
}
