"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Not called anywhere yet — writes still go
 * through AppStateProvider's local state this milestone. Scaffolded now for
 * the magic-link auth milestone, which will need a client-side session.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables. See .env.local.example."
    );
  }

  return createBrowserClient(url, anonKey);
}
