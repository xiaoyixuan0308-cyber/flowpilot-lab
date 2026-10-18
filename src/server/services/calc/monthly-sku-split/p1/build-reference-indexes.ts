import type {
  ActiveSkuRow,
  DiohRow,
  InventoryRow,
} from "../sku-split.types";
import { indexFirstByKey, toDealerCategorySkuKey, toDealerSkuKey } from "./p1-key-utils";

export interface P1ReferenceIndexes {
  invByDealerSku: Map<string, InventoryRow>;
  diohByDealerSku: Map<string, DiohRow>;
  activeSkuByDealerCategorySku: Map<string, ActiveSkuRow>;
  dealerGroups: Map<string, string[]>;
}

/**
 * drawio P1
 * 构建基础引用索引：
 * - dealer + sku 库存
 * - dealer + sku DIOH
 * - dealer + category + sku activeSku
 * - dealer -> (category + sku) 分组
 */
export function buildP1ReferenceIndexes(params: {
  year: string;
  month: string;
  inventories: InventoryRow[];
  diohTargets: DiohRow[];
  activeSkus: ActiveSkuRow[];
}): P1ReferenceIndexes {
  const { year, month, inventories, diohTargets, activeSkus } = params;
  const invCurrent = inventories.filter((row) => row.year === year && row.month === month);
  const activeCurrent = activeSkus.filter((row) => row.year === year && row.month === month);

  const dealerCategorySkuSet = new Set<string>();
  const invByDealerSku = new Map<string, InventoryRow>();

  for (const row of invCurrent) {
    const key = toDealerSkuKey(row.dealer_channel_code, row.sku);
    invByDealerSku.set(key, row);
  }

  for (const row of activeCurrent) {
    if (row.dealer_channel_code && row.category_code && row.sku) {
      dealerCategorySkuSet.add(toDealerCategorySkuKey(row.business_unit, row.dealer_channel_code, row.category_code, row.sku));
    }
  }

  const diohByDealerSku = indexFirstByKey(
    diohTargets,
    (row) => toDealerSkuKey(row.dealer_channel_code, row.sku)
  );
  const activeSkuByDealerCategorySku = indexFirstByKey(
    activeCurrent,
    (row) => toDealerCategorySkuKey(row.business_unit, row.dealer_channel_code, row.category_code, row.sku)
  );

  const dealerGroups = new Map<string, string[]>();
  for (const key of dealerCategorySkuSet) {
    const [businessUnit, dealer, category, sku] = key.split("|");
    const dealerGroupKey = `${businessUnit}|${dealer}`;
    if (!dealerGroups.has(dealerGroupKey)) {
      dealerGroups.set(dealerGroupKey, []);
    }
    dealerGroups.get(dealerGroupKey)!.push(`${category}|${sku}`);
  }

  return {
    invByDealerSku,
    diohByDealerSku,
    activeSkuByDealerCategorySku,
    dealerGroups,
  };
}
