export function ScoreGauge({
  score,
  size = 68,
  label,
}: {
  score: number | null;
  size?: number;
  label?: string;
}) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = score ?? 0;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        {score !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500"
          />
        )}
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span className="tabular text-lg font-semibold">{score === null ? "—" : score}</span>
        {label ? <span className="text-[0.6rem] text-muted-foreground">{label}</span> : null}
      </span>
    </div>
  );
}
