import type { ActiveSkuRow, DiohRow } from "../sku-split.types";
import { toDealerCategorySkuKey, toDealerSkuKey } from "./p1-key-utils";

export interface SkuBaseState {
  businessUnit: string;
  sku: string;
  category: string;
  channelCode: string | null;
  hasQuota: boolean;
  j: number;
  k: number;
  l: boolean;
  h: number;
}

/**
 * drawio P1
 * 为单个 SKU 构建基础状态：
 * - J
 * - K
 * - L
 * - H
 * - 以及对应维度 channel/category
 */
export function buildSkuBaseState(params: {
  businessUnit: string;
  dealerCode: string;
  categoryCode: string;
  sku: string;
  invByDealerSku: Map<string, { qty: number }>;
  diohByDealerSku: Map<string, DiohRow>;
  activeSkuByDealerCategorySku: Map<string, ActiveSkuRow>;
  dealerCategorySkuHMap: Map<string, number>;
}): SkuBaseState {
  const {
    businessUnit,
    dealerCode,
    categoryCode,
    sku,
    invByDealerSku,
    diohByDealerSku,
    activeSkuByDealerCategorySku,
    dealerCategorySkuHMap,
  } = params;
  const dealerSkuKey = toDealerSkuKey(dealerCode, sku);
  const dealerCategorySkuKey = toDealerCategorySkuKey(businessUnit, dealerCode, categoryCode, sku);

  const inv = invByDealerSku.get(dealerSkuKey);
  const dioh = diohByDealerSku.get(dealerSkuKey);
  const activeSku = activeSkuByDealerCategorySku.get(dealerCategorySkuKey);

  return {
    businessUnit,
    sku,
    category: categoryCode,
    channelCode: activeSku?.dealer_channel_code || null,
    hasQuota: activeSku?.has_quota ?? false,
    j: inv?.qty ?? 0,
    k: dioh?.dioh_days ?? 0,
    l: dioh?.abc_class === "A",
    h: dealerCategorySkuHMap.get(dealerCategorySkuKey) || 0,
  };
}
