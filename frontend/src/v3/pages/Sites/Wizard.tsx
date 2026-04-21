import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useWizard, genPassword } from "./wizardStore";
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
import { Badge } from "@/components/ui/badge";
import type { WizardState } from "./wizardStore";

const STEP_LABELS = ["Identity", "Candidate", "Credentials", "Review"];

type ServerRow = { name: string; server_name: string; status: string; region: string; mode: string };
type CandidateRow = { name: string; template: string; status: string; image_tag: string | null; built_at: string | null };

export default function NewSiteWizard() {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const s = useWizard();

  const serversQ = useFrappeList<ServerRow>("Frappe Server", {
    filters: [["status", "=", "active"], ["mode", "=", "docker"]],
    fields: ["name", "server_name", "status", "region", "mode"],
    limit: 50,
    order_by: "modified desc",
  });
  const candidatesQ = useFrappeList<CandidateRow>("Deploy Candidate", {
    filters: [["status", "=", "built"]],
    fields: ["name", "template", "status", "image_tag", "built_at"],
    limit: 50,
    order_by: "modified desc",
  });

  // Derived — stale if built >30 days ago
  const pickedCand = useMemo(
    () => candidatesQ.data?.find((c) => c.name === s.deploy_candidate),
    [candidatesQ.data, s.deploy_candidate],
  );
  const candStaleDays = pickedCand?.built_at
    ? Math.floor((Date.now() - new Date(pickedCand.built_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canProceed = () => {
    if (s.step === 1) {
      const domainOk = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+\.[a-z]{2,}$/.test(s.domain);
      return !!(s.site_id && domainOk && s.server);
    }
    if (s.step === 2) return !!s.deploy_candidate;
    if (s.step === 3) return !!(s.admin_password && s.db_password);
    return true;
  };

  // --- STEP 1 — Identity ---
  const step1 = (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Label htmlFor="w-domain">Domain</Label>
        <Input
          id="w-domain"
          placeholder="acme.fateherp.com"
          value={s.domain}
          onChange={(e) => {
            s.setField("domain", e.target.value.toLowerCase().trim());
            if (!s.site_id || s.site_id === s.domain.split(".")[0]) {
              s.setField("site_id", e.target.value.split(".")[0]?.toLowerCase().replace(/[^a-z0-9-]/g, "") || "");
            }
          }}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Full FQDN. Must include <code>.fateherp.com</code> (or any zone in Cloudflare Settings).
          {s.domain && !/^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+\.[a-z]{2,}$/.test(s.domain) && (
            <span className="ml-2 text-red-600">Invalid FQDN</span>
          )}
        </p>
      </div>
      <div>
        <Label htmlFor="w-sid">Site ID</Label>
        <Input
          id="w-sid"
          placeholder="acme"
          value={s.site_id}
          onChange={(e) => s.setField("site_id", e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())}
        />
      </div>
      <div>
        <Label htmlFor="w-client">Client name</Label>
        <Input
          id="w-client"
          placeholder="Acme Corp"
          value={s.client_name}
          onChange={(e) => s.setField("client_name", e.target.value)}
        />
      </div>
      <div className="col-span-2">
        <Label>Server</Label>
        {serversQ.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {serversQ.error && <div className="text-sm text-red-600">Error loading servers</div>}
        {serversQ.data && serversQ.data.length === 0 && (
          <div className="text-sm text-amber-600">No active docker-mode servers. Bootstrap one first.</div>
        )}
        {serversQ.data && serversQ.data.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {serversQ.data.map((srv) => (
              <button
                key={srv.name}
                type="button"
                onClick={() => s.setField("server", srv.name)}
                className={`rounded-md border p-3 text-left text-sm hover:bg-muted/50 ${
                  s.server === srv.name ? "border-primary ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold">{srv.server_name}</span>
                  <StatusBadge status={srv.status} />
                </div>
                <div className="text-xs text-muted-foreground">{srv.region} · {srv.mode}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // --- STEP 2 — Deploy Candidate ---
  const step2 = (
    <div className="space-y-3">
      {candidatesQ.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {candidatesQ.error && <div className="text-sm text-red-600">Error loading candidates</div>}
      {candidatesQ.data && candidatesQ.data.length === 0 && (
        <div className="text-sm text-amber-600">
          No built candidates. <Link className="text-blue-600 hover:underline" to="/v3/candidates">Build one first</Link>.
        </div>
      )}
      {candidatesQ.data && candidatesQ.data.length > 0 && (
        <div className="grid gap-2">
          {candidatesQ.data.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => s.setField("deploy_candidate", c.name)}
              className={`rounded-md border p-3 text-left text-sm hover:bg-muted/50 ${
                s.deploy_candidate === c.name ? "border-primary ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono">{c.name}</span>
                <StatusBadge status={c.status} />
              </div>
              <div className="text-xs text-muted-foreground">
                {c.template} · {c.image_tag ?? "—"} · built {c.built_at ? new Date(c.built_at).toLocaleDateString() : "?"}
              </div>
            </button>
          ))}
        </div>
      )}
      {candStaleDays != null && candStaleDays > 30 && (
        <div className="text-sm text-amber-600">Warning: candidate last built {candStaleDays} days ago — consider rebuilding.</div>
      )}
    </div>
  );

  // --- STEP 3 — Credentials ---
  const step3 = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="w-access">Access mode</Label>
        <select
          id="w-access"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={s.access_mode}
          onChange={(e) => s.setField("access_mode", e.target.value as WizardState["access_mode"])}
        >
          <option value="public-https">public-https</option>
          <option value="private">private</option>
          <option value="internal">internal</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="w-admin-pw">Administrator password</Label>
          <div className="flex gap-2">
            <Input id="w-admin-pw" value={s.admin_password} onChange={(e) => s.setField("admin_password", e.target.value)} />
            <Button type="button" variant="outline" onClick={() => s.setField("admin_password", genPassword())}>Generate</Button>
          </div>
        </div>
        <div>
          <Label htmlFor="w-db-pw">DB password</Label>
          <div className="flex gap-2">
            <Input id="w-db-pw" value={s.db_password} onChange={(e) => s.setField("db_password", e.target.value)} />
            <Button type="button" variant="outline" onClick={() => s.setField("db_password", genPassword())}>Generate</Button>
          </div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Keep these safe — they'll be set inside the container during provisioning. Copy to your password manager now.
      </div>
    </div>
  );

  // --- STEP 4 — Review + submit + live watch ---
  const doSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const siteRes = await callMethod<{ name: string }>("frappe.client.insert", {
        doc: {
          doctype: "Site",
          site_id: s.site_id,
          domain: s.domain,
          client_name: s.client_name || undefined,
          server: s.server,
          deploy_candidate: s.deploy_candidate,
          access_mode: s.access_mode,
          admin_password: s.admin_password,
          db_password: s.db_password,
          status: "provisioning",
        },
      });
      const siteName = siteRes.message.name;
      s.setField("createdSiteName", siteName);

      const jobRes = await callMethod<{ name: string }>("frappe.client.insert", {
        doc: {
          doctype: "Agent Job",
          job_type: "create_site",
          target_server: s.server,
          target_site: siteName,
          status: "queued",
          approval_status: "approved",
          context_json: JSON.stringify({ site: siteName }),
        },
      });
      const jobName = jobRes.message.name;
      s.setField("createdJobName", jobName);

      await callMethod(
        "enfono_server_manager.enfono_server_manager.doctype.agent_job.agent_job.enqueue_job",
        { docname: jobName },
      );
      // Invalidate lists so list pages refresh if user navigates there
      queryClient.invalidateQueries();
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const jobName = s.createdJobName;

  const jobDoc = useFrappeDoc<{ name: string; status: string; job_type: string }>(
    "Agent Job",
    jobName ?? undefined,
  );
  useRealtime({
    channel: "esm:agent_job_status_change",
    invalidate: jobName ? [["Agent Job", "doc", jobName]] : [],
  });

  const stepsQ = useFrappeList<{
    name: string;
    step_name: string;
    status: StepperStep["status"];
    log?: string;
  }>("Agent Job Step", {
    filters: jobName ? [["parent", "=", jobName]] : [],
    fields: ["name", "step_name", "status", "log"],
    order_by: "idx asc",
    limit: 50,
  }, { enabled: !!jobName });
  useRealtime({
    channel: "esm:agent_job_step_progress",
    invalidate: [["Agent Job Step", "list"]],
  });

  const streamerSteps: StepperStep[] = (stepsQ.data ?? []).map((st) => ({
    name: st.step_name,
    label: st.step_name,
    status: st.status,
    stdoutTail: st.log ? st.log.split("\n").slice(-15) : undefined,
  }));

  // Auto-redirect to site detail on success
  useEffect(() => {
    if (jobDoc.data?.status === "succeeded" && s.createdSiteName) {
      const t = setTimeout(() => {
        nav(`/v3/sites/${encodeURIComponent(s.createdSiteName!)}`);
        s.reset();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [jobDoc.data?.status, s.createdSiteName, nav, s]);

  const step4 = (
    <div className="space-y-4">
      {!jobName && (
        <>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-muted-foreground">Domain</dt><dd className="font-mono">{s.domain}</dd>
            <dt className="text-muted-foreground">Site ID</dt><dd className="font-mono">{s.site_id}</dd>
            <dt className="text-muted-foreground">Client</dt><dd>{s.client_name || "—"}</dd>
            <dt className="text-muted-foreground">Server</dt><dd>{s.server}</dd>
            <dt className="text-muted-foreground">Candidate</dt><dd className="font-mono text-xs">{s.deploy_candidate}</dd>
            <dt className="text-muted-foreground">Access mode</dt><dd>{s.access_mode}</dd>
            <dt className="text-muted-foreground">Admin PW</dt><dd><Badge variant="outline">hidden ({s.admin_password.length} chars)</Badge></dd>
            <dt className="text-muted-foreground">DB PW</dt><dd><Badge variant="outline">hidden ({s.db_password.length} chars)</Badge></dd>
          </dl>
          {submitError && <ErrorFallback error={new Error(submitError)} />}
        </>
      )}
      {jobName && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              Job <Link to={`/v3/jobs/${encodeURIComponent(jobName)}`} className="font-mono text-blue-600 hover:underline">{jobName}</Link>
            </div>
            {jobDoc.data && <StatusBadge status={jobDoc.data.status} />}
          </div>
          <StepRunner steps={streamerSteps} />
          {jobDoc.data?.status === "succeeded" && s.createdSiteName && (
            <div className="text-sm text-green-700 dark:text-green-400">
              Site provisioned. Redirecting to <Link className="underline" to={`/v3/sites/${encodeURIComponent(s.createdSiteName)}`}>site detail</Link>…
            </div>
          )}
          {jobDoc.data?.status === "failed" && (
            <div className="text-sm text-red-600">
              Job failed. Open the <Link className="underline" to={`/v3/jobs/${encodeURIComponent(jobName)}`}>job detail</Link> to inspect logs and retry.
            </div>
          )}
        </div>
      )}
    </div>
  );

  const footer = (
    <>
      <Button variant="outline" onClick={() => (s.step === 1 ? nav("/v3/sites") : s.prev())} disabled={submitting || !!jobName}>
        {s.step === 1 ? "Cancel" : "Back"}
      </Button>
      {s.step < 4 && (
        <Button onClick={s.next} disabled={!canProceed()}>Next</Button>
      )}
      {s.step === 4 && !jobName && (
        <Button onClick={doSubmit} disabled={submitting}>{submitting ? "Creating…" : "Create Site"}</Button>
      )}
      {s.step === 4 && jobName && (
        <Button variant="outline" onClick={() => s.reset()}>New Wizard</Button>
      )}
    </>
  );

  return (
    <WizardLayout
      title="New Site"
      subtitle="Provision a new customer site on a docker-mode server."
      step={s.step}
      totalSteps={4}
      stepLabels={STEP_LABELS}
      footer={footer}
    >
      {s.step === 1 && step1}
      {s.step === 2 && step2}
      {s.step === 3 && step3}
      {s.step === 4 && step4}
    </WizardLayout>
  );
}
