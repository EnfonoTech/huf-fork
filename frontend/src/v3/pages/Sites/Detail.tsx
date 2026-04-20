import { useParams, Link } from "react-router-dom";
import { useFrappeDoc } from "../../hooks/useFrappeDoc";
import { useFrappeList } from "../../hooks/useFrappeList";
import { useRealtime } from "../../hooks/useRealtime";
import { TabbedDetail } from "../../layouts/TabbedDetail";
import { StatusBadge } from "../../components/StatusBadge";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";

type Site = {
  name: string;
  site_id: string;
  domain: string;
  server: string;
  status: string;
  access_mode: string;
  last_healthcheck_at?: string;
  healthcheck_fail_count?: number;
};

type Job = {
  name: string;
  job_type: string;
  status: string;
  modified: string;
};

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: site, error, isLoading, refetch } = useFrappeDoc<Site>("Site", id);

  useRealtime({
    channel: "esm:site_status_change",
    invalidate: [["Site", "doc", id]],
  });

  const jobs = useFrappeList<Job>("Agent Job", {
    filters: [["target_site", "=", id ?? ""]],
    fields: ["name", "job_type", "status", "modified"],
    order_by: "modified desc",
    limit: 30,
  });

  useRealtime({
    channel: "esm:agent_job_status_change",
    invalidate: [["Agent Job", "list"]],
  });

  if (isLoading) return <SkeletonRows rows={4} cols={2} />;
  if (error || !site) {
    return (
      <ErrorFallback
        error={error ?? new Error("Site not found")}
        onRetry={() => void refetch()}
      />
    );
  }

  const breadcrumb = (
    <>
      <Link to="/v3/sites" className="hover:underline">Sites</Link> / {site.domain}
    </>
  );

  const health = (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={site.status} /></dd>
      <dt className="text-muted-foreground">Domain</dt><dd className="font-mono">{site.domain}</dd>
      <dt className="text-muted-foreground">Server</dt>
      <dd>
        <Link className="text-blue-600 hover:underline" to={`/v3/servers/${encodeURIComponent(site.server)}`}>
          {site.server}
        </Link>
      </dd>
      <dt className="text-muted-foreground">Access mode</dt><dd>{site.access_mode}</dd>
      <dt className="text-muted-foreground">Last healthcheck</dt><dd>{site.last_healthcheck_at ?? "—"}</dd>
      <dt className="text-muted-foreground">Fail count</dt><dd>{site.healthcheck_fail_count ?? 0}</dd>
    </dl>
  );

  const jobsTab = (
    <>
      {jobs.isLoading && <SkeletonRows rows={6} cols={3} />}
      {jobs.error && <ErrorFallback error={jobs.error} onRetry={() => void jobs.refetch()} />}
      {jobs.data && jobs.data.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">No jobs for this site yet.</div>
      )}
      {jobs.data && jobs.data.length > 0 && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">When</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr></thead>
          <tbody>
            {jobs.data.map((j) => (
              <tr key={j.name} className="border-b last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{new Date(j.modified).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <Link to={`/v3/jobs/${encodeURIComponent(j.name)}`} className="text-blue-600 hover:underline">
                    {j.job_type}
                  </Link>
                </td>
                <td className="px-4 py-2"><StatusBadge status={j.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );

  return (
    <TabbedDetail
      breadcrumb={breadcrumb}
      title={site.domain}
      subtitle={`${site.server} · ${site.access_mode}`}
      tabs={[
        { value: "health", label: "Health", content: health },
        { value: "jobs", label: "Jobs", content: jobsTab },
      ]}
    />
  );
}
