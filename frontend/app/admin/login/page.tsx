"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Admin sign-in.
 *
 * CLIENT COMPONENT because the form needs `useState` and the browser
 * Supabase client (`getSupabaseBrowser`) to call `signInWithPassword`.
 *
 * The proxy's auth check excludes `/admin/login`, so a logged-in
 * admin can land here and use the form to switch accounts without
 * being bounced. The form posts to the same route the user came from
 * (via the `next` query string) after a successful sign-in.
 *
 * Dark theme. The admin layout sets `data-tone="dark"` on the shell,
 * and the token layer remaps `text-ink` and `bg-surface` to the dark
 * values. The login page lives inside that shell and inherits the
 * remap, so no per-component colour overrides.
 *
 * WRAPPED IN SUSPENSE. Next.js requires `useSearchParams` to live
 * inside a Suspense boundary at the static-export level, otherwise
 * the build fails with a prerender error.
 */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const sb = getSupabaseBrowser();
    const { error: authError } = await sb.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setPending(false);
      return;
    }

    // Successful sign-in. The middleware checks `profiles.role =
    // 'admin'` server-side on the next request, so a non-admin user
    // who somehow got here gets redirected back to /admin/login by
    // the layout. We do not gate the redirect on the role here —
    // doing so would require a second round-trip and would still
    // rely on the server-side check to be authoritative.
    router.push(nextPath);
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm border border-line-strong bg-surface-sunk p-8 md:p-10"
      >
        <p className="text-[10px] uppercase tracking-[0.28em] text-ink-muted">
          Back of house
        </p>
        <h1 className="mt-3 font-display text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-ink md:text-4xl">
          Sign in
        </h1>
        <p className="mt-3 max-w-xs text-[13px] leading-6 text-ink-muted">
          Sign in with the email and password the owner gave you.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-line-strong"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-line-strong"
            />
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 border border-vermillion/60 bg-vermillion/10 px-4 py-3 text-[12px] leading-5 text-cream"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-8 flex w-full items-center justify-center bg-action px-6 py-4 text-[11px] uppercase tracking-[0.28em] text-action-ink transition-opacity disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
