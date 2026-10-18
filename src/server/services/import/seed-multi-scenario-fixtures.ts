import { getPrevMonth, getYearMonth } from "./date-utils";

export const MULTI_SCENARIO_PERIOD_MONTH = "2026-06-01";

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

export function buildMultiScenarioSeedFixtures(
  periodMonth: string = MULTI_SCENARIO_PERIOD_MONTH,
) {
  const { year, month } = getYearMonth(periodMonth);
  const periodDate = new Date(`${periodMonth}T08:00:00+08:00`);

  return {
    periodMonth,
    periodDate,
    fcstChannelCategory: [
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", category_code: "CATA", category_name: "Category Alpha", fcst_qty: 120, year, month },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", category_code: "CATB", category_name: "Category Beta", fcst_qty: 90, year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", category_code: "CATA", category_name: "Category Alpha", fcst_qty: 80, year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", category_code: "CATC", category_name: "Category Gamma", fcst_qty: 75, year, month },
    ],
    fcstT2Category: [
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", category_code: "CATA", category_name: "Category Alpha", fcst_qty: 70, year, month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", category_code: "CATB", category_name: "Category Beta", fcst_qty: 65, year, month },
      { parent_dealer_channel_code: "CH002", parent_dealer_channel_name: "Channel Two", category_code: "CATA", category_name: "Category Alpha", fcst_qty: 48, year, month },
      { parent_dealer_channel_code: "CH002", parent_dealer_channel_name: "Channel Two", category_code: "CATB", category_name: "Category Beta", fcst_qty: 35, year, month },
      { parent_dealer_channel_code: "CH002", parent_dealer_channel_name: "Channel Two", category_code: "CATC", category_name: "Category Gamma", fcst_qty: 40, year, month },
    ],
    allocations: [
      { period_month: periodDate, dealer_channel_code: "CH001", dealer_channel_name: "Channel One", category_code: "CATA", category_name: "Category Alpha", allocate_qty: 120 },
      { period_month: periodDate, dealer_channel_code: "CH001", dealer_channel_name: "Channel One", category_code: "CATB", category_name: "Category Beta", allocate_qty: 0 },
      { period_month: periodDate, dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", category_code: "CATA", category_name: "Category Alpha", allocate_qty: 80 },
      { period_month: periodDate, dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", category_code: "CATC", category_name: "Category Gamma", allocate_qty: 75 },
    ],
    activeSkus: [
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", category_code: "CATA", category_name: "Category Alpha", sku: "SKU-A1", year, month },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", category_code: "CATA", category_name: "Category Alpha", sku: "SKU-A2", year, month },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", category_code: "CATB", category_name: "Category Beta", sku: "SKU-B1", year, month },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", category_code: "CATB", category_name: "Category Beta", sku: "SKU-B2", year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", category_code: "CATA", category_name: "Category Alpha", sku: "SKU-A3", year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", category_code: "CATA", category_name: "Category Alpha", sku: "SKU-A4", year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", category_code: "CATB", category_name: "Category Beta", sku: "SKU-B3", year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", category_code: "CATB", category_name: "Category Beta", sku: "SKU-B4", year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", category_code: "CATC", category_name: "Category Gamma", sku: "SKU-C1", year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", category_code: "CATC", category_name: "Category Gamma", sku: "SKU-C2", year, month },
    ],
    inventories: [
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-A1", qty: 15, year, month },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-A2", qty: 42, year, month },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-B1", qty: 36, year, month },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-B2", qty: 18, year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-A3", qty: 20, year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-A4", qty: 16, year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-B3", qty: 4, year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-B4", qty: 3, year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-C1", qty: 10, year, month },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-C2", qty: 50, year, month },
    ],
    diohTargets: [
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-A1", abc_class: "B", dioh_days: 30 },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-A2", abc_class: "A", dioh_days: 45 },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-B1", abc_class: "B", dioh_days: 28 },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-B2", abc_class: "A", dioh_days: 35 },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-A3", abc_class: "B", dioh_days: 32 },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-A4", abc_class: "A", dioh_days: 40 },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-B3", abc_class: "B", dioh_days: 30 },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-B4", abc_class: "A", dioh_days: 42 },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-C1", abc_class: "A", dioh_days: 50 },
      { dealer_channel_code: "CH002", dealer_channel_name: "Channel Two", sku: "SKU-C2", abc_class: "B", dioh_days: 25 },
    ],
    t2Purchases: [
      ...buildHistoryRows({
        periodMonth,
        channelCode: "CH001",
        channelName: "Channel One",
        categoryCode: "CATA",
        categoryName: "Category Alpha",
        skuRows: [
          { sku: "SKU-A1", history: [22, 23, 21, 24, 23, 25], mtd: 12 },
          { sku: "SKU-A2", history: [18, 19, 20, 18, 19, 20], mtd: 10 },
        ],
      }),
      ...buildHistoryRows({
        periodMonth,
        channelCode: "CH001",
        channelName: "Channel One",
        categoryCode: "CATB",
        categoryName: "Category Beta",
        skuRows: [
          { sku: "SKU-B1", history: [16, 15, 17, 16, 15, 17], mtd: 7 },
          { sku: "SKU-B2", history: [0, 0, 0, 0, 0, 0], mtd: 0 },
        ],
      }),
      ...buildHistoryRows({
        periodMonth,
        channelCode: "CH002",
        channelName: "Channel Two",
        categoryCode: "CATA",
        categoryName: "Category Alpha",
        skuRows: [
          { sku: "SKU-A3", history: [14, 13, 15, 14, 13, 15], mtd: 6 },
          { sku: "SKU-A4", history: [12, 11, 12, 11, 12, 11], mtd: 4 },
        ],
      }),
      ...buildHistoryRows({
        periodMonth,
        channelCode: "CH002",
        channelName: "Channel Two",
        categoryCode: "CATB",
        categoryName: "Category Beta",
        skuRows: [
          { sku: "SKU-B3", history: [10, 9, 10, 9, 10, 9], mtd: 3 },
          { sku: "SKU-B4", history: [8, 7, 8, 7, 8, 7], mtd: 2 },
        ],
      }),
      ...buildHistoryRows({
        periodMonth,
        channelCode: "CH002",
        channelName: "Channel Two",
        categoryCode: "CATC",
        categoryName: "Category Gamma",
        skuRows: [
          { sku: "SKU-C1", history: [0, 0, 0, 0, 0, 0], mtd: 0 },
          { sku: "SKU-C2", history: [0, 0, 0, 0, 0, 0], mtd: 0 },
        ],
      }),
    ],
  };
}
