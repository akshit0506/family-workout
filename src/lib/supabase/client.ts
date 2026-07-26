"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — used by /login for anonymous sign-in and the
 * claim/login RPCs, and by AppStateProvider for authenticated writes.
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
