import { Link } from "react-router-dom";
import { useFrappeList } from "../../hooks/useFrappeList";
import { useRealtime } from "../../hooks/useRealtime";
import { ListLayout } from "../../layouts/ListLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";
import { Button } from "@/components/ui/button";

type MigratedSite = {
  name: string;
  domain: string;
  server: string;
  status: string;
  migrated_from: string;
  migrated_at: string;
  migration_job: string;
  previous_host_ip?: string;
};

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function MigrationsList() {
  const { data, isLoading, error, refetch } = useFrappeList<MigratedSite>("Site", {
    filters: [["migrated_from", "is", "set"]],
    fields: ["name", "domain", "server", "status", "migrated_from", "migrated_at", "migration_job", "previous_host_ip"],
    order_by: "migrated_at desc",
    limit: 200,
  });
  useRealtime({ channel: "esm:site_status_change", invalidate: [["Site", "list"]] });

  return (
    <ListLayout
      title="Migrations"
      actions={
        <Button asChild>
          <Link to="/v3/sites/migrate">+ New Migration</Link>
        </Button>
      }
    >
      {isLoading && <SkeletonRows rows={6} cols={6} />}
      {error && <ErrorFallback error={error} onRetry={() => void refetch()} />}
      {data && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">v3 Site</th>
            <th className="px-4 py-2 text-left">Migrated From</th>
            <th className="px-4 py-2 text-left">When</th>
            <th className="px-4 py-2 text-left">Rollback window</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Job</th>
          </tr></thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No migrations yet.</td></tr>
            )}
            {data.map((s) => {
              const age = daysSince(s.migrated_at);
              const remaining = Math.max(0, 14 - age);
              const windowOpen = remaining > 0 && s.status !== "rolled_back";
              return (
                <tr key={s.name} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link to={`/v3/sites/${encodeURIComponent(s.name)}`} className="font-mono text-blue-600 hover:underline">
                      {s.domain}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{s.migrated_from}</td>
                  <td className="px-4 py-2 font-mono text-xs">{new Date(s.migrated_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    {windowOpen ? (
                      <span className={remaining <= 3 ? "text-amber-600" : "text-muted-foreground"}>
                        {remaining}d remaining
                      </span>
                    ) : (
                      <span className="text-muted-foreground">closed</span>
                    )}
                  </td>
                  <td className="px-4 py-2"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-2">
                    {s.migration_job && (
                      <Link to={`/v3/jobs/${encodeURIComponent(s.migration_job)}`} className="text-blue-600 hover:underline font-mono text-xs">
                        {s.migration_job}
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </ListLayout>
  );
}
