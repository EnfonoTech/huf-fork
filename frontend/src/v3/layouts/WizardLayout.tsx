import { type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  stepLabels?: string[];
  children: ReactNode;
  footer?: ReactNode;
};

export function WizardLayout({ title, subtitle, step, totalSteps, stepLabels, children, footer }: Props) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </header>
      <nav className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={n} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary/20 text-primary ring-2 ring-primary",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : n}
              </div>
              {stepLabels?.[i] && (
                <span className={cn("text-xs", active ? "font-semibold" : "text-muted-foreground")}>
                  {stepLabels[i]}
                </span>
              )}
              {n < totalSteps && <span className="mx-2 h-px w-12 bg-border" />}
            </div>
          );
        })}
      </nav>
      <div className="rounded-md border bg-card p-6">{children}</div>
      {footer && <footer className="flex justify-between">{footer}</footer>}
    </div>
  );
}
