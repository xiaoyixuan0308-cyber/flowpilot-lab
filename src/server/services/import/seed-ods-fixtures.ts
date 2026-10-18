export const SEED_PERIOD_MONTH = "2026-06-01";

import { getPrevMonth, getYearMonth } from "./date-utils";

export function buildSeedOdsFixtures(periodMonth: string = SEED_PERIOD_MONTH) {
  const { year, month } = getYearMonth(periodMonth);
  const m1 = getPrevMonth(periodMonth, 1);
  const m2 = getPrevMonth(periodMonth, 2);
  const m3 = getPrevMonth(periodMonth, 3);
  const m4 = getPrevMonth(periodMonth, 4);
  const m5 = getPrevMonth(periodMonth, 5);
  const m6 = getPrevMonth(periodMonth, 6);
  const periodDate = new Date(`${periodMonth}T08:00:00+08:00`);

  return {
    periodMonth,
    periodDate,
    fcstChannelCategory: [
      {
        dealer_channel_code: "CH001",
        dealer_channel_name: "Channel One",
        category_code: "CATA",
        category_name: "Category Alpha",
        fcst_qty: 120,
        year,
        month,
      },
      {
        dealer_channel_code: "CH001",
        dealer_channel_name: "Channel One",
        category_code: "CATB",
        category_name: "Category Beta",
        fcst_qty: 80,
        year,
        month,
      },
    ],
    fcstT2Category: [
      {
        parent_dealer_channel_code: "CH001",
        parent_dealer_channel_name: "Channel One",
        category_code: "CATA",
        category_name: "Category Alpha",
        fcst_qty: 90,
        year,
        month,
      },
      {
        parent_dealer_channel_code: "CH001",
        parent_dealer_channel_name: "Channel One",
        category_code: "CATB",
        category_name: "Category Beta",
        fcst_qty: 60,
        year,
        month,
      },
    ],
    allocations: [
      {
        period_month: periodDate,
        dealer_channel_code: "CH001",
        dealer_channel_name: "Channel One",
        category_code: "CATA",
        category_name: "Category Alpha",
        allocate_qty: 120,
      },
      {
        period_month: periodDate,
        dealer_channel_code: "CH001",
        dealer_channel_name: "Channel One",
        category_code: "CATB",
        category_name: "Category Beta",
        allocate_qty: 80,
      },
    ],
    activeSkus: [
      {
        dealer_channel_code: "CH001",
        dealer_channel_name: "Channel One",
        category_code: "CATA",
        category_name: "Category Alpha",
        sku: "SKU-A1",
        year,
        month,
      },
      {
        dealer_channel_code: "CH001",
        dealer_channel_name: "Channel One",
        category_code: "CATA",
        category_name: "Category Alpha",
        sku: "SKU-A2",
        year,
        month,
      },
      {
        dealer_channel_code: "CH001",
        dealer_channel_name: "Channel One",
        category_code: "CATB",
        category_name: "Category Beta",
        sku: "SKU-B1",
        year,
        month,
      },
    ],
    inventories: [
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-A1", qty: 30, year, month },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-A2", qty: 20, year, month },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-B1", qty: 10, year, month },
    ],
    diohTargets: [
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-A1", abc_class: "A", dioh_days: 45 },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-A2", abc_class: "B", dioh_days: 30 },
      { dealer_channel_code: "CH001", dealer_channel_name: "Channel One", sku: "SKU-B1", abc_class: "A", dioh_days: 25 },
    ],
    t2Purchases: [
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A1", category_code: "CATA", category_name: "Category Alpha", qty: 40, year, month: m6.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A2", category_code: "CATA", category_name: "Category Alpha", qty: 20, year, month: m6.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-B1", category_code: "CATB", category_name: "Category Beta", qty: 30, year, month: m6.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A1", category_code: "CATA", category_name: "Category Alpha", qty: 36, year: m5.year, month: m5.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A2", category_code: "CATA", category_name: "Category Alpha", qty: 18, year: m5.year, month: m5.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-B1", category_code: "CATB", category_name: "Category Beta", qty: 28, year: m5.year, month: m5.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A1", category_code: "CATA", category_name: "Category Alpha", qty: 42, year: m4.year, month: m4.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A2", category_code: "CATA", category_name: "Category Alpha", qty: 19, year: m4.year, month: m4.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-B1", category_code: "CATB", category_name: "Category Beta", qty: 27, year: m4.year, month: m4.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A1", category_code: "CATA", category_name: "Category Alpha", qty: 45, year: m3.year, month: m3.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A2", category_code: "CATA", category_name: "Category Alpha", qty: 22, year: m3.year, month: m3.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-B1", category_code: "CATB", category_name: "Category Beta", qty: 26, year: m3.year, month: m3.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A1", category_code: "CATA", category_name: "Category Alpha", qty: 38, year: m2.year, month: m2.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A2", category_code: "CATA", category_name: "Category Alpha", qty: 24, year: m2.year, month: m2.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-B1", category_code: "CATB", category_name: "Category Beta", qty: 25, year: m2.year, month: m2.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A1", category_code: "CATA", category_name: "Category Alpha", qty: 35, year: m1.year, month: m1.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A2", category_code: "CATA", category_name: "Category Alpha", qty: 21, year: m1.year, month: m1.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-B1", category_code: "CATB", category_name: "Category Beta", qty: 24, year: m1.year, month: m1.month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A1", category_code: "CATA", category_name: "Category Alpha", qty: 12, year, month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-A2", category_code: "CATA", category_name: "Category Alpha", qty: 8, year, month },
      { parent_dealer_channel_code: "CH001", parent_dealer_channel_name: "Channel One", sku: "SKU-B1", category_code: "CATB", category_name: "Category Beta", qty: 5, year, month },
    ],
  };
}
