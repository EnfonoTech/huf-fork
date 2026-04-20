import { useFrappeDoc } from "../../hooks/useFrappeDoc";
import { FormLayout } from "../../layouts/FormLayout";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type WasabiSettings = {
  access_key?: string;
  secret_key?: string;
  region?: string;
  bucket?: string;
  keep_daily?: number;
  keep_weekly?: number;
  keep_monthly?: number;
};

export default function WasabiSettings() {
  const { data, error, isLoading, refetch } =
    useFrappeDoc<WasabiSettings>("Wasabi Settings", "Wasabi Settings");

  const editBtn = (
    <Button asChild>
      <a href="/app/wasabi-settings">Edit in Desk</a>
    </Button>
  );

  if (isLoading) return <FormLayout title="Wasabi Settings" actions={editBtn}><SkeletonRows rows={4} cols={2} /></FormLayout>;
  if (error || !data) return <FormLayout title="Wasabi Settings" actions={editBtn}><ErrorFallback error={error ?? new Error("Not loaded")} onRetry={() => void refetch()} /></FormLayout>;

  const filled = (v: unknown) => v ? <Badge className="bg-green-500/15 text-green-700">set</Badge> : <Badge variant="outline">missing</Badge>;

  return (
    <FormLayout title="Wasabi Settings" actions={editBtn}>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <dt className="text-muted-foreground">Access Key</dt><dd>{filled(data.access_key)}</dd>
        <dt className="text-muted-foreground">Secret Key</dt><dd>{filled(data.secret_key)}</dd>
        <dt className="text-muted-foreground">Region</dt><dd>{data.region ?? "—"}</dd>
        <dt className="text-muted-foreground">Bucket</dt><dd className="font-mono text-xs">{data.bucket ?? "—"}</dd>
        <dt className="text-muted-foreground">Keep daily</dt><dd>{data.keep_daily ?? "—"}</dd>
        <dt className="text-muted-foreground">Keep weekly</dt><dd>{data.keep_weekly ?? "—"}</dd>
        <dt className="text-muted-foreground">Keep monthly</dt><dd>{data.keep_monthly ?? "—"}</dd>
      </dl>
    </FormLayout>
  );
}
