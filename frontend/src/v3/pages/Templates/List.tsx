import { useState } from "react";
import { useFrappeList } from "../../hooks/useFrappeList";
import { ListLayout } from "../../layouts/ListLayout";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type BenchTemplate = {
  name: string;
  template_name: string;
  frappe_version?: string;
  python_version?: string;
  node_version?: string;
};

export default function TemplatesList() {
  const [q, setQ] = useState("");
  const filters: [string, string, unknown][] = q ? [["template_name", "like", `%${q}%`]] : [];

  const { data, isLoading, error, refetch } = useFrappeList<BenchTemplate>("Bench Template", {
    filters,
    fields: ["name", "template_name", "frappe_version", "python_version", "node_version"],
    order_by: "modified desc",
    limit: 100,
  });

  return (
    <ListLayout
      title="Bench Templates"
      actions={<Button asChild><a href="/app/bench-template/new">+ New</a></Button>}
      search={<Input placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />}
    >
      {isLoading && <SkeletonRows rows={6} cols={4} />}
      {error && <ErrorFallback error={error} onRetry={() => void refetch()} />}
      {data && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Frappe</th>
            <th className="px-4 py-2 text-left">Python</th>
            <th className="px-4 py-2 text-left">Node</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr></thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No templates yet.</td></tr>
            )}
            {data.map((t) => (
              <tr key={t.name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2 font-mono">{t.template_name}</td>
                <td className="px-4 py-2">{t.frappe_version ?? "—"}</td>
                <td className="px-4 py-2">{t.python_version ?? "—"}</td>
                <td className="px-4 py-2">{t.node_version ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  <Button asChild variant="outline" size="sm">
                    <a href={`/app/bench-template/${encodeURIComponent(t.name)}`}>Edit</a>
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
