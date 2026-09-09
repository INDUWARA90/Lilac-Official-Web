"use client";

import { useEffect, useState } from "react";
import { StepIndicator, type FlowStep } from "@/components/ui/StepIndicator";
import { AdStep } from "@/components/flow/AdStep";
import { EntryForm } from "@/components/flow/EntryForm";
import { CheckEmailStep } from "@/components/flow/CheckEmailStep";
import { track } from "@/components/flow/track";
import type { VideoConfig } from "@/lib/video-shared";

/**
 * Client orchestrator for the public flow on `/`:
 *   watch  → the ad (records when it was finished/skipped)
 *   enter  → the entry form
 *   sent   → "confirm your entry" holding screen
 *
 * The final "Confirm" step happens on /verify (from the emailed link), so it's
 * not a state here — but the step indicator reflects where the user is.
 */
type Phase = "watch" | "enter" | "sent";

const STEP_FOR_PHASE: Record<Phase, FlowStep> = {
  watch: "Watch",
  enter: "Enter",
  sent: "Confirm",
};

export function EntryExperience({ video }: { video: VideoConfig }) {
  const [phase, setPhase] = useState<Phase>("watch");
  const [adWatchedAt, setAdWatchedAt] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  // Funnel: landing on the flow counts as an ad view.
  useEffect(() => track("ad_view"), []);

  return (
    <div className="flex flex-col gap-10 py-4">
      <StepIndicator current={STEP_FOR_PHASE[phase]} />

      {phase === "watch" && (
        <AdStep
          video={video}
          onDone={(watchedAt) => {
            track("ad_complete");
            setAdWatchedAt(watchedAt);
            setPhase("enter");
          }}
        />
      )}

      {phase === "enter" && (
        <EntryForm
          adWatchedAt={adWatchedAt}
          onSubmitted={(submittedEmail) => {
            setEmail(submittedEmail);
            setPhase("sent");
          }}
        />
      )}

      {phase === "sent" && <CheckEmailStep email={email} />}
    </div>
  );
}
