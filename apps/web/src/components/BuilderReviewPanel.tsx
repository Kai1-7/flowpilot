import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { JsonBlock } from "./JsonBlock";
import type { BuilderDraft } from "../lib/builder";
import { buildCreatePayload } from "../lib/builder";

export function BuilderReviewPanel({
  draft,
  validationStatus,
  validationError,
  isCreating,
  onCreate
}: {
  draft: BuilderDraft;
  validationStatus: "idle" | "pending" | "valid" | "invalid";
  validationError: string | null;
  isCreating: boolean;
  onCreate: () => void;
}) {
  return (
    <aside className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-bold text-zinc-950">Review</h2>
        <p className="mt-1 text-sm text-zinc-600">Confirm the final payload before saving the automation.</p>
      </div>

      <div
        className={`rounded-lg border p-3 text-sm ${
          validationStatus === "valid"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : validationStatus === "invalid"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-zinc-200 bg-zinc-50 text-zinc-600"
        }`}
      >
        <div className="flex items-center gap-2 font-semibold">
          {validationStatus === "pending" ? (
            <Loader2 className="animate-spin" size={16} />
          ) : validationStatus === "valid" ? (
            <CheckCircle2 size={16} />
          ) : validationStatus === "invalid" ? (
            <AlertTriangle size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {validationStatus === "valid"
            ? "Config validated"
            : validationStatus === "invalid"
              ? "Config needs attention"
              : validationStatus === "pending"
                ? "Validating config"
                : "Validation pending"}
        </div>
        {validationError ? <p className="mt-2 text-xs leading-5">{validationError}</p> : null}
      </div>

      <JsonBlock value={buildCreatePayload(draft)} />

      <button
        type="button"
        onClick={onCreate}
        disabled={validationStatus !== "valid" || isCreating}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCreating ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
        {isCreating ? "Creating..." : "Create automation"}
      </button>
    </aside>
  );
}
