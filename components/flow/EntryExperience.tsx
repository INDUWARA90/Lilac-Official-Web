"use client";

import { useEffect, useState } from "react";
import { StepIndicator, type FlowStep } from "@/components/ui/StepIndicator";
import { AdsStep } from "@/components/flow/AdsStep";
import { EntryForm } from "@/components/flow/EntryForm";
import { SuccessCelebration } from "@/components/flow/SuccessCelebration";
import { track } from "@/components/flow/track";
import type { Ad } from "@/lib/ads-shared";

type Phase = "watch" | "enter" | "done";

const STEP_FOR_PHASE: Record<Phase, FlowStep> = {
  watch: "Watch",
  enter: "Enter",
  done: "Confirm",
};

export function EntryExperience({
  ads,
  adSession,
}: {
  ads: Ad[];
  adSession: string;
}) {
  const [phase, setPhase] = useState<Phase>("watch");
  const [firstName, setFirstName] = useState("there");

  // Funnel: landing on the flow counts as an ad view.
  useEffect(() => track("ad_view"), []);

  return (
    <div className="flex flex-col gap-10 py-4">
      <StepIndicator current={STEP_FOR_PHASE[phase]} />

      {phase === "watch" && (
        <AdsStep
          ads={ads}
          onDone={() => {
            track("ad_complete");
            setPhase("enter");
          }}
        />
      )}

      {phase === "enter" && (
        <EntryForm
          adSession={adSession}
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
