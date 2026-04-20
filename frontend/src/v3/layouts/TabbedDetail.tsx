import { type ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Tab = {
  value: string;
  label: string;
  content: ReactNode;
};

type Props = {
  breadcrumb?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs: Tab[];
  defaultTab?: string;
};

export function TabbedDetail({ breadcrumb, title, subtitle, actions, tabs, defaultTab }: Props) {
  return (
    <div className="flex flex-col gap-4 p-6">
      {breadcrumb && <nav className="text-sm text-muted-foreground">{breadcrumb}</nav>}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </header>
      <Tabs defaultValue={defaultTab ?? tabs[0]?.value}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            {t.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
