import { useParams, Link } from "react-router-dom";
import { useFrappeDoc } from "../../hooks/useFrappeDoc";
import { useRealtime } from "../../hooks/useRealtime";
import { TabbedDetail } from "../../layouts/TabbedDetail";
import { StatusBadge } from "../../components/StatusBadge";
import { LogTail } from "../../components/LogTail";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";

type Candidate = {
  name: string;
  template: string;
  status: string;
  image_tag: string | null;
  image_size_mb: number | null;
  built_on_server: string | null;
  apps_snapshot: string | null;
  dockerfile: string | null;
  build_log: string | null;
  built_at: string | null;
  build_job: string | null;
};

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: cand, error, isLoading, refetch } = useFrappeDoc<Candidate>("Deploy Candidate", id);

  // Build log updates whenever the build job emits step progress — we invalidate this doc.
  useRealtime({
    channel: "esm:agent_job_step_progress",
    invalidate: [["Deploy Candidate", "doc", id]],
  });

  if (isLoading) return <SkeletonRows rows={4} cols={2} />;
  if (error || !cand) {
    return (
      <ErrorFallback
        error={error ?? new Error("Deploy Candidate not found")}
        onRetry={() => void refetch()}
      />
    );
  }

  const breadcrumb = (
    <>
      <Link to="/v3/candidates" className="hover:underline">Deploy Candidates</Link> / {cand.name}
    </>
  );

  const overview = (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={cand.status} /></dd>
      <dt className="text-muted-foreground">Template</dt><dd>{cand.template}</dd>
      <dt className="text-muted-foreground">Image tag</dt><dd className="font-mono text-xs">{cand.image_tag ?? "—"}</dd>
      <dt className="text-muted-foreground">Image size</dt><dd>{cand.image_size_mb != null ? `${cand.image_size_mb} MB` : "—"}</dd>
      <dt className="text-muted-foreground">Built on</dt><dd>{cand.built_on_server ?? "—"}</dd>
      <dt className="text-muted-foreground">Built at</dt><dd>{cand.built_at ? new Date(cand.built_at).toLocaleString() : "—"}</dd>
      <dt className="text-muted-foreground">Build job</dt>
      <dd>
        {cand.build_job ? (
          <Link to={`/v3/jobs/${encodeURIComponent(cand.build_job)}`} className="text-blue-600 hover:underline">
            {cand.build_job}
          </Link>
        ) : "—"}
      </dd>
    </dl>
  );

  const appsSnapshot = (
    <pre className="max-h-96 overflow-auto rounded bg-muted p-3 font-mono text-xs">
      {(() => {
        try { return JSON.stringify(JSON.parse(cand.apps_snapshot ?? ""), null, 2); }
        catch { return cand.apps_snapshot ?? "—"; }
      })()}
    </pre>
  );

  const dockerfileTab = (
    <pre className="max-h-96 overflow-auto rounded bg-muted p-3 font-mono text-xs">
      {cand.dockerfile ?? "— not rendered yet —"}
    </pre>
  );

  const logTail = (cand.build_log ?? "").split("\n").slice(-400);

  const buildLogTab = (
    <LogTail lines={logTail} maxHeight="600px" empty="No build log yet — kick off a build to stream output." />
  );

  return (
    <TabbedDetail
      breadcrumb={breadcrumb}
      title={cand.name}
      subtitle={cand.template}
      actions={<StatusBadge status={cand.status} />}
      tabs={[
        { value: "overview", label: "Overview", content: overview },
        { value: "apps", label: "Apps Snapshot", content: appsSnapshot },
        { value: "dockerfile", label: "Dockerfile", content: dockerfileTab },
        { value: "log", label: "Build Log", content: buildLogTab },
      ]}
    />
  );
}
