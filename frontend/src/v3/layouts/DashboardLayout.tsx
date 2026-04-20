import { type ReactNode } from "react";

type Props = {
  title: string;
  actions?: ReactNode;
  tiles?: ReactNode;
  charts?: ReactNode;
  shortcuts?: ReactNode;
};

export function DashboardLayout({ title, actions, tiles, charts, shortcuts }: Props) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {actions && <div className="flex gap-2">{actions}</div>}
      </header>
      {tiles && <section className="grid grid-cols-2 gap-4 md:grid-cols-4">{tiles}</section>}
      {charts && <section className="grid grid-cols-1 gap-4 md:grid-cols-2">{charts}</section>}
      {shortcuts && <section>{shortcuts}</section>}
    </div>
  );
}
