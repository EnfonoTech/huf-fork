import { type ReactNode } from "react";

type Props = { left: ReactNode; middle: ReactNode; right: ReactNode };
export function OpsLayout({ left, middle, right }: Props) {
  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-3 gap-4 p-6">
      <div className="overflow-auto rounded-md border bg-card">{left}</div>
      <div className="overflow-auto rounded-md border bg-card">{middle}</div>
      <div className="overflow-auto rounded-md border bg-card">{right}</div>
    </div>
  );
}
