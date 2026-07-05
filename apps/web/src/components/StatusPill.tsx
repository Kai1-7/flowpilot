import { statusTone } from "../lib/format";

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusTone(status)}`}>
      {status}
    </span>
  );
}
