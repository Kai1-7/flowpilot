export function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs leading-5 text-zinc-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
