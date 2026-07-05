export function formatDate(value: string | null | undefined): string {
  if (!value) return "Pending";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatDuration(value: number | null | undefined): string {
  if (value === null || value === undefined) return "n/a";
  if (value < 1000) return `${value}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

export function statusTone(status: string): string {
  switch (status) {
    case "success":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "failed":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "running":
      return "bg-cyan-50 text-cyan-700 ring-cyan-200";
    case "skipped":
      return "bg-zinc-100 text-zinc-600 ring-zinc-200";
    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}
