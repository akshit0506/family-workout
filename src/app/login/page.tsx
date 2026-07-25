"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { APP_NAME } from "@/lib/config";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AthleteOption = { id: string; name: string; claimed: boolean };
type Phase = "email" | "select-athlete" | "otp" | "success";
type Status = "idle" | "busy" | "error";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Local Supabase's SMTP catch-all never delivers to a real inbox by design
// — every OTP email lands in Mailpit instead. Worth surfacing directly on
// this screen: nothing about "the code didn't arrive" is actually broken
// in that case, but there's no way to guess that from the UI alone.
const IS_LOCAL_SUPABASE =
  SUPABASE_URL.includes("127.0.0.1") || SUPABASE_URL.includes("localhost");

// A session can exist with no linked athlete yet (sign-up is open now —
// see the auth_claim migration). fetchCurrentAthlete() sends people back
// here with ?resume=1 in that case, so this page can skip straight to
// picking a name instead of asking them to sign in again.
function LoginPageInner() {
  const resuming = useSearchParams().get("resume") === "1";

  const [checkingSession, setCheckingSession] = useState(!resuming);
  const [phase, setPhase] = useState<Phase>(resuming ? "select-athlete" : "email");
  const [authenticated, setAuthenticated] = useState(resuming);
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [claimAthlete, setClaimAthlete] = useState<AthleteOption | null>(null);
  const [confirmingAthlete, setConfirmingAthlete] = useState<AthleteOption | null>(null);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Returning visitors with an already-valid session should never see the
  // sign-in form at all. Checked once on mount (not on every render) —
  // if a session exists, hand off to the server via a real navigation:
  // it lands on Home if claimed, or bounces back here with ?resume=1 if
  // not, which this effect won't re-trigger since `resuming` is then true.
  useEffect(() => {
    if (resuming) {
      loadAthletes();
      return;
    }

    let cancelled = false;
    (async () => {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user) {
        window.location.assign("/");
        return;
      }
      setCheckingSession(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [resuming]);

  async function loadAthletes() {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("athlete_claim_status")
      .select("id, name, claimed")
      .order("name", { ascending: true });
    if (!error && data) setAthletes(data);
  }

  async function handleFirstTime() {
    setStatus("idle");
    setErrorMessage("");
    await loadAthletes();
    setPhase("select-athlete");
  }

  function handleSelectAthlete(athlete: AthleteOption) {
    if (athlete.claimed) return;
    setClaimAthlete(athlete);

    if (authenticated) {
      // Already verified (resumed session) — go straight to confirming,
      // no need to re-prove ownership of the email again.
      setConfirmingAthlete(athlete);
    } else {
      setPhase("email");
    }
  }

  async function attemptClaim(athlete: AthleteOption) {
    setStatus("busy");
    setErrorMessage("");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.rpc("claim_athlete", { target_athlete_id: athlete.id });

    if (error) {
      setErrorMessage(error.message || "Couldn't claim that profile — try again.");
      setStatus("error");
      await loadAthletes();
      setPhase("select-athlete");
      return;
    }

    setStatus("idle");
    setPhase("success");
  }

  async function handleCancelClaim() {
    setConfirmingAthlete(null);
    // Otherwise cancelling after a first-time OTP verify would leave the
    // visitor stranded on the (now-used) code form with no clear next
    // step — send them back to pick a different name instead, same as
    // an "already claimed" RPC rejection does.
    await loadAthletes();
    setPhase("select-athlete");
  }

  async function handleConfirmClaim() {
    const athlete = confirmingAthlete;
    setConfirmingAthlete(null);
    if (athlete) await attemptClaim(athlete);
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("busy");
    setErrorMessage("");

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Sign-up is open now — anyone can request a code — but that
        // account can only ever attach itself to one still-unclaimed
        // athlete row (claim_athlete()), never create a new one.
        shouldCreateUser: true,
      },
    });

    if (error) {
      setErrorMessage("Couldn't send a code to that address — check it and try again.");
      setStatus("error");
      return;
    }

    setStatus("idle");
    setPhase("otp");
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("busy");
    setErrorMessage("");

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otpCode.trim(),
      type: "email",
    });

    if (error) {
      setErrorMessage("That code didn't work — check it and try again.");
      setStatus("error");
      return;
    }

    setAuthenticated(true);
    setStatus("idle");
    if (claimAthlete) {
      setConfirmingAthlete(claimAthlete);
    } else {
      window.location.assign("/");
    }
  }

  async function handleResend() {
    setStatus("busy");
    setErrorMessage("");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setStatus(error ? "error" : "idle");
    if (error) setErrorMessage("Couldn't resend the code — try again in a moment.");
  }

  useEffect(() => {
    if (phase !== "success") return;
    const timeout = setTimeout(() => window.location.assign("/"), 1800);
    return () => clearTimeout(timeout);
  }, [phase]);

  if (checkingSession) {
    return (
      <div className="mx-auto flex h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-4 sm:px-6">
        <h1 className="font-display text-2xl uppercase leading-none tracking-tight text-ink/40">
          {APP_NAME}
        </h1>
      </div>
    );
  }

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
                {authenticated
                  ? "Pick your profile to claim it."
                  : "Pick your name, then we'll verify it's you."}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {athletes.map((athlete) => (
                <button
                  key={athlete.id}
                  type="button"
                  disabled={athlete.claimed || status === "busy"}
                  onClick={() => handleSelectAthlete(athlete)}
                  className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left text-sm font-bold transition-colors ${
                    athlete.claimed
                      ? "cursor-not-allowed border-ink/10 text-muted"
                      : "border-ink/15 text-ink hover:bg-ink/5"
                  }`}
                >
                  {athlete.name}
                  {athlete.claimed && (
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">
                      Already claimed
                    </span>
                  )}
                </button>
              ))}
            </div>

            {status === "error" && <p className="text-sm text-rust">{errorMessage}</p>}

            {!authenticated && (
              <button
                type="button"
                onClick={() => setPhase("email")}
                className="text-center text-xs font-bold uppercase tracking-wide text-muted hover:text-ink"
              >
                ‹ Back
              </button>
            )}
          </div>
        )}

        {phase === "email" && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            {claimAthlete && (
              <p className="text-sm text-ink">
                Claiming <span className="font-bold">{claimAthlete.name}</span>&rsquo;s profile.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-bold text-ink">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="rounded-lg border-2 border-ink/15 bg-card px-4 py-3 text-sm text-ink outline-none focus:border-rust"
              />
            </div>

            {status === "error" && <p className="text-sm text-rust">{errorMessage}</p>}

            <Button type="submit" variant="solid" fullWidth disabled={status === "busy"}>
              {status === "busy" ? "Sending…" : "Send me a code"}
            </Button>

            {claimAthlete ? (
              <button
                type="button"
                onClick={() => setPhase("select-athlete")}
                className="text-center text-xs font-bold uppercase tracking-wide text-muted hover:text-ink"
              >
                ‹ Pick a different name
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFirstTime}
                className="text-center text-xs font-bold uppercase tracking-wide text-rust hover:opacity-70"
              >
                First time? Claim your profile
              </button>
            )}

            <p className="text-center text-xs text-muted">
              This is a private app for the family — there&apos;s no public sign-up beyond
              claiming an existing profile above.
            </p>
          </form>
        )}

        {phase === "otp" && (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
            <div>
              <p className="font-bold text-ink">Enter your code</p>
              <p className="text-sm text-muted">
                We sent a 6-digit code to <span className="font-bold text-ink">{email}</span>.
              </p>
              {IS_LOCAL_SUPABASE && (
                <p className="mt-1 text-xs text-muted">
                  Running locally: codes land in{" "}
                  <a
                    href="http://127.0.0.1:54324"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-rust hover:opacity-70"
                  >
                    Mailpit
                  </a>
                  , not a real inbox.
                </p>
              )}
            </div>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="rounded-lg border-2 border-ink/15 bg-card px-4 py-3 text-center text-lg font-bold tracking-[0.5em] text-ink outline-none focus:border-rust"
            />

            {status === "error" && <p className="text-sm text-rust">{errorMessage}</p>}

            <Button
              type="submit"
              variant="solid"
              fullWidth
              disabled={status === "busy" || otpCode.length < 6}
            >
              {status === "busy" ? "Verifying…" : "Verify"}
            </Button>

            <button
              type="button"
              onClick={handleResend}
              disabled={status === "busy"}
              className="text-center text-xs font-bold uppercase tracking-wide text-muted hover:text-ink"
            >
              Resend code
            </button>
          </form>
        )}

        {phase === "success" && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <span className="text-3xl">🎉</span>
            <p className="font-bold text-ink">
              Welcome, {claimAthlete?.name}!
            </p>
            <p className="text-sm text-muted">
              Your profile has been successfully linked. You&rsquo;re all set!
            </p>
            <Button
              variant="solid"
              className="mt-2"
              onClick={() => window.location.assign("/")}
            >
              Continue
            </Button>
          </div>
        )}
      </Card>

      <ConfirmationDialog
        open={confirmingAthlete !== null}
        title="Claim Profile"
        message={`You're about to claim the profile for ${confirmingAthlete?.name}. This action permanently links your verified email address to this profile and cannot be changed later.`}
        confirmLabel="Claim Profile"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmClaim}
        onCancel={handleCancelClaim}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
