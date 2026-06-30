"use client";

import type { AreaScore } from "@/domain/types";
import type { Dictionary } from "@/lib/i18n";
import { CATEGORY_ORDER } from "@/lib/categories";
import { cn } from "@/lib/utils";

function ScoreCell({ value }: { value: number | null }) {
  return <span className="tabular font-medium">{value === null ? "—" : value}</span>;
}

export function AreaComparison({ areas, dict }: { areas: AreaScore[]; dict: Dictionary }) {
  const rows: Array<{ label: string; values: Array<number | null>; strong?: boolean }> = [
    { label: dict.result.overallMatch, values: areas.map((a) => a.overallScore), strong: true },
    ...CATEGORY_ORDER.map((key) => ({
      label: dict.categories[key],
      values: areas.map((a) => a.categoryScores[key]),
    })),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[20rem] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-popover py-2 pr-2 text-left text-xs font-medium text-muted-foreground" />
            {areas.map((a) => (
              <th key={a.areaId} className="px-2 py-2 text-left align-bottom">
                <span className="block max-w-[7rem] truncate font-heading text-sm font-semibold">{a.areaName}</span>
                <span className="text-xs font-normal text-muted-foreground">{dict.confidence[a.confidence].label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={cn("border-t", row.strong && "bg-muted/40")}>
              <th className="sticky left-0 bg-popover py-2 pr-2 text-left text-xs font-normal text-muted-foreground">
                {row.label}
              </th>
              {row.values.map((v, i) => (
                <td key={i} className="px-2 py-2">
                  <ScoreCell value={v} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
