import type { ScopeArtifacts } from "@/server/services/scope/scope.types";
import type { SkuSplitResult } from "./sku-split.types";

export function buildRunSkuSplitResponse(
  periodMonth: string,
  scopeArtifacts: ScopeArtifacts,
  results: SkuSplitResult[]
) {
  return {
    success: true,
    periodMonth,
    totalSkus: results.length,
    errorSkus: results.filter((row) => row.isError).length,
    scopeCounts: {
      channelCategoryScope: scopeArtifacts.channelCategoryScopeRows.length,
      channelCategoryStatus: scopeArtifacts.channelCategoryStatusRows.length,
      categorySkuScope: scopeArtifacts.categorySkuScopeRows.length,
      channelCategorySkuStatus: scopeArtifacts.channelCategorySkuStatusRows.length,
    },
    results,
  };
}
