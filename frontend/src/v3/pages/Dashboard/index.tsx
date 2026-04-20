import { useFrappeMethodQuery } from "../../hooks/useFrappeMethodQuery";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { ErrorFallback } from "../../components/ErrorFallback";
import { SkeletonRows } from "../../components/SkeletonRows";
import { Tile } from "./Tile";

type Histogram = { day: string; count: number };
type FleetSummary = {
  active_servers: number;
  unreachable_servers: number;
  active_sites: number;
  broken_sites: number;
  jobs_running: number;
  jobs_failed_24h: number;
  events_critical_24h: number;
  migrated_sites?: number;
  rolled_back_sites?: number;
  migrations_in_window?: number;
  jobs_histogram_7d: Histogram[];
};

export default function Dashboard() {
  const { data, error, isLoading, refetch } = useFrappeMethodQuery<FleetSummary>(
    "enfono_server_manager.api.dashboard.fleet_summary",
    undefined,
    { refetchInterval: 30_000 },
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Fleet Dashboard" tiles={<SkeletonRows rows={2} cols={4} />} />
    );
  }
  if (error) {
    return (
      <DashboardLayout title="Fleet Dashboard" tiles={<ErrorFallback error={error} onRetry={() => void refetch()} />} />
    );
  }
  if (!data) return null;

  const tiles = (
    <>
      <Tile label="Active servers"         value={data.active_servers}      to="/v3/servers?status=active" />
      <Tile label="Unreachable"            value={data.unreachable_servers}  to="/v3/servers?status=unreachable"
            tone={data.unreachable_servers > 0 ? "danger" : "default"} />
      <Tile label="Active sites"           value={data.active_sites}        to="/v3/sites?status=active" />
      <Tile label="Broken sites"           value={data.broken_sites}        to="/v3/sites?status=broken"
            tone={data.broken_sites > 0 ? "danger" : "default"} />
      <Tile label="Jobs running"           value={data.jobs_running}        to="/v3/jobs?status=running" />
      <Tile label="Jobs failed (24h)"      value={data.jobs_failed_24h}     to="/v3/jobs?status=failed"
            tone={data.jobs_failed_24h > 0 ? "warn" : "default"} />
      <Tile label="Critical events (24h)"  value={data.events_critical_24h} to="/v3/events?level=critical"
            tone={data.events_critical_24h > 0 ? "danger" : "default"} />
      <Tile
        label="Migrations (14d window)"
        value={data.migrations_in_window ?? 0}
        hint={`${data.migrated_sites ?? 0} total · ${data.rolled_back_sites ?? 0} rolled back`}
        to="/v3/migrations"
      />
    </>
  );

  const max = Math.max(1, ...data.jobs_histogram_7d.map((h) => h.count));
  const charts = (
    <div className="col-span-2 rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">Jobs (last 7 days)</h3>
      <div className="flex items-end gap-2">
        {data.jobs_histogram_7d.map((h) => (
          <div key={h.day} className="flex flex-col items-center gap-1" style={{ minWidth: 48 }}>
            <span className="text-xs text-muted-foreground">{h.count}</span>
            <div className="w-10 rounded bg-primary" style={{ height: `${(h.count / max) * 80 + 4}px` }} />
            <span className="text-[10px] text-muted-foreground">{h.day.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return <DashboardLayout title="Fleet Dashboard" tiles={tiles} charts={charts} />;
}
