"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    // Full navigation (not router.push) so every client-side cache —
    // AppStateProvider's state included — is thrown away rather than
    // carried over to whoever signs in next on this device.
    window.location.assign("/login");
  }

  return (
    <Button variant="outline" fullWidth onClick={handleSignOut} disabled={signingOut}>
      {signingOut ? "Signing out…" : "Sign out"}
    </Button>
  );
}
