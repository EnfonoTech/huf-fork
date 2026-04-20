import { type ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  to?: string;
  tone?: "default" | "warn" | "danger";
  icon?: ReactNode;
};

export function Tile({ label, value, hint, to, tone = "default", icon }: Props) {
  const toneCls =
    tone === "danger" ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20" :
    tone === "warn"   ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20" :
                        "border-border bg-card";
  const inner = (
    <div className={`flex flex-col gap-1 rounded-lg border p-4 ${toneCls}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon}
      </div>
      <span className="text-3xl font-semibold">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}
