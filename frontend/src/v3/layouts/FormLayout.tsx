import { type ReactNode } from "react";

type Props = { title: string; actions?: ReactNode; children: ReactNode };
export function FormLayout({ title, actions, children }: Props) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {actions}
      </header>
      <div className="rounded-md border bg-card p-6">{children}</div>
    </div>
  );
}
