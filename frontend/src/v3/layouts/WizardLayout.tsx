import { type ReactNode } from "react";

type Props = { title: string; children: ReactNode };
export function WizardLayout({ title, children }: Props) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="rounded-md border bg-card p-6">{children}</div>
    </div>
  );
}
