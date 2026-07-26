"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { APP_NAME } from "@/lib/config";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AthleteOption = { id: string; name: string; claimed: boolean };
type Phase = "select-athlete" | "phone" | "success";
type Status = "idle" | "busy" | "error";

const PHONE_PATTERN = /^\d{10}$/;

// An anonymous session already existing (from an earlier abandoned attempt
// on this device) shouldn't be thrown away and replaced — that would orphan
// it for no reason. Only sign in anonymously if there's genuinely no
// session yet.
async function ensureAnonymousSession(supabase: ReturnType<typeof createBrowserSupabaseClient>) {
  const { data } = await supabase.auth.getUser();
  if (data.user) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

export default function LoginPage() {
  const [phase, setPhase] = useState<Phase>("select-athlete");
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteOption | null>(null);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [confirmingClaim, setConfirmingClaim] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadAthletes();
  }, []);

  async function loadAthletes() {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("athlete_claim_status")
      .select("id, name, claimed")
      .order("name", { ascending: true });
    if (!error && data) setAthletes(data);
  }

  function handleSelectAthlete(athlete: AthleteOption) {
    setSelectedAthlete(athlete);
    setPhoneDigits("");
    setStatus("idle");
    setErrorMessage("");
    setPhase("phone");
  }

  function handleBackToRoster() {
    setSelectedAthlete(null);
    setPhoneDigits("");
    setStatus("idle");
    setErrorMessage("");
    setPhase("select-athlete");
  }

  async function performClaim() {
    if (!selectedAthlete) return;
    setStatus("busy");
    setErrorMessage("");

    const supabase = createBrowserSupabaseClient();
    try {
      await ensureAnonymousSession(supabase);
      const { error } = await supabase.rpc("claim_athlete_with_phone", {
        target_athlete_id: selectedAthlete.id,
        phone: `+91${phoneDigits}`,
      });
      if (error) throw error;

      setStatus("idle");
      setPhase("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Couldn't claim that profile — try again."
      );
      setStatus("error");
      await loadAthletes();
    }
  }

  async function performLogin() {
    if (!selectedAthlete) return;
    setStatus("busy");
    setErrorMessage("");

    const supabase = createBrowserSupabaseClient();
    try {
      await ensureAnonymousSession(supabase);
      const { error } = await supabase.rpc("login_with_phone", {
        target_athlete_id: selectedAthlete.id,
        phone: `+91${phoneDigits}`,
      });
      if (error) throw error;

      setStatus("idle");
      setPhase("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "That number doesn't match our records for this profile."
      );
      setStatus("error");
    }
  }

  function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAthlete || !PHONE_PATTERN.test(phoneDigits)) return;

    if (selectedAthlete.claimed) {
      performLogin();
    } else {
      setConfirmingClaim(true);
    }
  }

  async function handleConfirmClaim() {
    setConfirmingClaim(false);
    await performClaim();
  }

  useEffect(() => {
    if (phase !== "success") return;
    const timeout = setTimeout(() => window.location.assign("/"), 1800);
    return () => clearTimeout(timeout);
  }, [phase]);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <Eyebrow>Est. 2026 · Family only</Eyebrow>
        <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-ink">
          {APP_NAME}
        </h1>
      </div>

      <Card emphasis>
        {phase === "select-athlete" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-bold text-ink">Which one are you?</p>
              <p className="text-sm text-muted">
                Pick your name, then enter your mobile number.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {athletes.map((athlete) => (
                <button
                  key={athlete.id}
                  type="button"
                  onClick={() => handleSelectAthlete(athlete)}
                  className="flex items-center justify-between rounded-lg border-2 border-ink/15 px-4 py-3 text-left text-sm font-bold text-ink transition-colors hover:bg-ink/5"
                >
                  {athlete.name}
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-muted">
              This is a private app for the family — there&apos;s no public sign-up beyond
              the roster above.
            </p>
          </div>
        )}

        {phase === "phone" && selectedAthlete && (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-ink">
              {selectedAthlete.claimed ? (
                <>
                  Signing in as <span className="font-bold">{selectedAthlete.name}</span>.
                </>
              ) : (
                <>
                  Claiming <span className="font-bold">{selectedAthlete.name}</span>&rsquo;s
                  profile.
                </>
              )}
            </p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-sm font-bold text-ink">
                Mobile number
              </label>
              <div className="flex items-center gap-2">
                <span className="flex h-[46px] items-center rounded-lg border-2 border-ink/15 bg-ink/5 px-3 text-sm font-bold text-ink">
                  +91
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  required
                  autoFocus
                  value={phoneDigits}
                  onChange={(event) =>
                    setPhoneDigits(event.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="10-digit number"
                  className="flex-1 rounded-lg border-2 border-ink/15 bg-card px-4 py-3 text-sm text-ink outline-none focus:border-rust"
                />
              </div>
            </div>

            {status === "error" && <p className="text-sm text-rust">{errorMessage}</p>}

            <Button
              type="submit"
              variant="solid"
              fullWidth
              disabled={status === "busy" || !PHONE_PATTERN.test(phoneDigits)}
            >
              {status === "busy" ? "Checking…" : "Continue"}
            </Button>

            <button
              type="button"
              onClick={handleBackToRoster}
              className="text-center text-xs font-bold uppercase tracking-wide text-muted hover:text-ink"
            >
              ‹ Pick a different name
            </button>
          </form>
        )}

        {phase === "success" && selectedAthlete && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <span className="text-3xl">🎉</span>
            <p className="font-bold text-ink">Welcome, {selectedAthlete.name}!</p>
            <p className="text-sm text-muted">
              Your profile is linked to this device. You&rsquo;ll only need to enter your phone
              number again if you sign out or use a different device.
            </p>
            <Button variant="solid" className="mt-2" onClick={() => window.location.assign("/")}>
              Continue
            </Button>
          </div>
        )}
      </Card>

      <ConfirmationDialog
        open={confirmingClaim}
        title="Claim Profile"
        message={`You're about to claim the profile for ${selectedAthlete?.name} using +91 ${phoneDigits}. This phone number will be permanently linked to this profile and cannot be changed later.`}
        confirmLabel="Claim Profile"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmClaim}
        onCancel={() => setConfirmingClaim(false)}
      />
    </div>
  );
}
