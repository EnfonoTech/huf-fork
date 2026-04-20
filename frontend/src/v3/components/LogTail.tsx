type Props = {
  lines: string[] | undefined;
  maxHeight?: string;
  empty?: string;
};

export function LogTail({ lines, maxHeight = "360px", empty = "No output yet." }: Props) {
  if (!lines || lines.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">{empty}</div>;
  }
  return (
    <pre
      className="overflow-auto rounded-md bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-50"
      style={{ maxHeight }}
    >
      {lines.join("\n")}
    </pre>
  );
}
