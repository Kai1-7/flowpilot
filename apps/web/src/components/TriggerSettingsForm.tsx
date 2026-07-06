import type { TriggerType } from "@flowpilot/shared";
import type { BuilderDraft } from "../lib/builder";
import { normalizeTriggerSettings } from "../lib/builder";

const triggerOptions: Array<{ value: TriggerType; label: string; help: string }> = [
  { value: "manual", label: "Manual", help: "Run from the dashboard when needed." },
  { value: "scheduled", label: "Scheduled", help: "Run automatically every configured interval." },
  { value: "webhook", label: "Webhook", help: "Run when JSON is posted to a generated endpoint." }
];

export function TriggerSettingsForm({
  draft,
  onChange
}: {
  draft: BuilderDraft;
  onChange: (draft: BuilderDraft) => void;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-bold text-zinc-950">Automation settings</h2>
        <p className="mt-1 text-sm text-zinc-600">Name the workflow and decide how it starts.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-zinc-700">Name</span>
          <input
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-zinc-700">Retries</span>
          <input
            type="number"
            min={0}
            max={3}
            value={draft.retryLimit}
            onChange={(event) => onChange({ ...draft, retryLimit: Number(event.target.value) })}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-zinc-700">Description</span>
        <textarea
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          rows={3}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
        />
      </label>

      <div>
        <div className="text-sm font-semibold text-zinc-700">Trigger</div>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          {triggerOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(normalizeTriggerSettings(draft, option.value))}
              className={`rounded-lg border p-3 text-left ${
                draft.triggerType === option.value
                  ? "border-cyan-300 bg-cyan-50 text-cyan-950"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-cyan-200"
              }`}
            >
              <div className="text-sm font-bold">{option.label}</div>
              <div className="mt-1 text-xs leading-5 text-zinc-500">{option.help}</div>
            </button>
          ))}
        </div>
      </div>

      {draft.triggerType === "scheduled" ? (
        <label className="block max-w-xs">
          <span className="text-sm font-semibold text-zinc-700">Interval seconds</span>
          <input
            type="number"
            min={30}
            max={86_400}
            value={draft.schedule?.intervalSeconds ?? 300}
            onChange={(event) =>
              onChange({ ...draft, schedule: { intervalSeconds: Number(event.target.value) } })
            }
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </label>
      ) : null}

      {draft.triggerType === "webhook" ? (
        <label className="block max-w-lg">
          <span className="text-sm font-semibold text-zinc-700">Webhook slug</span>
          <input
            value={draft.webhookSlug}
            onChange={(event) => onChange({ ...draft, webhookSlug: event.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </label>
      ) : null}
    </div>
  );
}
