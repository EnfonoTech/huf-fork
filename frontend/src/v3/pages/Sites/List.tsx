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

type Site = {
  name: string;
  site_id: string;
  domain: string;
  server: string;
  status: string;
  access_mode: string;
};

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Provisioning", value: "provisioning" },
  { label: "Broken", value: "broken" },
  { label: "Archived", value: "archived" },
];

export default function SitesList() {
  const [status, setStatus] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filters: [string, string, unknown][] = [];
  if (status) filters.push(["status", "=", status]);
  if (q)      filters.push(["domain", "like", `%${q}%`]);

  const { data, isLoading, error, refetch } = useFrappeList<Site>("Site", {
    filters,
    fields: ["name", "site_id", "domain", "server", "status", "access_mode"],
    order_by: "modified desc",
    limit: 100,
  });

  useRealtime({
    channel: "esm:site_status_change",
    invalidate: [["Site", "list"]],
  });

  return (
    <ListLayout
      title="Sites"
      filters={<FilterChips label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />}
      search={<Input placeholder="Search by domain…" value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />}
    >
      {isLoading && <SkeletonRows rows={8} cols={5} />}
      {error && <ErrorFallback error={error} onRetry={() => void refetch()} />}
      {data && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">Domain</th>
            <th className="px-4 py-2 text-left">Server</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Access</th>
          </tr></thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No sites yet.</td></tr>
            )}
            {data.map((s) => (
              <tr key={s.name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2">
                  <Link to={`/v3/sites/${encodeURIComponent(s.name)}`} className="font-mono text-blue-600 hover:underline">
                    {s.domain}
                  </Link>
                </td>
                <td className="px-4 py-2">{s.server}</td>
                <td className="px-4 py-2"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-2">{s.access_mode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ListLayout>
  );
}
