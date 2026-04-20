type Props = { doctype?: string; action?: string };

export function PermissionDenied({ doctype, action = "read" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      <h3 className="text-lg font-semibold">Permission denied</h3>
      <p className="text-sm text-muted-foreground">
        You don't have <code>{action}</code> access
        {doctype ? ` to ${doctype}` : ""}. Ask an administrator to grant you the
        required role.
      </p>
    </div>
  );
}
