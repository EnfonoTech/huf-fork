import { useState } from "react";
import { Link } from "react-router-dom";
import { useFrappeList } from "../../hooks/useFrappeList";
import { useRealtime } from "../../hooks/useRealtime";
import { ListLayout } from "../../layouts/ListLayout";
import { FilterChips } from "../../components/FilterChips";
import { StatusBadge } from "../../components/StatusBadge";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";
import { Input } from "@/components/ui/input";

type Server = {
  server_name: string;
  mode: string;
  region: string;
  status: string;
  ssh_host: string;
};

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Unreachable", value: "unreachable" },
  { label: "Decommissioning", value: "decommissioning" },
];

export default function ServersList() {
  const [status, setStatus] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filters: [string, string, unknown][] = [];
  if (status) filters.push(["status", "=", status]);
  if (q)      filters.push(["server_name", "like", `%${q}%`]);

  const { data, isLoading, error, refetch } = useFrappeList<Server>("Frappe Server", {
    filters,
    fields: ["name", "server_name", "mode", "region", "status", "ssh_host"],
    order_by: "modified desc",
    limit: 100,
  });

  useRealtime({
    channel: "esm:server_status_change",
    invalidate: [["Frappe Server", "list"]],
  });

  return (
    <ListLayout
      title="Servers"
      filters={<FilterChips label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />}
      search={<Input placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />}
    >
      {isLoading && <SkeletonRows rows={8} cols={5} />}
      {error && <ErrorFallback error={error} onRetry={() => void refetch()} />}
      {data && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Mode</th>
              <th className="px-4 py-2 text-left font-medium">Region</th>
              <th className="px-4 py-2 text-left font-medium">Status</th>
              <th className="px-4 py-2 text-left font-medium">SSH host</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No servers yet.</td></tr>
            )}
            {data.map((s) => (
              <tr key={s.name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2">
                  <Link to={`/v3/servers/${encodeURIComponent(s.name)}`} className="font-mono text-blue-600 hover:underline">
                    {s.server_name}
                  </Link>
                </td>
                <td className="px-4 py-2">{s.mode}</td>
                <td className="px-4 py-2">{s.region}</td>
                <td className="px-4 py-2"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-2 font-mono text-xs">{s.ssh_host}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ListLayout>
  );
}
