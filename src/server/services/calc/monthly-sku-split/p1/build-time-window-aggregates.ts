import type {
  FcstChannelCategoryRow,
  FcstT2CategoryRow,
  T2PurchaseRow,
} from "../sku-split.types";
import { aggregateByKey, getPrevMonth, getYearMonth } from "../sku-split.helpers";
import { toDealerCategoryKey, toDealerCategorySkuKey } from "./p1-key-utils";

export interface P1TimeWindowAggregates {
  year: string;
  month: string;
  dealerCategoryTMap: Map<string, number>;
  dealerCategoryUMap: Map<string, number>;
  dealerCategoryVMap: Map<string, number>;
  dealerCategorySku6mSum: Map<string, number>;
  dealerCategory6mSum: Map<string, number>;
  dealerCategorySkuHMap: Map<string, number>;
  wMap: Map<string, number>;
}

function collectSixMonthPurchases(periodMonth: string, t2Purchases: T2PurchaseRow[]) {
  const sixMonthPurchases: T2PurchaseRow[] = [];

  for (let i = 1; i <= 6; i++) {
    const prev = getYearMonth(getPrevMonth(periodMonth, i));
    sixMonthPurchases.push(
      ...t2Purchases.filter((row) => row.year === prev.year && row.month === prev.month)
    );
  }

  return sixMonthPurchases;
}

/**
 * drawio P1
 * 构建当前计算周期需要的时间窗口聚合：
 * - T / U / V
 * - 6个月历史
 * - MTD
 * - W
 */
export function buildP1TimeWindowAggregates(params: {
  periodMonth: string;
  t2Purchases: T2PurchaseRow[];
  fcstT2Category: FcstT2CategoryRow[];
  fcstChannelCategory: FcstChannelCategoryRow[];
}): P1TimeWindowAggregates {
  const { periodMonth, t2Purchases, fcstT2Category, fcstChannelCategory } = params;
  const { year, month } = getYearMonth(periodMonth);

  const m2 = getYearMonth(getPrevMonth(periodMonth, 2));
  const m1 = getYearMonth(getPrevMonth(periodMonth, 1));

  const tPurchases = t2Purchases.filter((row) => row.year === m2.year && row.month === m2.month);
  const dealerCategoryTMap = aggregateByKey(
    tPurchases,
    (row) => toDealerCategoryKey(row.business_unit, row.parent_dealer_channel_code, row.category_code),
    (row) => row.qty
  );

  const uPurchases = t2Purchases.filter((row) => row.year === m1.year && row.month === m1.month);
  const dealerCategoryUMap = aggregateByKey(
    uPurchases,
    (row) => toDealerCategoryKey(row.business_unit, row.parent_dealer_channel_code, row.category_code),
    (row) => row.qty
  );

  const vFcst = fcstT2Category.filter((row) => row.year === year && row.month === month);
  const dealerCategoryVMap = aggregateByKey(
    vFcst,
    (row) => toDealerCategoryKey(row.business_unit, row.parent_dealer_channel_code, row.category_code),
    (row) => row.fcst_qty
  );

  const sixMonthPurchases = collectSixMonthPurchases(periodMonth, t2Purchases);
  const dealerCategorySku6mSum = aggregateByKey(
    sixMonthPurchases,
    (row) => toDealerCategorySkuKey(row.business_unit, row.parent_dealer_channel_code, row.category_code, row.sku),
    (row) => row.qty
  );
  const dealerCategory6mSum = aggregateByKey(
    sixMonthPurchases,
    (row) => toDealerCategoryKey(row.business_unit, row.parent_dealer_channel_code, row.category_code),
    (row) => row.qty
  );

  const mtdPurchases = t2Purchases.filter((row) => row.year === year && row.month === month);
  const dealerCategorySkuHMap = aggregateByKey(
    mtdPurchases,
    (row) => toDealerCategorySkuKey(row.business_unit, row.parent_dealer_channel_code, row.category_code, row.sku),
    (row) => row.qty
  );

  const fcstChannelCategoryCurrent = fcstChannelCategory.filter((row) => row.year === year && row.month === month);
  const wMap = aggregateByKey(
    fcstChannelCategoryCurrent,
    (row) => toDealerCategoryKey(row.business_unit, row.dealer_channel_code, row.category_code),
    (row) => row.fcst_qty
  );

  return {
    year,
    month,
    dealerCategoryTMap,
    dealerCategoryUMap,
    dealerCategoryVMap,
    dealerCategorySku6mSum,
    dealerCategory6mSum,
    dealerCategorySkuHMap,
    wMap,
  };
}
