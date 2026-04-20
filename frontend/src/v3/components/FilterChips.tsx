import { Badge } from "@/components/ui/badge";

export type FilterOption = { label: string; value: string };

type Props = {
  label: string;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
};

export function FilterChips({ label, options, value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="mr-1 text-xs text-muted-foreground">{label}:</span>
      <Badge
        variant={value === null ? "default" : "outline"}
        className="cursor-pointer"
        onClick={() => onChange(null)}
      >
        All
      </Badge>
      {options.map((o) => (
        <Badge
          key={o.value}
          variant={value === o.value ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Badge>
      ))}
    </div>
  );
}
