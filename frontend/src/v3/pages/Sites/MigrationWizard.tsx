import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useMigrate } from "./migrateStore";
import { useFrappeList } from "../../hooks/useFrappeList";
import { useFrappeDoc } from "../../hooks/useFrappeDoc";
import { useRealtime } from "../../hooks/useRealtime";
import { callMethod } from "../../api/client";
import { WizardLayout } from "../../layouts/WizardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { StepRunner, type Step as StepperStep } from "../../components/StepRunner";
import { ErrorFallback } from "../../components/ErrorFallback";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const STEP_LABELS = ["v1 source", "v3 target", "Staging", "Review"];

type ServerRow = { name: string; server_name: string; status: string; mode: string };
type CandidateRow = { name: string; template: string; status: string; image_tag: string | null };

export default function MigrationWizard() {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const m = useMigrate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const servers = useFrappeList<ServerRow>("Frappe Server", {
    filters: [["status", "=", "active"], ["mode", "=", "docker"]],
    fields: ["name", "server_name", "status", "mode"],
    limit: 50,
  });
  const candidates = useFrappeList<CandidateRow>("Deploy Candidate", {
    filters: [["status", "=", "built"]],
    fields: ["name", "template", "status", "image_tag"],
    limit: 50,
  });

  const canProceed = () => {
    if (m.step === 1) return !!(m.v1_host_ip && m.v1_site_name && m.v1_bench_path);
    if (m.step === 2) return !!(m.v3_server && m.v3_site_id && m.v3_domain && m.v3_deploy_candidate);
    if (m.step === 3) return !!m.staging_domain;
    return true;
  };

  const step1 = (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="m-ip">v1 host IP</Label>
        <Input id="m-ip" placeholder="10.0.0.5" value={m.v1_host_ip} onChange={(e) => m.setField("v1_host_ip", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="m-user">v1 SSH user</Label>
        <Input id="m-user" value={m.v1_ssh_user} onChange={(e) => m.setField("v1_ssh_user", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="m-bench">v1 bench path</Label>
        <Input id="m-bench" value={m.v1_bench_path} onChange={(e) => m.setField("v1_bench_path", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="m-site">v1 site name</Label>
        <Input id="m-site" placeholder="acme.example.com" value={m.v1_site_name} onChange={(e) => m.setField("v1_site_name", e.target.value)} />
      </div>
      <p className="col-span-2 text-xs text-muted-foreground">
        The v3 control plane must have SSH key access to the v1 host. Verify with <code>ssh {m.v1_ssh_user || "&lt;user&gt;"}@{m.v1_host_ip || "&lt;ip&gt;"} echo ok</code>.
      </p>
    </div>
  );

  const step2 = (
    <div className="space-y-4">
      <div>
        <Label>v3 target server</Label>
        <div className="grid grid-cols-2 gap-2">
          {servers.data?.map((srv) => (
            <button
              key={srv.name}
              type="button"
              onClick={() => m.setField("v3_server", srv.name)}
              className={`rounded-md border p-3 text-left text-sm hover:bg-muted/50 ${m.v3_server === srv.name ? "border-primary ring-2 ring-primary" : ""}`}
            >
              <span className="font-mono font-semibold">{srv.server_name}</span>
              <StatusBadge status={srv.status} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Deploy Candidate (must be built)</Label>
        <div className="grid gap-2">
          {candidates.data?.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => m.setField("v3_deploy_candidate", c.name)}
              className={`rounded-md border p-2 text-left text-xs hover:bg-muted/50 ${m.v3_deploy_candidate === c.name ? "border-primary ring-2 ring-primary" : ""}`}
            >
              <span className="font-mono">{c.name}</span> · {c.template} · <span className="font-mono">{c.image_tag}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="m-sid">v3 site_id</Label>
          <Input id="m-sid" placeholder="acme" value={m.v3_site_id} onChange={(e) => m.setField("v3_site_id", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="m-dom">v3 domain (final)</Label>
          <Input id="m-dom" placeholder="acme.fateherp.com" value={m.v3_domain} onChange={(e) => m.setField("v3_domain", e.target.value)} />
        </div>
      </div>
    </div>
  );

  const step3 = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="m-staging">Staging domain</Label>
        <Input
          id="m-staging"
          placeholder={`${m.v3_site_id}.migrating.fateherp.com`}
          value={m.staging_domain}
          onChange={(e) => m.setField("staging_domain", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Used for smoke-testing before DNS cutover. Separate DNS from v3 domain so v1 keeps serving customer traffic during preview.
        </p>
      </div>
      <div>
        <Label htmlFor="m-access">v3 access mode</Label>
        <select
          id="m-access"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={m.v3_access_mode}
          onChange={(e) => m.setField("v3_access_mode", e.target.value as MigrateState["v3_access_mode"])}
        >
          <option value="public-https">public-https</option>
          <option value="private">private</option>
          <option value="internal">internal</option>
        </select>
      </div>
    </div>
  );

  const doSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const jobRes = await callMethod<{ name: string }>("frappe.client.insert", {
        doc: {
          doctype: "Agent Job",
          job_type: "migrate_site",
          target_server: m.v3_server,
          status: "queued",
          approval_status: "approved",
          context_json: JSON.stringify({
            v1_host_ip: m.v1_host_ip,
            v1_ssh_user: m.v1_ssh_user,
            v1_bench_path: m.v1_bench_path,
            v1_site_name: m.v1_site_name,
            v3_server: m.v3_server,
            v3_site_id: m.v3_site_id,
            v3_domain: m.v3_domain,
            v3_deploy_candidate: m.v3_deploy_candidate,
            v3_access_mode: m.v3_access_mode,
            staging_domain: m.staging_domain,
          }),
        },
      });
      const jobName = jobRes.message.name;
      m.setField("createdJobName", jobName);

      await callMethod(
        "enfono_server_manager.enfono_server_manager.doctype.agent_job.agent_job.enqueue_job",
        { docname: jobName },
      );
      queryClient.invalidateQueries();
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const jobName = m.createdJobName;
  const jobDoc = useFrappeDoc<{ name: string; status: string }>("Agent Job", jobName ?? undefined);
  useRealtime({ channel: "esm:agent_job_status_change", invalidate: jobName ? [["Agent Job", "doc", jobName]] : [] });

  const stepsQ = useFrappeList<{ name: string; step_name: string; status: StepperStep["status"]; log?: string }>(
    "Agent Job Step",
    {
      filters: jobName ? [["parent", "=", jobName]] : [],
      fields: ["name", "step_name", "status", "log"],
      order_by: "idx asc",
      limit: 20,
    },
    { enabled: !!jobName },
  );
  useRealtime({ channel: "esm:agent_job_step_progress", invalidate: [["Agent Job Step", "list"]] });

  const streamerSteps: StepperStep[] = (stepsQ.data ?? []).map((st) => ({
    name: st.step_name,
    label: st.step_name,
    status: st.status,
    stdoutTail: st.log ? st.log.split("\n").slice(-10) : undefined,
  }));

  useEffect(() => {
    if (jobDoc.data?.status === "succeeded" && m.v3_site_id) {
      const t = setTimeout(() => {
        nav(`/v3/sites/${encodeURIComponent(m.v3_site_id)}`);
        m.reset();
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [jobDoc.data?.status, m.v3_site_id, nav, m]);

  const step4 = (
    <div className="space-y-4">
      {!jobName && (
        <>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-muted-foreground">v1 source</dt><dd className="font-mono">{m.v1_ssh_user}@{m.v1_host_ip}:{m.v1_site_name}</dd>
            <dt className="text-muted-foreground">v3 target</dt><dd>{m.v3_server}</dd>
            <dt className="text-muted-foreground">v3 domain</dt><dd className="font-mono">{m.v3_domain}</dd>
            <dt className="text-muted-foreground">Staging</dt><dd className="font-mono">{m.staging_domain}</dd>
            <dt className="text-muted-foreground">Candidate</dt><dd className="font-mono text-xs">{m.v3_deploy_candidate}</dd>
            <dt className="text-muted-foreground">Access mode</dt><dd>{m.v3_access_mode}</dd>
          </dl>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900/40 dark:bg-amber-950/20">
            Steps 1-5 run in preview mode — safe to abort. Steps 6-13 trigger cutover (5-15 min downtime). 14-day rollback window opens after mark_migrated.
          </div>
          {submitError && <ErrorFallback error={new Error(submitError)} />}
        </>
      )}
      {jobName && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Link to={`/v3/jobs/${encodeURIComponent(jobName)}`} className="font-mono text-sm text-blue-600 hover:underline">{jobName}</Link>
            {jobDoc.data && <StatusBadge status={jobDoc.data.status} />}
          </div>
          <StepRunner steps={streamerSteps} />
        </div>
      )}
    </div>
  );

  const footer = (
    <>
      <Button variant="outline" onClick={() => (m.step === 1 ? nav("/v3/migrations") : m.prev())} disabled={submitting || !!jobName}>
        {m.step === 1 ? "Cancel" : "Back"}
      </Button>
      {m.step < 4 && <Button onClick={m.next} disabled={!canProceed()}>Next</Button>}
      {m.step === 4 && !jobName && <Button onClick={doSubmit} disabled={submitting}>{submitting ? "Starting…" : "Start Migration"}</Button>}
      {m.step === 4 && jobName && <Button variant="outline" onClick={() => m.reset()}>New Migration</Button>}
    </>
  );

  return (
    <WizardLayout title="Migrate v1 Site → v3" step={m.step} totalSteps={4} stepLabels={STEP_LABELS} footer={footer}>
      {m.step === 1 && step1}
      {m.step === 2 && step2}
      {m.step === 3 && step3}
      {m.step === 4 && step4}
    </WizardLayout>
  );
}

type MigrateState = ReturnType<typeof useMigrate.getState>;
