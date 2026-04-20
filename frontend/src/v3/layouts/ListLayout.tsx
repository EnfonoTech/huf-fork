import { type ReactNode } from "react";

type Props = {
  title: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  search?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
};

export function ListLayout({ title, breadcrumb, actions, filters, search, children, pagination }: Props) {
  return (
    <div className="flex flex-col gap-4 p-6">
      {breadcrumb && <nav className="text-sm text-muted-foreground">{breadcrumb}</nav>}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {actions && <div className="flex gap-2">{actions}</div>}
      </header>
      {(filters || search) && (
        <div className="flex flex-wrap items-center gap-3">
          {filters}
          {search && <div className="ml-auto">{search}</div>}
        </div>
      )}
      <div className="rounded-md border bg-card">{children}</div>
      {pagination && <footer className="flex justify-end">{pagination}</footer>}
    </div>
  );
}
