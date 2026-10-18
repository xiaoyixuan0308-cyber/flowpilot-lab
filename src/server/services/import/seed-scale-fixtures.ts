import { getPrevMonth, getYearMonth } from "./date-utils";

export const SCALE_PERIOD_MONTH = "2026-06-01";

function buildHistoryRows(periodMonth: string, channelCode: string, channelName: string, categoryCode: string, categoryName: string, sku: string, base: number) {
  const months = Array.from({ length: 6 }, (_, i) => getPrevMonth(periodMonth, 6 - i));
  const { year, month } = getYearMonth(periodMonth);
  return [
    ...months.map((item, idx) => ({
      parent_dealer_channel_code: channelCode,
      parent_dealer_channel_name: channelName,
      sku,
      category_code: categoryCode,
      category_name: categoryName,
      qty: base + idx,
      year: item.year,
      month: item.month,
    })),
    {
      parent_dealer_channel_code: channelCode,
      parent_dealer_channel_name: channelName,
      sku,
      category_code: categoryCode,
      category_name: categoryName,
      qty: Math.max(Math.floor(base / 4), 0),
      year,
      month,
    },
  ];
}

export function buildScaleSeedFixtures(
  periodMonth: string = SCALE_PERIOD_MONTH,
  options?: {
    channelCount?: number;
    categoryCount?: number;
    skuPerChannelCategory?: number;
  },
) {
  const { year, month } = getYearMonth(periodMonth);
  const periodDate = new Date(`${periodMonth}T08:00:00+08:00`);
  const channelCount = options?.channelCount ?? 3;
  const categoryCount = options?.categoryCount ?? 4;
  const skuPerChannelCategory = options?.skuPerChannelCategory ?? 3;

  const channelDefs = Array.from({ length: channelCount }, (_, i) => ({
    code: `Channel${String(101 + i).padStart(3, "0")}`,
    name: `Channel ${101 + i}`,
  }));
  const categoryDefs = Array.from({ length: categoryCount }, (_, i) => ({
    code: `Category${String.fromCharCode(65 + i)}`,
    name: `Category ${String.fromCharCode(65 + i)}`,
  }));

  const fcstChannelCategory = [];
  const fcstT2Category = [];
  const allocations = [];
  const activeSkus = [];
  const inventories = [];
  const diohTargets = [];
  const t2Purchases = [];

  let skuIndex = 1;
  for (const [channelIdx, channel] of channelDefs.entries()) {
    for (const [categoryIdx, category] of categoryDefs.entries()) {
      const fcstQty = 60 + channelIdx * 20 + categoryIdx * 10;
      fcstChannelCategory.push({
        dealer_channel_code: channel.code,
        dealer_channel_name: channel.name,
        category_code: category.code,
        category_name: category.name,
        fcst_qty: fcstQty,
        year,
        month,
      });
      fcstT2Category.push({
        parent_dealer_channel_code: channel.code,
        parent_dealer_channel_name: channel.name,
        category_code: category.code,
        category_name: category.name,
        fcst_qty: fcstQty - 15,
        year,
        month,
      });
      allocations.push({
        period_month: periodDate,
        dealer_channel_code: channel.code,
        dealer_channel_name: channel.name,
        category_code: category.code,
        category_name: category.name,
        allocate_qty: fcstQty,
      });

      for (let i = 0; i < skuPerChannelCategory; i++) {
        const sku = `SKU-S${String(skuIndex).padStart(3, "0")}`;
        skuIndex += 1;
        activeSkus.push({
          dealer_channel_code: channel.code,
          dealer_channel_name: channel.name,
          category_code: category.code,
          category_name: category.name,
          sku,
          year,
          month,
        });
        inventories.push({
          dealer_channel_code: channel.code,
          dealer_channel_name: channel.name,
          sku,
          qty: 10 + i * 5 + channelIdx * 3 + categoryIdx * 2,
          year,
          month,
        });
        diohTargets.push({
          dealer_channel_code: channel.code,
          dealer_channel_name: channel.name,
          sku,
          abc_class: i % 2 === 0 ? "A" : "B",
          dioh_days: 25 + i * 5 + categoryIdx * 3,
        });
        t2Purchases.push(
          ...buildHistoryRows(
            periodMonth,
            channel.code,
            channel.name,
            category.code,
            category.name,
            sku,
            8 + i * 2 + channelIdx + categoryIdx,
          ),
        );
      }
    }
  }

  return {
    periodMonth,
    fcstChannelCategory,
    fcstT2Category,
    allocations,
    activeSkus,
    inventories,
    diohTargets,
    t2Purchases,
  };
}
