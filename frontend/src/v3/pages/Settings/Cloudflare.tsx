import { useFrappeDoc } from "../../hooks/useFrappeDoc";
import { FormLayout } from "../../layouts/FormLayout";
import { SkeletonRows } from "../../components/SkeletonRows";
import { ErrorFallback } from "../../components/ErrorFallback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type CFSettings = {
  api_token?: string;
  proxy_by_default: number;
  ssl_mode: string;
  origin_cert_pem?: string;
  origin_cert_key?: string;
  origin_cert_hostnames?: string;
};

export default function CloudflareSettings() {
  const { data, error, isLoading, refetch } =
    useFrappeDoc<CFSettings>("Cloudflare Settings", "Cloudflare Settings");

  const editBtn = (
    <Button asChild>
      <a href="/app/cloudflare-settings">Edit in Desk</a>
    </Button>
  );

  if (isLoading) return <FormLayout title="Cloudflare Settings" actions={editBtn}><SkeletonRows rows={4} cols={2} /></FormLayout>;
  if (error || !data) return <FormLayout title="Cloudflare Settings" actions={editBtn}><ErrorFallback error={error ?? new Error("Not loaded")} onRetry={() => void refetch()} /></FormLayout>;

  const filled = (v: unknown) => v ? <Badge className="bg-green-500/15 text-green-700">set</Badge> : <Badge variant="outline">missing</Badge>;

  return (
    <FormLayout title="Cloudflare Settings" actions={editBtn}>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <dt className="text-muted-foreground">API Token</dt><dd>{filled(data.api_token)}</dd>
        <dt className="text-muted-foreground">SSL Mode</dt><dd>{data.ssl_mode}</dd>
        <dt className="text-muted-foreground">Proxy by default</dt><dd>{data.proxy_by_default ? "yes" : "no"}</dd>
        <dt className="text-muted-foreground">Origin Certificate</dt><dd>{filled(data.origin_cert_pem)}</dd>
        <dt className="text-muted-foreground">Origin Private Key</dt><dd>{filled(data.origin_cert_key)}</dd>
        <dt className="text-muted-foreground">Hostnames</dt><dd className="font-mono text-xs">{data.origin_cert_hostnames ?? "—"}</dd>
      </dl>
    </FormLayout>
  );
}
