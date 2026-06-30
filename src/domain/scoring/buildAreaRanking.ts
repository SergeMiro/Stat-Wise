import type { AreaProfile, AreaScore, CategoryKey } from "@/domain/types";
import { buildResultExplanation } from "./buildResultExplanation";
import { calculateCategoryScores, type ScoringContext } from "./calculateCategoryScores";
import { calculateDataConfidence } from "./calculateDataConfidence";
import { toScore100, weightedCombine } from "./normalizeMetric";
import type { CategoryWeights } from "./weights";

/** Score every kept area and return them ranked best-first. */
export function buildAreaRanking(
  areas: AreaProfile[],
  ctx: ScoringContext,
  weights: CategoryWeights,
): AreaScore[] {
  const scored = areas.map((area) => scoreArea(area, ctx, weights));

  return scored.sort((a, b) => {
    // Areas with a score rank above those without; then by score desc.
    if (a.overallScore === null && b.overallScore === null) return 0;
    if (a.overallScore === null) return 1;
    if (b.overallScore === null) return -1;
    return b.overallScore - a.overallScore;
  });
}

function scoreArea(
  area: AreaProfile,
  ctx: ScoringContext,
  weights: CategoryWeights,
): AreaScore {
  const categoryScores = calculateCategoryScores(area, ctx);

  const rawScore01 = weightedCombine(
    (Object.keys(weights) as CategoryKey[]).map((k) => [categoryScores[k], weights[k]] as [number | null, number]),
  );

  const confidence = calculateDataConfidence(area, categoryScores, weights);
  const finalScore01 = rawScore01 === null ? null : rawScore01 * confidence.multiplier;

  const explanation = buildResultExplanation(area, categoryScores, ctx.input, weights);

  return {
    areaId: area.areaId,
    areaName: area.areaName,
    areaType: area.areaType,
    overallScore: confidence.multiplier === 0 ? null : toScore100(finalScore01),
    confidence: confidence.label,
    categoryScores: roundCategoryScores(categoryScores),
    strengths: explanation.strengths,
    caveats: explanation.caveats,
    missingData: explanation.missingData,
    sources: explanation.sources,
  };
}

function roundCategoryScores(
  scores: Record<CategoryKey, number | null>,
): Record<CategoryKey, number | null> {
  const out = {} as Record<CategoryKey, number | null>;
  for (const key of Object.keys(scores) as CategoryKey[]) {
    out[key] = toScore100(scores[key]);
  }
  return out;
}
