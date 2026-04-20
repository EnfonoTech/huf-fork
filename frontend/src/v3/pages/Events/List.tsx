import { useState } from "react";
import { useFrappeList } from "../../hooks/useFrappeList";
import { useRealtime } from "../../hooks/useRealtime";
import { ListLayout } from "../../layouts/ListLayout";
import { FilterChips } from "../../components/FilterChips";
import { StatusBadge } from "../../components/StatusBadge";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";
import { Input } from "@/components/ui/input";

type SystemEvent = {
  name: string;
  level: string;
  source: string;
  message: string;
  creation: string;
};

const LEVELS = [
  { label: "Info", value: "info" },
  { label: "Warn", value: "warn" },
  { label: "Error", value: "error" },
  { label: "Critical", value: "critical" },
];

export default function EventsList() {
  const [level, setLevel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const filters: [string, string, unknown][] = [];
  if (level) filters.push(["level", "=", level]);
  if (q)     filters.push(["message", "like", `%${q}%`]);

  const { data, isLoading, error, refetch } = useFrappeList<SystemEvent>("System Event", {
    filters,
    fields: ["name", "level", "source", "message", "creation"],
    order_by: "creation desc",
    limit: 200,
  });

  useRealtime({ channel: "esm:system_event_created", invalidate: [["System Event", "list"]] });

  return (
    <ListLayout
      title="System Events"
      filters={<FilterChips label="Level" options={LEVELS} value={level} onChange={setLevel} />}
      search={<Input placeholder="Search message…" value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />}
    >
      {isLoading && <SkeletonRows rows={10} cols={4} />}
      {error && <ErrorFallback error={error} onRetry={() => void refetch()} />}
      {data && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">When</th>
            <th className="px-4 py-2 text-left">Level</th>
            <th className="px-4 py-2 text-left">Source</th>
            <th className="px-4 py-2 text-left">Message</th>
          </tr></thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No events yet.</td></tr>
            )}
            {data.map((e) => (
              <tr key={e.name} className="border-b last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{new Date(e.creation).toLocaleString()}</td>
                <td className="px-4 py-2"><StatusBadge status={e.level} /></td>
                <td className="px-4 py-2">{e.source}</td>
                <td className="px-4 py-2">{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ListLayout>
  );
}
