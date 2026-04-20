import { useState } from "react";
import { useFrappeList } from "../../hooks/useFrappeList";
import { ListLayout } from "../../layouts/ListLayout";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AppSource = {
  name: string;
  source_name: string;
  app_name: string;
  default_branch: string;
  git_url: string;
  auth_type: string;
};

export default function AppSourcesList() {
  const [q, setQ] = useState("");
  const filters: [string, string, unknown][] = q ? [["source_name", "like", `%${q}%`]] : [];

  const { data, isLoading, error, refetch } = useFrappeList<AppSource>("App Source", {
    filters,
    fields: ["name", "source_name", "app_name", "default_branch", "git_url", "auth_type"],
    order_by: "modified desc",
    limit: 100,
  });

  return (
    <ListLayout
      title="App Sources"
      actions={<Button asChild><a href="/app/app-source/new">+ New</a></Button>}
      search={<Input placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />}
    >
      {isLoading && <SkeletonRows rows={6} cols={5} />}
      {error && <ErrorFallback error={error} onRetry={() => void refetch()} />}
      {data && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">App</th>
            <th className="px-4 py-2 text-left">Branch</th>
            <th className="px-4 py-2 text-left">Git URL</th>
            <th className="px-4 py-2 text-left">Auth</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr></thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No app sources yet.</td></tr>
            )}
            {data.map((a) => (
              <tr key={a.name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2 font-mono">{a.source_name}</td>
                <td className="px-4 py-2">{a.app_name}</td>
                <td className="px-4 py-2">{a.default_branch}</td>
                <td className="px-4 py-2 font-mono text-xs">{a.git_url}</td>
                <td className="px-4 py-2">{a.auth_type}</td>
                <td className="px-4 py-2 text-right">
                  <Button asChild variant="outline" size="sm">
                    <a href={`/app/app-source/${encodeURIComponent(a.name)}`}>Edit</a>
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
