/**
 * drawio P3
 * 输出：
 * - I*：产品分类 层 T2采购MTG
 * - J*：产品分类 层库存
 */
export function buildCategoryAggregates(
  skuMid: Map<
    string,
    {
      f: number;
      j: number;
      i: number;
      category: string;
    }
  >
) {
  const category_fStar = new Map<string, number>();
  const category_iStar = new Map<string, number>();
  const category_jStar = new Map<string, number>();

  for (const [, v] of skuMid) {
    category_fStar.set(v.category, add10(category_fStar.get(v.category) || 0, v.f));
    category_iStar.set(v.category, add10(category_iStar.get(v.category) || 0, v.i));
    category_jStar.set(v.category, add10(category_jStar.get(v.category) || 0, v.j));
  }

  return { category_fStar, category_iStar, category_jStar };
}
import { add10 } from "../../calculation-decimal";
