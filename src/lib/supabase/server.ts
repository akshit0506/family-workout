import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Session-aware server client — reads run as whichever athlete is actually
 * signed in (via cookies), so RLS enforces itself for real instead of being
 * bypassed. This replaces the service-role client the read-path milestone
 * used as a stand-in before auth existed (see FRONTEND_INTEGRATION.md).
 *
 * Deliberately NOT cached at module scope: a session-aware client is bound
 * to one request's cookies, so caching it would leak one user's session
 * into another user's request in the same server process.
 *
 * `setAll` is wrapped in try/catch because Server Components can't set
 * cookies (Next.js only allows that from a Server Action or Route Handler)
 * — middleware.ts is what actually keeps the session cookie refreshed, this
 * is just a no-op fallback for that context.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables. See .env.local.example."
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component render — see doc comment above.
        }
      },
    },
  });
}

/**
 * Returns the signed-in athlete's Supabase Auth user, or null. Every
 * lib/data/* read that needs "who am I" goes through this rather than each
 * re-deriving it, so there's exactly one place that calls auth.getUser().
 */
export async function getAuthUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
