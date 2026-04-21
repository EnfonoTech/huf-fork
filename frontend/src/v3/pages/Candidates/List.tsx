import { useState } from "react";
import { Link } from "react-router-dom";
import { useFrappeList } from "../../hooks/useFrappeList";
import { useRealtime } from "../../hooks/useRealtime";
import { ListLayout } from "../../layouts/ListLayout";
import { FilterChips } from "../../components/FilterChips";
import { StatusBadge } from "../../components/StatusBadge";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";
import { Button } from "@/components/ui/button";

type Candidate = {
  name: string;
  template: string;
  status: string;
  image_tag: string | null;
  image_size_mb: number | null;
  built_on_server: string | null;
  built_at: string | null;
};

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Building", value: "building" },
  { label: "Built", value: "built" },
  { label: "Failed", value: "failed" },
];

export default function CandidatesList() {
  const [status, setStatus] = useState<string | null>(null);

  const filters: [string, string, unknown][] = [];
  if (status) filters.push(["status", "=", status]);

  const { data, isLoading, error, refetch } = useFrappeList<Candidate>("Deploy Candidate", {
    filters,
    fields: ["name", "template", "status", "image_tag", "image_size_mb", "built_on_server", "built_at"],
    order_by: "modified desc",
    limit: 100,
  });

  useRealtime({
    channel: "esm:agent_job_status_change",
    invalidate: [["Deploy Candidate", "list"]],
  });

  return (
    <ListLayout
      title="Deploy Candidates"
      actions={<Button asChild><a href="/app/deploy-candidate/new">+ New Candidate</a></Button>}
      filters={<FilterChips label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />}
    >
      {isLoading && <SkeletonRows rows={8} cols={5} />}
      {error && <ErrorFallback error={error} onRetry={() => void refetch()} />}
      {data && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Template</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Image Tag</th>
            <th className="px-4 py-2 text-left">Built On</th>
            <th className="px-4 py-2 text-left">Built At</th>
          </tr></thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No candidates yet.</td></tr>
            )}
            {data.map((c) => (
              <tr key={c.name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2">
                  <Link to={`/v3/candidates/${encodeURIComponent(c.name)}`} className="font-mono text-blue-600 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{c.template}</td>
                <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-2 font-mono text-xs">{c.image_tag ?? "—"}</td>
                <td className="px-4 py-2">{c.built_on_server ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">{c.built_at ? new Date(c.built_at).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ListLayout>
  );
}
