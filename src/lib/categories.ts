import type { CategoryKey } from "@/domain/types";

/** Display order of categories in result cards and comparison. */
export const CATEGORY_ORDER: CategoryKey[] = [
  "housing",
  "mobility",
  "services",
  "health",
  "tranquillity",
  "family",
  "nature",
];

/** Tailwind background class per category (mapped to the chart palette tokens). */
export const CATEGORY_COLOR: Record<CategoryKey, string> = {
  housing: "bg-chart-1",
  mobility: "bg-chart-2",
  services: "bg-chart-3",
  health: "bg-chart-4",
  tranquillity: "bg-chart-5",
  family: "bg-chart-6",
  nature: "bg-chart-7",
};
