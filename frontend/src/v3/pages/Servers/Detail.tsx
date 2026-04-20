import { useParams, Link } from "react-router-dom";
import { useFrappeDoc } from "../../hooks/useFrappeDoc";
import { useFrappeList } from "../../hooks/useFrappeList";
import { useRealtime } from "../../hooks/useRealtime";
import { TabbedDetail } from "../../layouts/TabbedDetail";
import { StatusBadge } from "../../components/StatusBadge";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";

type Server = {
  server_name: string;
  mode: string;
  region: string;
  status: string;
  ssh_host: string;
  ssh_user: string;
  caddy_enabled: number;
  last_seen_at?: string;
};

type SystemEvent = {
  level: string;
  source: string;
  message: string;
  creation: string;
};

export default function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: server, error, isLoading, refetch } = useFrappeDoc<Server>("Frappe Server", id);

  useRealtime({
    channel: "esm:server_status_change",
    invalidate: [["Frappe Server", "doc", id]],
  });

  const events = useFrappeList<SystemEvent>("System Event", {
    filters: [["server", "=", id ?? ""]],
    fields: ["name", "level", "source", "message", "creation"],
    order_by: "creation desc",
    limit: 50,
  });

  useRealtime({
    channel: "esm:system_event_created",
    invalidate: [["System Event", "list"]],
  });

  if (isLoading) return <SkeletonRows rows={4} cols={2} />;
  if (error || !server) {
    return (
      <ErrorFallback
        error={error ?? new Error("Server not found")}
        onRetry={() => void refetch()}
      />
    );
  }

  const breadcrumb = (
    <>
      <Link to="/v3/servers" className="hover:underline">Servers</Link> / {server.server_name}
    </>
  );

  const overview = (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={server.status} /></dd>
      <dt className="text-muted-foreground">Mode</dt><dd>{server.mode}</dd>
      <dt className="text-muted-foreground">Region</dt><dd>{server.region}</dd>
      <dt className="text-muted-foreground">SSH host</dt><dd className="font-mono">{server.ssh_host}</dd>
      <dt className="text-muted-foreground">SSH user</dt><dd className="font-mono">{server.ssh_user}</dd>
      <dt className="text-muted-foreground">Caddy enabled</dt><dd>{server.caddy_enabled ? "yes" : "no"}</dd>
      <dt className="text-muted-foreground">Last seen</dt><dd>{server.last_seen_at ?? "—"}</dd>
    </dl>
  );

  const eventsTab = (
    <>
      {events.isLoading && <SkeletonRows rows={6} cols={3} />}
      {events.error && <ErrorFallback error={events.error} onRetry={() => void events.refetch()} />}
      {events.data && events.data.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">No events for this server yet.</div>
      )}
      {events.data && events.data.length > 0 && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">When</th>
            <th className="px-4 py-2 text-left">Level</th>
            <th className="px-4 py-2 text-left">Message</th>
          </tr></thead>
          <tbody>
            {events.data.map((e) => (
              <tr key={e.name} className="border-b last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{new Date(e.creation).toLocaleString()}</td>
                <td className="px-4 py-2"><StatusBadge status={e.level} /></td>
                <td className="px-4 py-2">{e.message}</td>
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
      title={server.server_name}
      subtitle={server.ssh_host}
      tabs={[
        { value: "overview", label: "Overview", content: overview },
        { value: "events", label: "Events", content: eventsTab },
      ]}
    />
  );
}
