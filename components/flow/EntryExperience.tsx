"use client";

import { useEffect, useState } from "react";
import { StepIndicator, type FlowStep } from "@/components/ui/StepIndicator";
import { AdStep } from "@/components/flow/AdStep";
import { EntryForm } from "@/components/flow/EntryForm";
import { SuccessCelebration } from "@/components/flow/SuccessCelebration";
import { track } from "@/components/flow/track";
import type { VideoConfig } from "@/lib/video-shared";

/**
 * Client orchestrator for the public flow on `/`:
 *   watch  → the ad (records when it was finished/skipped)
 *   enter  → the entry form
 *   done   → the success screen (confetti)
 *
 * There is no email-confirmation step — an entry counts the moment it's
 * submitted. Winners are notified by email after a draw.
 */
type Phase = "watch" | "enter" | "done";

const STEP_FOR_PHASE: Record<Phase, FlowStep> = {
  watch: "Watch",
  enter: "Enter",
  done: "Confirm",
};

export function EntryExperience({ video }: { video: VideoConfig }) {
  const [phase, setPhase] = useState<Phase>("watch");
  const [adWatchedAt, setAdWatchedAt] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("there");

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
          onSubmitted={(r) => {
            setFirstName(r.firstName);
            setPhase("done");
          }}
        />
      )}

      {phase === "done" && <SuccessCelebration firstName={firstName} />}
    </div>
  );
}
