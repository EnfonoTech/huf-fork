import { Badge } from "@/components/ui/badge";

const COLORS: Record<string, string> = {
  active: "bg-green-500/15 text-green-700 dark:text-green-400",
  running: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  queued: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
  pending: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
  succeeded: "bg-green-500/15 text-green-700 dark:text-green-400",
  failed: "bg-red-500/15 text-red-700 dark:text-red-400",
  cancelled: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
  unreachable: "bg-red-500/15 text-red-700 dark:text-red-400",
  broken: "bg-red-500/15 text-red-700 dark:text-red-400",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  error: "bg-red-500/15 text-red-700 dark:text-red-400",
  critical: "bg-red-600/15 text-red-800 dark:text-red-400",
  info: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = COLORS[status.toLowerCase()] ?? "bg-gray-500/15 text-gray-700";
  return <Badge className={cls}>{status}</Badge>;
}
