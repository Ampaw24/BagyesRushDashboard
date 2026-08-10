import { CheckCircleIcon } from "../_lib/icons";

export function ProgressSteps({ steps, currentStep, onStepClick }: { steps: readonly string[]; currentStep: number; onStepClick?: (step: number) => void }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {steps.map((label, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const clickable = Boolean(onStepClick) && index < currentStep;

        return (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onStepClick?.(index)}
              className={`flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-medium transition duration-150 ${
                isCurrent
                  ? "bg-brand text-brand-foreground"
                  : isComplete
                    ? "bg-brand/10 text-brand"
                    : "bg-surface-muted text-text-muted"
              } ${clickable ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
            >
              {isComplete ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <span>{index + 1}</span>}
              <span className="whitespace-nowrap">{label}</span>
            </button>
            {index < steps.length - 1 && <span className="h-px w-4 shrink-0 bg-border-subtle sm:w-8" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
