import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useFrappeDoc } from "../../hooks/useFrappeDoc";
import { useFrappeList } from "../../hooks/useFrappeList";
import { useRealtime } from "../../hooks/useRealtime";
import { useFrappeMethodMutation } from "../../hooks/useFrappeMethod";
import { useFrappeMethodQuery } from "../../hooks/useFrappeMethodQuery";
import { TabbedDetail } from "../../layouts/TabbedDetail";
import { StatusBadge } from "../../components/StatusBadge";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";
import { LogTail } from "../../components/LogTail";
import { Button } from "@/components/ui/button";

type Site = {
  name: string;
  site_id: string;
  domain: string;
  server: string;
  status: string;
  access_mode: string;
  last_healthcheck_at?: string;
  healthcheck_fail_count?: number;
  migrated_from?: string;
  migrated_at?: string;
  previous_host_ip?: string;
};

type Job = { name: string; job_type: string; status: string; modified: string };
type Backup = { name: string; kind: string; status: string; size_mb?: number; created_at: string; wasabi_key?: string };

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const [logsTailOutput, setLogsTailOutput] = useState<string | null>(null);

  const { data: site, error, isLoading, refetch } = useFrappeDoc<Site>("Site", id);

  useRealtime({ channel: "esm:site_status_change", invalidate: [["Site", "doc", id]] });

  const jobs = useFrappeList<Job>("Agent Job", {
    filters: [["target_site", "=", id ?? ""]],
    fields: ["name", "job_type", "status", "modified"],
    order_by: "modified desc",
    limit: 30,
  });
  useRealtime({ channel: "esm:agent_job_status_change", invalidate: [["Agent Job", "list"]] });

  const backups = useFrappeList<Backup>("Site Backup", {
    filters: [["site", "=", id ?? ""]],
    fields: ["name", "kind", "status", "size_mb", "created_at", "wasabi_key"],
    order_by: "created_at desc",
    limit: 50,
  });

  const triggerHealthcheck = useFrappeMethodMutation<{ name: string }, { ok?: boolean }>(
    "enfono_server_manager.api.site.trigger_healthcheck",
  );

  const rollbackMut = useFrappeMethodMutation<{ doc: Record<string, unknown> }, { name: string }>(
    "frappe.client.insert",
  );
  const enqueueMut = useFrappeMethodMutation<{ docname: string }, unknown>(
    "enfono_server_manager.enfono_server_manager.doctype.agent_job.agent_job.enqueue_job",
  );

  const tailLogs = useFrappeMethodMutation<{ name: string; lines: number }, { log: string; container: string; error?: string }>(
    "enfono_server_manager.api.site.tail_logs",
  );

  type ExecResp = { ok: boolean; stdout: string; stderr: string };
  type AppsResp = { installed: string[]; available_in_image: string[] };
  const appsQ = useFrappeMethodQuery<AppsResp>(
    "enfono_server_manager.api.site.list_installed_apps",
    { name: id ?? "" },
    { enabled: !!id, refetchInterval: 30_000 },
  );
  const installApp = useFrappeMethodMutation<{ name: string; app_name: string }, ExecResp>(
    "enfono_server_manager.api.site.install_app",
  );
  const clearCache = useFrappeMethodMutation<{ name: string }, ExecResp>(
    "enfono_server_manager.api.site.clear_cache",
  );
  const runMigrate = useFrappeMethodMutation<{ name: string }, ExecResp>(
    "enfono_server_manager.api.site.run_migrate",
  );
  const setMaint = useFrappeMethodMutation<{ name: string; enabled: number }, ExecResp>(
    "enfono_server_manager.api.site.set_maintenance_mode",
  );
  const restart = useFrappeMethodMutation<{ name: string }, ExecResp>(
    "enfono_server_manager.api.site.restart_containers",
  );
  const backupNow = useFrappeMethodMutation<{ name: string; with_files: number }, ExecResp>(
    "enfono_server_manager.api.site.backup_now",
  );
  const [opOut, setOpOut] = useState<string | null>(null);

  if (isLoading) return <SkeletonRows rows={4} cols={2} />;
  if (error || !site) {
    return <ErrorFallback error={error ?? new Error("Site not found")} onRetry={() => void refetch()} />;
  }

  const breadcrumb = <><Link to="/v3/sites" className="hover:underline">Sites</Link> / {site.domain}</>;

  const rollbackEligible = !!site.migrated_from && !!site.migrated_at &&
    (Date.now() - new Date(site.migrated_at).getTime()) < 14 * 24 * 60 * 60 * 1000 &&
    site.status !== "rolled_back";

  const doRollback = async () => {
    if (!confirm(`Rollback migration for ${site.domain}? DNS flips back to v1 within ~2 min.`)) return;
    const parts = (site.migrated_from || "").split(":");
    const v1_host_ip = parts[0] || site.previous_host_ip || "";
    const v1_site_name = parts[1] || site.domain;
    const res = await rollbackMut.mutateAsync({
      doc: {
        doctype: "Agent Job",
        job_type: "rollback_migration",
        target_site: site.name,
        status: "queued",
        approval_status: "approved",
        context_json: JSON.stringify({
          site: site.name,
          v1_host_ip,
          v1_site_name,
          v1_ssh_user: "frappe",
          v1_bench_path: "/home/frappe/frappe-bench",
        }),
      },
    });
    await enqueueMut.mutateAsync({ docname: res.name });
  };

  const actions = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => triggerHealthcheck.mutate({ name: site.name })}
        disabled={triggerHealthcheck.isPending}
      >
        {triggerHealthcheck.isPending ? "Checking…" : "Trigger Healthcheck"}
      </Button>
      {rollbackEligible && (
        <Button
          variant="destructive"
          onClick={doRollback}
          disabled={rollbackMut.isPending || enqueueMut.isPending}
        >
          {rollbackMut.isPending || enqueueMut.isPending ? "Starting…" : "Rollback Migration"}
        </Button>
      )}
    </div>
  );

  const health = (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={site.status} /></dd>
      <dt className="text-muted-foreground">Domain</dt><dd className="font-mono">{site.domain}</dd>
      <dt className="text-muted-foreground">Server</dt>
      <dd><Link className="text-blue-600 hover:underline" to={`/v3/servers/${encodeURIComponent(site.server)}`}>{site.server}</Link></dd>
      <dt className="text-muted-foreground">Access mode</dt><dd>{site.access_mode}</dd>
      <dt className="text-muted-foreground">Last healthcheck</dt><dd>{site.last_healthcheck_at ?? "—"}</dd>
      <dt className="text-muted-foreground">Fail count</dt><dd>{site.healthcheck_fail_count ?? 0}</dd>
    </dl>
  );

  const jobsTab = (
    <>
      {jobs.isLoading && <SkeletonRows rows={6} cols={3} />}
      {jobs.error && <ErrorFallback error={jobs.error} onRetry={() => void jobs.refetch()} />}
      {jobs.data && jobs.data.length === 0 && <div className="p-4 text-center text-muted-foreground">No jobs for this site yet.</div>}
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

  const backupsTab = (
    <>
      {backups.isLoading && <SkeletonRows rows={4} cols={4} />}
      {backups.error && <ErrorFallback error={backups.error} onRetry={() => void backups.refetch()} />}
      {backups.data && backups.data.length === 0 && <div className="p-4 text-center text-muted-foreground">No backups recorded yet.</div>}
      {backups.data && backups.data.length > 0 && (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className="px-4 py-2 text-left">When</th>
            <th className="px-4 py-2 text-left">Kind</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Size (MB)</th>
            <th className="px-4 py-2 text-left">Wasabi key</th>
          </tr></thead>
          <tbody>
            {backups.data.map((b) => (
              <tr key={b.name} className="border-b last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{new Date(b.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{b.kind}</td>
                <td className="px-4 py-2"><StatusBadge status={b.status} /></td>
                <td className="px-4 py-2">{b.size_mb ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">{b.wasabi_key ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );

  const logsTab = (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={() =>
            tailLogs.mutate(
              { name: site.name, lines: 200 },
              {
                onSuccess: (r) => setLogsTailOutput(r.log ?? ""),
              },
            )
          }
          disabled={tailLogs.isPending}
        >
          {tailLogs.isPending ? "Fetching…" : "Fetch last 200 lines"}
        </Button>
      </div>
      {tailLogs.error && <ErrorFallback error={tailLogs.error} />}
      <LogTail
        lines={logsTailOutput ? logsTailOutput.split("\n").slice(-300) : undefined}
        maxHeight="500px"
        empty="Click the button to fetch container logs."
      />
    </div>
  );

  const diagnoseTab = (
    <div className="space-y-3 p-4">
      <p className="text-sm text-muted-foreground">
        Diagnose-with-AI chat lives on the HUF side. Open the chat with the v3-triage agent to investigate this site.
      </p>
      <Button asChild>
        <a href={`/huf/chat?agent=v3-triage&context=${encodeURIComponent(JSON.stringify({ site: site.name, domain: site.domain }))}`}>
          Open triage chat
        </a>
      </Button>
    </div>
  );

  return (
    <TabbedDetail
      breadcrumb={breadcrumb}
      title={site.domain}
      subtitle={`${site.server} · ${site.access_mode}`}
      actions={actions}
      tabs={[
        { value: "health", label: "Health", content: health },
        {
          value: "apps",
          label: "Apps",
          content: (
            <div className="space-y-4">
              {appsQ.isLoading && <SkeletonRows rows={3} cols={1} />}
              {appsQ.data && (
                <>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Installed on site</h4>
                    <div className="flex flex-wrap gap-2">
                      {appsQ.data.installed.map((a) => (
                        <span key={a} className="rounded-md border bg-muted px-2 py-1 font-mono text-xs">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Available in image (not yet installed)</h4>
                    <div className="flex flex-wrap gap-2">
                      {appsQ.data.available_in_image
                        .filter((a) => !appsQ.data!.installed.includes(a))
                        .map((a) => (
                          <div key={a} className="flex items-center gap-2 rounded-md border p-2">
                            <span className="font-mono text-xs">{a}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={installApp.isPending}
                              onClick={() =>
                                installApp.mutate(
                                  { name: site.name, app_name: a },
                                  { onSuccess: (r) => { setOpOut(r.stdout || r.stderr); void appsQ.refetch(); } },
                                )
                              }
                            >
                              {installApp.isPending ? "Installing…" : "Install"}
                            </Button>
                          </div>
                        ))}
                      {appsQ.data.available_in_image.filter((a) => !appsQ.data!.installed.includes(a)).length === 0 && (
                        <span className="text-xs text-muted-foreground">All shipped apps are installed. Upgrade site to a DC with more apps to add new ones.</span>
                      )}
                    </div>
                  </div>
                  {opOut && (
                    <pre className="max-h-60 overflow-auto rounded bg-zinc-950 p-3 font-mono text-xs text-zinc-50">{opOut}</pre>
                  )}
                </>
              )}
            </div>
          ),
        },
        {
          value: "ops",
          label: "Ops",
          content: (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => clearCache.mutate({ name: site.name }, { onSuccess: (r) => setOpOut(r.stdout || r.stderr) })} disabled={clearCache.isPending}>{clearCache.isPending ? "…" : "Clear Cache"}</Button>
                <Button variant="outline" onClick={() => runMigrate.mutate({ name: site.name }, { onSuccess: (r) => setOpOut(r.stdout || r.stderr) })} disabled={runMigrate.isPending}>{runMigrate.isPending ? "…" : "bench migrate"}</Button>
                <Button variant="outline" onClick={() => restart.mutate({ name: site.name }, { onSuccess: (r) => setOpOut(r.stdout || r.stderr) })} disabled={restart.isPending}>{restart.isPending ? "…" : "Restart Containers"}</Button>
                <Button variant="outline" onClick={() => backupNow.mutate({ name: site.name, with_files: 1 }, { onSuccess: (r) => setOpOut(r.stdout || r.stderr) })} disabled={backupNow.isPending}>{backupNow.isPending ? "…" : "Backup Now"}</Button>
                <Button variant="outline" onClick={() => setMaint.mutate({ name: site.name, enabled: 1 }, { onSuccess: (r) => setOpOut(r.stdout || r.stderr) })} disabled={setMaint.isPending}>Maintenance ON</Button>
                <Button variant="outline" onClick={() => setMaint.mutate({ name: site.name, enabled: 0 }, { onSuccess: (r) => setOpOut(r.stdout || r.stderr) })} disabled={setMaint.isPending}>Maintenance OFF</Button>
              </div>
              {opOut && (
                <pre className="max-h-80 overflow-auto rounded bg-zinc-950 p-3 font-mono text-xs text-zinc-50">{opOut}</pre>
              )}
            </div>
          ),
        },
        { value: "jobs", label: "Jobs", content: jobsTab },
        { value: "backups", label: "Backups", content: backupsTab },
        { value: "logs", label: "Logs", content: logsTab },
        { value: "diagnose", label: "Diagnose", content: diagnoseTab },
      ]}
    />
  );
}
