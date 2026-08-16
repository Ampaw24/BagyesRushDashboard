"use client";

import { COMPOSER_STEPS, useCommunicationComposer } from "../../_hooks/use-communication-composer";
import { ProgressSteps } from "../../_components/progress-steps";
import { AudienceStep } from "./audience-step";
import { ChannelsStep } from "./channels-step";
import { ContentStep } from "./content-step";
import { ScheduleStep } from "./schedule-step";
import { ReviewStep } from "./review-step";
import type { AudienceDirectoryEntry, AudienceSegment, CommunicationTemplate, CommunicationType } from "../../_services/communications-mock-data";

type CommunicationComposerProps = {
  directory: AudienceDirectoryEntry[];
  segments: AudienceSegment[];
  initialType: CommunicationType;
  template?: CommunicationTemplate;
};

export function CommunicationComposer({ directory, segments, initialType, template }: CommunicationComposerProps) {
  const composer = useCommunicationComposer(directory, segments, initialType, template);
  const { state, stepErrors, next, back, goToStep, submitStatus } = composer;
  const isReviewStep = state.step === COMPOSER_STEPS.length - 1;

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm sm:p-6">
      <ProgressSteps steps={COMPOSER_STEPS} currentStep={state.step} onStepClick={goToStep} />

      {state.step === 0 && <AudienceStep composer={composer} directory={directory} segments={segments} />}
      {state.step === 1 && <ChannelsStep composer={composer} />}
      {state.step === 2 && <ContentStep composer={composer} />}
      {state.step === 3 && <ScheduleStep composer={composer} />}
      {state.step === 4 && <ReviewStep composer={composer} segments={segments} />}

      {!isReviewStep && (
        <div className="flex items-center justify-between border-t border-border-subtle pt-5">
          <button
            type="button"
            onClick={back}
            disabled={state.step === 0}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <div className="flex flex-col items-end gap-1">
            {stepErrors.length > 0 && <p className="text-xs text-status-critical">{stepErrors[0]}</p>}
            <button
              type="button"
              onClick={next}
              disabled={stepErrors.length > 0 || submitStatus.phase === "submitting"}
              className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
