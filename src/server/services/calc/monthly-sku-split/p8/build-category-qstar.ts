import type { DealerSkuQState } from "../p3/build-dealer-sku-mid-state";
import { add10 } from "../../calculation-decimal";

/**
 * drawio P8
 * 输出：
 * - Q*：产品分类 实际理论补货总量
 */
export function buildCategoryQStar(
  skuMid: Map<string, DealerSkuQState>
) {
  const category_qStar = new Map<string, number>();
  for (const [, val] of skuMid) {
    category_qStar.set(val.category, add10(category_qStar.get(val.category) || 0, val.q));
  }
  return { category_qStar };
}
