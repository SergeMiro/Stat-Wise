import { cn } from "@/lib/utils";

export function CategoryBar({
  label,
  score,
  colorClass,
}: {
  label: string;
  score: number | null;
  colorClass: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular font-medium text-foreground">{score === null ? "—" : score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {score !== null && (
          <div className={cn("h-full rounded-full transition-all", colorClass)} style={{ width: `${score}%` }} />
        )}
      </div>
    </div>
  );
}
