import {
  CalculationInput,
  SkuSplitResult,
  SkuSplitTraceRow,
} from "./sku-split.types";
import { buildP1BaseFieldArtifacts } from "./p1/base-field-loaders";
import { buildDealerSkuMidState } from "./p3/build-dealer-sku-mid-state";
import { applyQStarToDealerSkus } from "./p8/apply-qstar-to-dealer-skus";
import { buildDealerResultArtifacts } from "./p10/build-dealer-result-rows";
import type { DealerBaseContext, DealerMidContext } from "./p3/dealer-calc-context";

export function calculateSkuSplit(input: CalculationInput): SkuSplitResult[] {
  return calculateSkuSplitArtifacts(input).results;
}

export function calculateSkuSplitArtifacts(input: CalculationInput): {
  results: SkuSplitResult[];
  traces: SkuSplitTraceRow[];
} {
  const p1 = buildP1BaseFieldArtifacts(input);
  const {
    dealerCategoryTMap,
    dealerCategoryUMap,
    dealerCategoryVMap,
    dealerCategorySku6mSum,
    dealerCategory6mSum,
    dealerCategorySkuHMap,
    wMap,
    invByDealerSku,
    diohByDealerSku,
    activeSkuByDealerCategorySku,
    dealerGroups,
  } = p1;
  const results: SkuSplitResult[] = [];
  const traces: SkuSplitTraceRow[] = [];

  for (const [dealerGroupKey, skus] of dealerGroups) {
    const [businessUnit, dealerCode] = dealerGroupKey.split("|");
    const dealerBaseContext: DealerBaseContext = {
      businessUnit,
      dealerCode,
      activeRowKeys: skus,
      invByDealerSku,
      diohByDealerSku,
      activeSkuByDealerCategorySku,
      dealerCategorySkuHMap,
      dealerCategorySku6mSum,
      dealerCategory6mSum,
      dealerCategoryTMap,
      dealerCategoryUMap,
      dealerCategoryVMap,
    };
    const skuMid = buildDealerSkuMidState(dealerBaseContext);

    const dealerMidContext: DealerMidContext = {
      businessUnit,
      dealerCode,
      skuMid,
      wMap,
    };
    const dealerQContext = applyQStarToDealerSkus(dealerMidContext);

    const dealerArtifacts = buildDealerResultArtifacts(dealerQContext);
    results.push(...dealerArtifacts.results);
    traces.push(...dealerArtifacts.traces);
  }

  return {
    results,
    traces,
  };
}
