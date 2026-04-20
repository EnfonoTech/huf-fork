import { useState } from "react";
import { useFrappeList } from "../../hooks/useFrappeList";
import { ListLayout } from "../../layouts/ListLayout";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Runbook = {
  name: string;
  runbook_name: string;
  linked_incident_pattern?: string;
  description?: string;
};

export default function RunbooksList() {
  const [q, setQ] = useState("");
  const filters: [string, string, unknown][] = q ? [["runbook_name", "like", `%${q}%`]] : [];

  const { data, isLoading, error, refetch } = useFrappeList<Runbook>("Runbook", {
    filters,
    fields: ["name", "runbook_name", "linked_incident_pattern", "description"],
    order_by: "modified desc",
    limit: 100,
  });

  return (
    <ListLayout
      title="Runbooks"
      actions={<Button asChild><a href="/app/runbook/new">+ New</a></Button>}
      search={<Input placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />}
    >
      {isLoading && <SkeletonRows rows={6} cols={4} />}
      {error && <ErrorFallback error={error} onRetry={() => void refetch()} />}
      {data && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Incident Pattern</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr></thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No runbooks yet.</td></tr>
            )}
            {data.map((r) => (
              <tr key={r.name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2 font-mono">{r.runbook_name}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.linked_incident_pattern ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.description ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  <Button asChild variant="outline" size="sm">
                    <a href={`/app/runbook/${encodeURIComponent(r.name)}`}>Edit</a>
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
