import { Button } from "@/components/ui/button";

type Props = {
  error: Error;
  onRetry?: () => void;
};

export function ErrorFallback({ error, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <h3 className="text-lg font-semibold">Something went wrong</h3>
      <p className="max-w-lg text-sm text-muted-foreground">{error.message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
