import { useState } from "react";
import { Link } from "react-router-dom";
import { useFrappeList } from "../../hooks/useFrappeList";
import { useRealtime } from "../../hooks/useRealtime";
import { ListLayout } from "../../layouts/ListLayout";
import { FilterChips } from "../../components/FilterChips";
import { StatusBadge } from "../../components/StatusBadge";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";

type Job = {
  name: string;
  job_type: string;
  status: string;
  modified: string;
  approval_status?: string;
};

const STATUS = [
  { label: "Pending", value: "pending" },
  { label: "Running", value: "running" },
  { label: "Succeeded", value: "succeeded" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function JobsList() {
  const [status, setStatus] = useState<string | null>(null);
  const filters: [string, string, unknown][] = [];
  if (status) filters.push(["status", "=", status]);

  const { data, isLoading, error, refetch } = useFrappeList<Job>("Agent Job", {
    filters,
    fields: ["name", "job_type", "status", "modified", "approval_status"],
    order_by: "modified desc",
    limit: 100,
  });

  useRealtime({ channel: "esm:agent_job_status_change", invalidate: [["Agent Job", "list"]] });

  return (
    <ListLayout
      title="Agent Jobs"
      filters={<FilterChips label="Status" options={STATUS} value={status} onChange={setStatus} />}
    >
      {isLoading && <SkeletonRows rows={10} cols={4} />}
      {error && <ErrorFallback error={error} onRetry={() => void refetch()} />}
      {data && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">Job</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Approval</th>
            <th className="px-4 py-2 text-left">Modified</th>
          </tr></thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No jobs yet.</td></tr>
            )}
            {data.map((j) => (
              <tr key={j.name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2">
                  <Link to={`/v3/jobs/${encodeURIComponent(j.name)}`} className="font-mono text-blue-600 hover:underline">{j.name}</Link>
                </td>
                <td className="px-4 py-2">{j.job_type}</td>
                <td className="px-4 py-2"><StatusBadge status={j.status} /></td>
                <td className="px-4 py-2">{j.approval_status ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">{new Date(j.modified).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ListLayout>
  );
}
