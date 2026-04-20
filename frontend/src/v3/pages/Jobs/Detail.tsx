import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useFrappeDoc } from "../../hooks/useFrappeDoc";
import { useFrappeList } from "../../hooks/useFrappeList";
import { useRealtime } from "../../hooks/useRealtime";
import { TabbedDetail } from "../../layouts/TabbedDetail";
import { StatusBadge } from "../../components/StatusBadge";
import { StepRunner, type Step } from "../../components/StepRunner";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";

type Job = {
  name: string;
  job_type: string;
  status: string;
  modified: string;
  context_json: string;
  approval_status?: string;
};

type StepDoc = {
  name: string;
  idempotency_key: string;
  step_name: string;
  status: "pending" | "running" | "succeeded" | "failed" | "skipped";
  log?: string;
};

type StepEventPayload = {
  job: string;
  step_idx: number;
  step_name: string;
  status: Step["status"];
  stdout_tail?: string[] | string;
};

function tailLines(x: string | string[] | undefined): string[] | undefined {
  if (!x) return undefined;
  if (Array.isArray(x)) return x;
  return x.split("\n").slice(-20);
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [liveSteps, setLiveSteps] = useState<Record<string, Partial<StepDoc>>>({});

  const { data: job, error, isLoading, refetch } = useFrappeDoc<Job>("Agent Job", id);

  // Child rows — Agent Job Step docs whose parent is this job.
  const steps = useFrappeList<StepDoc>("Agent Job Step", {
    filters: [["parent", "=", id ?? ""]],
    fields: ["name", "idempotency_key", "step_name", "status", "log"],
    order_by: "idx asc",
    limit: 50,
  });

  useRealtime({ channel: "esm:agent_job_status_change", invalidate: [["Agent Job", "doc", id]] });

  useRealtime({
    channel: "esm:agent_job_step_progress",
    invalidate: [["Agent Job Step", "list"]],
    onEvent: (raw) => {
      const p = raw as StepEventPayload;
      if (p.job !== id) return;
      setLiveSteps((prev) => ({
        ...prev,
        [p.step_name]: {
          status: p.status,
          log: Array.isArray(p.stdout_tail) ? p.stdout_tail.join("\n") : p.stdout_tail,
        },
      }));
    },
  });

  // Clear overlay once the authoritative step list shows terminal state
  useEffect(() => {
    if (steps.data) {
      setLiveSteps((prev) => {
        const next = { ...prev };
        for (const s of steps.data) {
          if (s.status === "succeeded" || s.status === "failed") {
            delete next[s.step_name];
          }
        }
        return next;
      });
    }
  }, [steps.data]);

  const mergedSteps: Step[] = useMemo(() => {
    if (!steps.data) return [];
    return steps.data.map((s) => {
      const live = liveSteps[s.step_name];
      const status = (live?.status ?? s.status) as Step["status"];
      const stdoutTail = tailLines(live?.log ?? s.log);
      return {
        name: s.step_name,
        label: s.step_name,
        status,
        stdoutTail,
      };
    });
  }, [steps.data, liveSteps]);

  if (isLoading) return <SkeletonRows rows={6} cols={2} />;
  if (error || !job) {
    return (
      <ErrorFallback
        error={error ?? new Error("Job not found")}
        onRetry={() => void refetch()}
      />
    );
  }

  const breadcrumb = (
    <>
      <Link to="/v3/jobs" className="hover:underline">Agent Jobs</Link> / {id}
    </>
  );

  const stepsTab = (
    <>
      {steps.isLoading && <SkeletonRows rows={5} cols={2} />}
      {steps.error && <ErrorFallback error={steps.error} onRetry={() => void steps.refetch()} />}
      {mergedSteps.length === 0 && !steps.isLoading && (
        <div className="p-4 text-center text-muted-foreground">No steps recorded.</div>
      )}
      {mergedSteps.length > 0 && <StepRunner steps={mergedSteps} />}
    </>
  );

  const contextTab = (
    <pre className="max-h-96 overflow-auto rounded bg-muted p-3 font-mono text-xs">
      {(() => {
        try { return JSON.stringify(JSON.parse(job.context_json), null, 2); }
        catch { return job.context_json; }
      })()}
    </pre>
  );

  return (
    <TabbedDetail
      breadcrumb={breadcrumb}
      title={job.job_type}
      subtitle={id}
      actions={<StatusBadge status={job.status} />}
      tabs={[
        { value: "steps", label: "Steps", content: stepsTab },
        { value: "context", label: "Context", content: contextTab },
      ]}
    />
  );
}
