import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  icon,
  tone
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-zinc-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-zinc-950">{value}</p>
        </div>
        <div className={`grid size-10 place-items-center rounded-lg ${tone}`}>{icon}</div>
      </div>
    </section>
  );
}
