import { Link } from "react-router-dom";
import { useFrappeList } from "../../hooks/useFrappeList";
import { useFrappeMethodQuery } from "../../hooks/useFrappeMethodQuery";
import { useRealtime } from "../../hooks/useRealtime";
import { OpsLayout } from "../../layouts/OpsLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { SkeletonRows } from "../../components/SkeletonRows";

type FleetSummary = {
  active_servers: number;
  unreachable_servers: number;
  active_sites: number;
  broken_sites: number;
  jobs_running: number;
  jobs_failed_24h: number;
  events_critical_24h: number;
};

type Job = { name: string; job_type: string; status: string; modified: string; target_server?: string; target_site?: string };
type ServerRow = { name: string; server_name: string; status: string };
type SystemEvent = { name: string; level: string; source: string; message: string; creation: string };

export default function OpsCommandCenter() {
  const fleet = useFrappeMethodQuery<FleetSummary>(
    "enfono_server_manager.api.dashboard.fleet_summary",
    undefined,
    { refetchInterval: 30_000 },
  );

  // Running + recent jobs (left column)
  const jobs = useFrappeList<Job>("Agent Job", {
    filters: [["status", "in", ["running", "queued", "pending", "failed"]]],
    fields: ["name", "job_type", "status", "modified", "target_server", "target_site"],
    order_by: "modified desc",
    limit: 30,
  });
  useRealtime({ channel: "esm:agent_job_status_change", invalidate: [["Agent Job", "list"]] });
  useRealtime({ channel: "esm:agent_job_step_progress", invalidate: [["Agent Job", "list"]] });

  // Server status + container events (middle column) — we show all servers +
  // a filtered event stream scoped to containers/servers.
  const servers = useFrappeList<ServerRow>("Frappe Server", {
    fields: ["name", "server_name", "status"],
    order_by: "modified desc",
    limit: 30,
  });
  useRealtime({ channel: "esm:server_status_change", invalidate: [["Frappe Server", "list"]] });

  const containerEvents = useFrappeList<SystemEvent>("System Event", {
    filters: [["source", "like", "%container%"]],
    fields: ["name", "level", "source", "message", "creation"],
    order_by: "creation desc",
    limit: 40,
  });
  useRealtime({ channel: "esm:container_status_change", invalidate: [["System Event", "list"]] });

  // Events tail (right column)
  const events = useFrappeList<SystemEvent>("System Event", {
    fields: ["name", "level", "source", "message", "creation"],
    order_by: "creation desc",
    limit: 80,
  });
  useRealtime({ channel: "esm:system_event_created", invalidate: [["System Event", "list"]] });

  const pulse = fleet.data;

  // Global pulse bar
  const header = (
    <div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 px-6 py-3 text-sm">
      <div className="font-semibold">Ops Command Center</div>
      {pulse && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 ${pulse.unreachable_servers > 0 ? "bg-red-500/15 text-red-700" : "bg-green-500/15 text-green-700"}`}>
            {pulse.active_servers} servers OK · {pulse.unreachable_servers} unreachable
          </span>
          <span className={`rounded-full px-2 py-0.5 ${pulse.broken_sites > 0 ? "bg-red-500/15 text-red-700" : "bg-blue-500/15 text-blue-700"}`}>
            {pulse.active_sites} sites active · {pulse.broken_sites} broken
          </span>
          <span className={`rounded-full px-2 py-0.5 ${pulse.jobs_running > 0 ? "bg-amber-500/15 text-amber-700" : "bg-gray-500/15 text-gray-700"}`}>
            {pulse.jobs_running} jobs running
          </span>
          <span className={`rounded-full px-2 py-0.5 ${pulse.jobs_failed_24h > 0 ? "bg-red-500/15 text-red-700" : "bg-gray-500/15 text-gray-700"}`}>
            {pulse.jobs_failed_24h} failed 24h
          </span>
          <span className={`rounded-full px-2 py-0.5 ${pulse.events_critical_24h > 0 ? "bg-red-500/15 text-red-700" : "bg-gray-500/15 text-gray-700"}`}>
            {pulse.events_critical_24h} critical 24h
          </span>
        </div>
      )}
    </div>
  );

  const jobsCol = (
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase">Active jobs</div>
      {jobs.isLoading && <SkeletonRows rows={6} cols={2} />}
      {jobs.data && jobs.data.length === 0 && (
        <div className="p-4 text-center text-xs text-muted-foreground">No active jobs.</div>
      )}
      <ul className="divide-y">
        {jobs.data?.map((j) => (
          <li key={j.name} className="p-3 hover:bg-muted/30">
            <Link to={`/v3/jobs/${encodeURIComponent(j.name)}`} className="block">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-blue-600">{j.name}</span>
                <StatusBadge status={j.status} />
              </div>
              <div className="text-xs">{j.job_type}</div>
              <div className="text-[10px] text-muted-foreground">
                {j.target_site ? `site: ${j.target_site}` : j.target_server ? `server: ${j.target_server}` : "—"}
                {" · "}{new Date(j.modified).toLocaleTimeString()}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  const containersCol = (
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase">Servers + containers</div>
      <div className="border-b p-2">
        {servers.isLoading && <SkeletonRows rows={3} cols={2} />}
        {servers.data && (
          <div className="flex flex-wrap gap-1 p-1">
            {servers.data.map((srv) => (
              <Link
                key={srv.name}
                to={`/v3/servers/${encodeURIComponent(srv.name)}`}
                className="rounded-md border px-2 py-1 text-[11px] hover:bg-muted/40"
              >
                <span className="font-mono">{srv.server_name}</span>{" "}
                <StatusBadge status={srv.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
      <ul className="divide-y overflow-auto">
        {containerEvents.data?.length === 0 && (
          <li className="p-4 text-center text-xs text-muted-foreground">No container events.</li>
        )}
        {containerEvents.data?.map((e) => (
          <li key={e.name} className="p-2 text-xs">
            <div className="flex items-center gap-2">
              <StatusBadge status={e.level} />
              <span className="font-mono text-[10px] text-muted-foreground">{new Date(e.creation).toLocaleTimeString()}</span>
            </div>
            <div className="truncate">{e.message}</div>
            <div className="text-[10px] text-muted-foreground">{e.source}</div>
          </li>
        ))}
      </ul>
    </div>
  );

  const eventsCol = (
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase">System events</div>
      <ul className="divide-y overflow-auto">
        {events.isLoading && <SkeletonRows rows={10} cols={2} />}
        {events.data?.length === 0 && (
          <li className="p-4 text-center text-xs text-muted-foreground">No events yet.</li>
        )}
        {events.data?.map((e) => (
          <li key={e.name} className="p-2 text-xs">
            <div className="flex items-center gap-2">
              <StatusBadge status={e.level} />
              <span className="font-mono text-[10px] text-muted-foreground">{new Date(e.creation).toLocaleTimeString()}</span>
            </div>
            <div className="truncate">{e.message}</div>
            <div className="text-[10px] text-muted-foreground">{e.source}</div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex flex-col">
      {header}
      <OpsLayout left={jobsCol} middle={containersCol} right={eventsCol} />
    </div>
  );
}
