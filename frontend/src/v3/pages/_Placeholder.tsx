export function Placeholder({ name }: { name: string }) {
  return (
    <div className="flex h-full items-center justify-center p-12 text-sm text-muted-foreground">
      <span>
        Page <code>{name}</code> — implementation in Phase 1.
      </span>
    </div>
  );
}
