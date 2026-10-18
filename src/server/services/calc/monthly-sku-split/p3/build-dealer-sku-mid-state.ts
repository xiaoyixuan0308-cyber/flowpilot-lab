import { buildSkuBaseState } from "../p1/build-sku-base-state";
import { calcSkuDemandFields, type SkuDemandFields } from "../p2/calc-sku-demand-fields";
import { toDealerCategoryKey, toDealerCategorySkuKey } from "../p1/p1-key-utils";
import type { DealerBaseContext } from "./dealer-calc-context";

export type DealerSkuMidState = SkuDemandFields;

export type DealerSkuQState = DealerSkuMidState & {
  q: number;
};

/**
 * drawio P3
 * 为单个 dealer 先构建 SKU 中间态：
 * - P1: 基础状态
 * - P2: 需求类字段
 *
 * 当前只负责“单个 dealer 下的单个 渠道+产品分类+SKU 中间态装配”，
 * 不在这里做 产品分类 聚合或结果落盘。
 */
export function buildDealerSkuMidState(params: DealerBaseContext) {
  const {
    businessUnit,
    dealerCode,
    activeRowKeys,
    invByDealerSku,
    diohByDealerSku,
    activeSkuByDealerCategorySku,
    dealerCategorySkuHMap,
    dealerCategorySku6mSum,
    dealerCategory6mSum,
    dealerCategoryTMap,
    dealerCategoryUMap,
    dealerCategoryVMap,
  } = params;

  const skuMid = new Map<string, DealerSkuMidState>();

  for (const activeRowKey of activeRowKeys) {
    const [categoryCode, sku] = activeRowKey.split("|");
    const base = buildSkuBaseState({
      businessUnit,
      dealerCode,
      categoryCode,
      sku,
      invByDealerSku,
      diohByDealerSku,
      activeSkuByDealerCategorySku,
      dealerCategorySkuHMap,
    });

    const dealerCategorySkuKey = toDealerCategorySkuKey(businessUnit, dealerCode, categoryCode, sku);
    const dealerCategoryKey = toDealerCategoryKey(businessUnit, dealerCode, base.category);
    const sku6m = dealerCategorySku6mSum.get(dealerCategorySkuKey) || 0;
    const category_6m = dealerCategory6mSum.get(dealerCategoryKey) || 0;
    const t_val = dealerCategoryTMap.get(dealerCategoryKey) || 0;
    const u_val = dealerCategoryUMap.get(dealerCategoryKey) || 0;
    const v_val = dealerCategoryVMap.get(dealerCategoryKey) || 0;

    const demand = calcSkuDemandFields({
      base,
      sku6m,
      category_6m,
      t_val,
      u_val,
      v_val,
    });

    skuMid.set(activeRowKey, demand);
  }

  return skuMid;
}
