import { buildCategoryQStar } from "./build-category-qstar";
import { buildCategoryAggregates } from "../p3/build-category-aggregates";
import { calcXAfterAllocationDays } from "../p4/calc-x-after-allocation-days";
import { calcTargetInventories } from "../p5/calc-target-inventories";
import type { DealerSkuQState } from "../p3/build-dealer-sku-mid-state";
import { toDealerCategoryKey } from "../p1/p1-key-utils";
import type { DealerMidContext, DealerQContext } from "../p3/dealer-calc-context";

/**
 * drawio P8
 * 在单个 dealer 的 SKU 中间态上补齐：
 * - I* / J*
 * - Q
 * - Q*
 *
 * 返回补齐后的中间态与 产品分类 聚合结果，供后续结果组装使用。
 */
export function applyQStarToDealerSkus(params: DealerMidContext): DealerQContext {
  const { businessUnit, dealerCode, skuMid, wMap } = params;

  const { category_fStar, category_iStar, category_jStar } = buildCategoryAggregates(skuMid);
  const skuQState = new Map<string, DealerSkuQState>();

  for (const [activeRowKey, v] of skuMid) {
    const fStar = category_fStar.get(v.category) || 0;
    const iStar = category_iStar.get(v.category) || 0;
    const jStar = category_jStar.get(v.category) || 0;
    const w = wMap.get(toDealerCategoryKey(businessUnit, dealerCode, v.category)) ?? 0;
    const x = calcXAfterAllocationDays({
      jStar,
      w,
      iStar,
      fStar,
    });

    const { q } = calcTargetInventories({
      x,
      f: v.f,
      k: v.k,
      l: v.l,
      i: v.i,
      j: v.j,
    });

    skuQState.set(activeRowKey, { ...v, q });
  }

  const { category_qStar } = buildCategoryQStar(skuQState);

  return {
    businessUnit,
    dealerCode,
    wMap,
    skuQState,
    category_fStar,
    category_iStar,
    category_jStar,
    category_qStar,
  };
}
