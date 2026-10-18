import { getPrevMonth, getYearMonth } from "./date-utils";

export const WARNING_DEMO_PERIOD_MONTH = "2026-06-01";

function buildHistoryRows(params: {
  periodMonth: string;
  channelCode: string;
  channelName: string;
  categoryCode: string;
  categoryName: string;
  skuRows: Array<{ sku: string; history: [number, number, number, number, number, number]; mtd: number }>;
}) {
  const { periodMonth, channelCode, channelName, categoryCode, categoryName, skuRows } = params;
  const m1 = getPrevMonth(periodMonth, 1);
  const m2 = getPrevMonth(periodMonth, 2);
  const m3 = getPrevMonth(periodMonth, 3);
  const m4 = getPrevMonth(periodMonth, 4);
  const m5 = getPrevMonth(periodMonth, 5);
  const m6 = getPrevMonth(periodMonth, 6);
  const { year, month } = getYearMonth(periodMonth);
  const historyMonths = [m6, m5, m4, m3, m2, m1];

  return skuRows.flatMap((row) => [
    ...row.history.map((qty, index) => ({
      parent_dealer_channel_code: channelCode,
      parent_dealer_channel_name: channelName,
      sku: row.sku,
      category_code: categoryCode,
      category_name: categoryName,
      qty,
      year: historyMonths[index].year,
      month: historyMonths[index].month,
    })),
    {
      parent_dealer_channel_code: channelCode,
      parent_dealer_channel_name: channelName,
      sku: row.sku,
      category_code: categoryCode,
      category_name: categoryName,
      qty: row.mtd,
      year,
      month,
    },
  ]);
}

export function buildWarningDemoSeedFixtures(
  periodMonth: string = WARNING_DEMO_PERIOD_MONTH,
) {
  const { year, month } = getYearMonth(periodMonth);
  const periodDate = new Date(`${periodMonth}T08:00:00+08:00`);

  return {
    periodMonth,
    periodDate,
    fcstChannelCategory: [
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", category_code: "CATM", category_name: "Category Mismatch", fcst_qty: 2, year, month },
      { dealer_channel_code: "CH902", dealer_channel_name: "Warning Channel 2", category_code: "CATH", category_name: "Category No History", fcst_qty: 60, year, month },
    ],
    fcstT2Category: [
      { parent_dealer_channel_code: "CH901", parent_dealer_channel_name: "Warning Channel 1", category_code: "CATM", category_name: "Category Mismatch", fcst_qty: 36, year, month },
      { parent_dealer_channel_code: "CH901", parent_dealer_channel_name: "Warning Channel 1", category_code: "CATN", category_name: "Category No Quota", fcst_qty: 30, year, month },
      { parent_dealer_channel_code: "CH902", parent_dealer_channel_name: "Warning Channel 2", category_code: "CATH", category_name: "Category No History", fcst_qty: 24, year, month },
    ],
    allocations: [
      { period_month: periodDate, dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", category_code: "CATM", category_name: "Category Mismatch", allocate_qty: 2 },
      { period_month: periodDate, dealer_channel_code: "CH902", dealer_channel_name: "Warning Channel 2", category_code: "CATH", category_name: "Category No History", allocate_qty: 60 },
    ],
    activeSkus: [
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", category_code: "CATM", category_name: "Category Mismatch", sku: "SKU-M1", year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", category_code: "CATM", category_name: "Category Mismatch", sku: "SKU-M2", year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", category_code: "CATM", category_name: "Category Mismatch", sku: "SKU-M3", year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", category_code: "CATN", category_name: "Category No Quota", sku: "SKU-N1", year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", category_code: "CATN", category_name: "Category No Quota", sku: "SKU-N2", year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", category_code: "CATN", category_name: "Category No Quota", sku: "SKU-N3", year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", category_code: "CATH", category_name: "Category No History", sku: "SKU-H1", year, month },
      { dealer_channel_code: "CH902", dealer_channel_name: "Warning Channel 2", category_code: "CATH", category_name: "Category No History", sku: "SKU-H2", year, month },
    ],
    inventories: [
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-M1", qty: 0, year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-M2", qty: 0, year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-M3", qty: 0, year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-N1", qty: 1, year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-N2", qty: 1, year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-N3", qty: 5, year, month },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-H1", qty: 9, year, month },
      { dealer_channel_code: "CH902", dealer_channel_name: "Warning Channel 2", sku: "SKU-H2", qty: 9, year, month },
    ],
    diohTargets: [
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-M1", abc_class: "B", dioh_days: 30 },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-M2", abc_class: "A", dioh_days: 30 },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-M3", abc_class: "B", dioh_days: 30 },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-N1", abc_class: "B", dioh_days: 35 },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-N2", abc_class: "A", dioh_days: 35 },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-N3", abc_class: "B", dioh_days: 35 },
      { dealer_channel_code: "CH901", dealer_channel_name: "Warning Channel 1", sku: "SKU-H1", abc_class: "A", dioh_days: 40 },
      { dealer_channel_code: "CH902", dealer_channel_name: "Warning Channel 2", sku: "SKU-H2", abc_class: "B", dioh_days: 40 },
    ],
    t2Purchases: [
      ...buildHistoryRows({
        periodMonth,
        channelCode: "CH901",
        channelName: "Warning Channel 1",
        categoryCode: "CATM",
        categoryName: "Category Mismatch",
        skuRows: [
          { sku: "SKU-M1", history: [12, 12, 12, 12, 12, 12], mtd: 1 },
          { sku: "SKU-M2", history: [12, 12, 12, 12, 12, 12], mtd: 1 },
          { sku: "SKU-M3", history: [12, 12, 12, 12, 12, 12], mtd: 1 },
        ],
      }),
      ...buildHistoryRows({
        periodMonth,
        channelCode: "CH901",
        channelName: "Warning Channel 1",
        categoryCode: "CATN",
        categoryName: "Category No Quota",
        skuRows: [
          { sku: "SKU-N1", history: [10, 10, 10, 10, 10, 10], mtd: 1 },
          { sku: "SKU-N2", history: [8, 8, 8, 8, 8, 8], mtd: 1 },
          { sku: "SKU-N3", history: [0, 0, 0, 0, 0, 0], mtd: 0 },
        ],
      }),
    ],
  };
}
