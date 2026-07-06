import { CheckCircle2 } from "lucide-react";

const steps = ["Template", "Settings", "Configure", "Review"];

export function BuilderStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-4">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <li
            key={step}
            className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 ${
              isCurrent
                ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                : isComplete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-zinc-200 bg-white text-zinc-500"
            }`}
          >
            <span
              className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                isComplete ? "bg-emerald-500 text-white" : isCurrent ? "bg-cyan-500 text-white" : "bg-zinc-100"
              }`}
            >
              {isComplete ? <CheckCircle2 size={15} /> : index + 1}
            </span>
            <span className="text-sm font-semibold">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
