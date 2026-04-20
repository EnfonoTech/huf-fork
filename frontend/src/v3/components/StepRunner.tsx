import { Check, Circle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = {
  name: string;
  label: string;
  status: "pending" | "running" | "succeeded" | "failed" | "skipped";
  stdoutTail?: string[];
  durationMs?: number;
};

const icon = (s: Step["status"]) => {
  switch (s) {
    case "succeeded":
      return <Check className="h-4 w-4 text-green-600" />;
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    case "failed":
      return <X className="h-4 w-4 text-red-600" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

export function StepRunner({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((s, i) => (
        <li
          key={s.name}
          className={cn(
            "flex items-start gap-3 rounded-md border p-3",
            s.status === "failed" && "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20",
            s.status === "running" && "border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20",
          )}
        >
          <span className="mt-0.5">{icon(s.status)}</span>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-sm">
                {i + 1}. {s.label}
              </span>
              {s.durationMs != null && (
                <span className="text-xs text-muted-foreground">{Math.round(s.durationMs / 100) / 10}s</span>
              )}
            </div>
            {s.stdoutTail && s.stdoutTail.length > 0 && (
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-zinc-950 p-2 font-mono text-xs text-zinc-50">
                {s.stdoutTail.join("\n")}
              </pre>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
