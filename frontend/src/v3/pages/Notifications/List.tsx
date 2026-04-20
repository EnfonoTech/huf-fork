import { useState } from "react";
import { useFrappeList } from "../../hooks/useFrappeList";
import { ListLayout } from "../../layouts/ListLayout";
import { FilterChips } from "../../components/FilterChips";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NotificationRule = {
  name: string;
  rule_name: string;
  enabled: number;
  min_level: string;
  source_pattern?: string;
  channel: string;
  target: string;
};

const LEVEL_OPTS = [
  { label: "Info", value: "info" },
  { label: "Warn", value: "warn" },
  { label: "Error", value: "error" },
  { label: "Critical", value: "critical" },
];

export default function NotificationsList() {
  const [minLevel, setMinLevel] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filters: [string, string, unknown][] = [];
  if (minLevel) filters.push(["min_level", "=", minLevel]);
  if (q)        filters.push(["rule_name", "like", `%${q}%`]);

  const { data, isLoading, error, refetch } = useFrappeList<NotificationRule>("Notification Rule", {
    filters,
    fields: ["name", "rule_name", "enabled", "min_level", "source_pattern", "channel", "target"],
    order_by: "modified desc",
    limit: 100,
  });

  return (
    <ListLayout
      title="Notification Rules"
      actions={<Button asChild><a href="/app/notification-rule/new">+ New</a></Button>}
      filters={<FilterChips label="Min level" options={LEVEL_OPTS} value={minLevel} onChange={setMinLevel} />}
      search={<Input placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />}
    >
      {isLoading && <SkeletonRows rows={6} cols={5} />}
      {error && <ErrorFallback error={error} onRetry={() => void refetch()} />}
      {data && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Enabled</th>
            <th className="px-4 py-2 text-left">Min Level</th>
            <th className="px-4 py-2 text-left">Source Pattern</th>
            <th className="px-4 py-2 text-left">Channel</th>
            <th className="px-4 py-2 text-left">Target</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr></thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No notification rules yet.</td></tr>
            )}
            {data.map((r) => (
              <tr key={r.name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2 font-mono">{r.rule_name}</td>
                <td className="px-4 py-2">
                  <Badge variant={r.enabled ? "default" : "outline"}>{r.enabled ? "on" : "off"}</Badge>
                </td>
                <td className="px-4 py-2">{r.min_level}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.source_pattern ?? "—"}</td>
                <td className="px-4 py-2">{r.channel}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.target}</td>
                <td className="px-4 py-2 text-right">
                  <Button asChild variant="outline" size="sm">
                    <a href={`/app/notification-rule/${encodeURIComponent(r.name)}`}>Edit</a>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ListLayout>
  );
}
