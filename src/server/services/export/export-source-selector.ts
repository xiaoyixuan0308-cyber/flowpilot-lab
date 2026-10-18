import { prisma } from "@/lib/prisma";
import {
  listLoadedCentralWarehouseSkuInventoryRows,
  listLoadedCentralWarehouseSkuIntransitRows,
  listLoadedActiveSkuRows,
  listLoadedCalcBatches,
  listLoadedCalcResultRows,
  listCalcTraceRows,
  listLoadedCalcTraceRows,
  listLoadedCalcResultRowsByPeriodMonth,
  listLoadedCalcTraceRowsByPeriodMonth,
  listLoadedCalendarPatternWeeklyRows,
  listLoadedDealerSkuDnRows,
  listLoadedDealerSkuOpenOrderRows,
  listLoadedDiohTargetRows,
  listLoadedFcstChannelCategoryRows,
  listLoadedFcstT2CategoryRows,
  listLoadedInventoryRows,
  listLoadedBuPatternAmountWeeklyRows,
  listLoadedChannelSkuPurchasePriceRows,
  listLoadedChannelCategoryAllocateRows,
  listLoadedChannelCategoryStatusRows,
  listLoadedChannelCategorySkuStatusRows,
  listLoadedT2PurchaseRows,
  listLoadedSkuBundleRows,
  listLoadedSkuConstraintRows,
  listLoadedSkuSafetyStockRows,
  listLoadedWeeklyAmountThresholdRows,
  listWeeklyCalcBatches,
  getCalcResultNameLookup,
  getWeeklyCalcBatchDetail,
} from "@/server/repositories";
import type { ExportRequest } from "./export.types";
import {
  buildAbcToleranceWhere,
  buildPeriodMonthWhere,
  buildQuotaHistoryWhere,
  buildStatusWhere,
  buildYearMonthWhere,
} from "./export-query-builders";


export async function getLoadedExportRows(
  table: ExportRequest["table"],
  batchId?: string | null,
  filters?: ExportRequest,
) {
  switch (table) {
    case "ods_inventory_dealer_sku":
      return listLoadedInventoryRows();
    case "ods_t2_purchase_monthly":
      return listLoadedT2PurchaseRows();
    case "ods_dioh_dealer_sku":
      return listLoadedDiohTargetRows();
    case "ods_fcst_channel_category_monthly":
      return listLoadedFcstChannelCategoryRows();
    case "ods_fcst_t2_category_monthly":
      return listLoadedFcstT2CategoryRows();
    case "ods_channel_category_allocate_monthly":
      return listLoadedChannelCategoryAllocateRows();
    case "ods_sku_active_list":
      return listLoadedActiveSkuRows();
    case "ods_dealer_sku_dn":
      return listLoadedDealerSkuDnRows();
    case "ods_dealer_sku_open_order":
      return listLoadedDealerSkuOpenOrderRows();
    case "ods_central_warehouse_sku_inventory":
      return listLoadedCentralWarehouseSkuInventoryRows();
    case "ods_central_warehouse_sku_intransit":
      return listLoadedCentralWarehouseSkuIntransitRows();
    case "ods_sku_safety_stock_manual":
      return listLoadedSkuSafetyStockRows();
    case "ods_sku_constraint_manual":
      return listLoadedSkuConstraintRows();
    case "ods_sku_bundle_manual":
      return listLoadedSkuBundleRows();
    case "ods_channel_sku_purchase_price":
      return getChannelSkuPurchasePriceExportRows();
    case "ods_calendar_pattern_weekly":
      return listLoadedCalendarPatternWeeklyRows();
    case "ods_weekly_amount_threshold_manual":
      return listLoadedWeeklyAmountThresholdRows();
    case "ods_bu_pattern_amount_weekly":
      return getBuPatternAmountWeeklyExportRows();
    case "list_channel_category_status_monthly":
      return listLoadedChannelCategoryStatusRows();
    case "list_channel_category_sku_status_monthly":
      return listLoadedChannelCategorySkuStatusRows();
    case "calc_batch":
      return listLoadedCalcBatches();
    case "calc_weekly_sku_split_batch":
      return listWeeklyCalcBatches();
    case "calc_weekly_sku_split_result":
      if (batchId) return getWeeklyCalcBatchDetailRows(batchId, filters);
      return filters?.calendarDate ? getWeeklyCalcBatchDetailRowsByCalendarDate(filters.calendarDate) : [];
    case "calc_sku_split_result":
      if (batchId) return listLoadedCalcResultRows(batchId);
      return filters?.periodMonth ? listLoadedCalcResultRowsByPeriodMonth(filters.periodMonth) : [];
    case "calc_sku_split_trace":
      if (batchId) return listLoadedCalcTraceRows(batchId);
      return filters?.periodMonth ? listLoadedCalcTraceRowsByPeriodMonth(filters.periodMonth) : [];
  }
}

export async function getBatchExportRows(table: ExportRequest["table"], batchId: string) {
  switch (table) {
    case "calc_sku_split_result":
      return getCalcSkuSplitResultRows(batchId);
    case "calc_sku_split_trace":
      return listCalcTraceRows(batchId);
    default:
      return getAllExportRows(table);
  }
}

export async function getAllExportRows(table: ExportRequest["table"]) {
  switch (table) {
    case "ods_inventory_dealer_sku":
      return prisma.ods_inventory_dealer_sku.findMany({ take: 10000 });
    case "ods_t2_purchase_monthly":
      return prisma.ods_t2_purchase_monthly.findMany({ take: 10000 });
    case "ods_dioh_dealer_sku":
      return prisma.ods_dioh_dealer_sku.findMany({ take: 10000 });
    case "ods_fcst_channel_category_monthly":
      return prisma.ods_fcst_channel_category_monthly.findMany({ take: 10000 });
    case "ods_fcst_t2_category_monthly":
      return prisma.ods_fcst_t2_category_monthly.findMany({ take: 10000 });
    case "ods_channel_category_allocate_monthly":
      return prisma.ods_channel_category_allocate_monthly.findMany({ take: 10000 });
    case "ods_sku_active_list":
      return prisma.ods_sku_active_list.findMany({ take: 10000 });
    case "ods_dealer_sku_dn":
      return listLoadedDealerSkuDnRows();
    case "ods_dealer_sku_open_order":
      return listLoadedDealerSkuOpenOrderRows();
    case "ods_central_warehouse_sku_inventory":
      return listLoadedCentralWarehouseSkuInventoryRows();
    case "ods_central_warehouse_sku_intransit":
      return listLoadedCentralWarehouseSkuIntransitRows();
    case "ods_sku_safety_stock_manual":
      return listLoadedSkuSafetyStockRows();
    case "ods_sku_constraint_manual":
      return listLoadedSkuConstraintRows();
    case "ods_sku_bundle_manual":
      return listLoadedSkuBundleRows();
    case "ods_channel_sku_purchase_price":
      return getChannelSkuPurchasePriceExportRows();
    case "ods_calendar_pattern_weekly":
      return prisma.ods_calendar_pattern_weekly.findMany({ take: 10000 });
    case "ods_weekly_amount_threshold_manual":
      return prisma.ods_weekly_amount_threshold_manual.findMany({ take: 10000 });
    case "ods_bu_pattern_amount_weekly":
      return getBuPatternAmountWeeklyExportRows();
    case "list_channel_category_status_monthly":
      return prisma.list_channel_category_status_monthly.findMany({ take: 10000 });
    case "list_channel_category_sku_status_monthly":
      return prisma.list_channel_category_sku_status_monthly.findMany({ take: 10000 });
    case "calc_batch":
      return prisma.calc_batch.findMany({ orderBy: { created_at: "desc" }, take: 10000 });
    case "calc_weekly_sku_split_batch":
      return prisma.calc_weekly_sku_split_batch.findMany({ orderBy: { created_at: "desc" }, take: 10000 });
    case "calc_weekly_sku_split_result":
      return [];
    case "calc_sku_split_result":
    case "calc_sku_split_trace":
      return [];
  }
}

export async function getFilteredExportRows(
  table: ExportRequest["table"],
  filters?: ExportRequest
) {
  switch (table) {
    case "ods_fcst_channel_category_monthly":
      return prisma.ods_fcst_channel_category_monthly.findMany({
        where: buildYearMonthWhere(filters),
        take: 10000,
      });
    case "ods_fcst_t2_category_monthly":
      return prisma.ods_fcst_t2_category_monthly.findMany({
        where: buildYearMonthWhere(filters),
        take: 10000,
      });
    case "ods_t2_purchase_monthly":
      return prisma.ods_t2_purchase_monthly.findMany({
        where: buildYearMonthWhere(filters),
        take: 10000,
      });
    case "ods_inventory_dealer_sku":
      return prisma.ods_inventory_dealer_sku.findMany({
        where: buildYearMonthWhere(filters),
        take: 10000,
      });
    case "ods_sku_active_list":
      return prisma.ods_sku_active_list.findMany({
        where: buildYearMonthWhere(filters),
        take: 10000,
      });
    case "ods_dealer_sku_dn":
      return listLoadedDealerSkuDnRows();
    case "ods_dealer_sku_open_order":
      return listLoadedDealerSkuOpenOrderRows();
    case "ods_central_warehouse_sku_inventory":
      return listLoadedCentralWarehouseSkuInventoryRows();
    case "ods_central_warehouse_sku_intransit":
      return listLoadedCentralWarehouseSkuIntransitRows();
    case "ods_sku_safety_stock_manual":
      return listLoadedSkuSafetyStockRows();
    case "ods_sku_constraint_manual":
      return listLoadedSkuConstraintRows();
    case "ods_sku_bundle_manual":
      return listLoadedSkuBundleRows();
    case "ods_channel_sku_purchase_price":
      return getChannelSkuPurchasePriceExportRows();
    case "ods_calendar_pattern_weekly":
      return prisma.ods_calendar_pattern_weekly.findMany({
        where: filters?.periodMonth ? buildPeriodMonthWhere(filters.periodMonth) : undefined,
        take: 10000,
      });
    case "ods_weekly_amount_threshold_manual":
      return prisma.ods_weekly_amount_threshold_manual.findMany({
        orderBy: { business_unit: "asc" },
        take: 10000,
      });
    case "ods_bu_pattern_amount_weekly":
      return getBuPatternAmountWeeklyExportRows(filters?.periodMonth);
    case "ods_dioh_dealer_sku":
      return prisma.ods_dioh_dealer_sku.findMany({
        where: buildAbcToleranceWhere(filters),
        take: 10000,
      });
    case "ods_channel_category_allocate_monthly":
      return prisma.ods_channel_category_allocate_monthly.findMany({
        where: buildPeriodMonthWhere(filters?.periodMonth),
        take: 10000,
      });
    case "list_channel_category_status_monthly":
      return prisma.list_channel_category_status_monthly.findMany({
        where: {
          ...buildPeriodMonthWhere(filters?.periodMonth),
          ...buildQuotaHistoryWhere(filters),
        },
        take: 10000,
      });
    case "list_channel_category_sku_status_monthly":
      return prisma.list_channel_category_sku_status_monthly.findMany({
        where: {
          ...buildPeriodMonthWhere(filters?.periodMonth),
          ...buildQuotaHistoryWhere(filters),
        },
        take: 10000,
      });
    case "calc_batch":
      return prisma.calc_batch.findMany({
        where: buildStatusWhere(filters),
        orderBy: { created_at: "desc" },
        take: 10000,
      });
    case "calc_weekly_sku_split_batch":
      return prisma.calc_weekly_sku_split_batch.findMany({
        where: {
          ...(filters?.periodMonth ? buildPeriodMonthWhere(filters.periodMonth) : {}),
          ...buildStatusWhere(filters),
        },
        orderBy: { created_at: "desc" },
        take: 10000,
      });
    case "calc_weekly_sku_split_result":
      if (filters?.batchId) return getWeeklyCalcBatchDetailRows(filters.batchId, filters);
      return filters?.calendarDate ? getWeeklyCalcBatchDetailRowsByCalendarDate(filters.calendarDate, filters) : [];
    case "calc_sku_split_result":
      if (filters?.batchId) return getCalcSkuSplitResultRows(filters.batchId, filters);
      return filters?.periodMonth ? getCalcSkuSplitResultRowsByPeriodMonth(filters.periodMonth, filters) : [];
    case "calc_sku_split_trace":
      if (filters?.batchId) {
        return listCalcTraceRows(filters.batchId, {
          categoryCode: filters.categoryCode,
          isError: filters.isError,
        });
      }
      return filters?.periodMonth
        ? listLoadedCalcTraceRowsByPeriodMonth(filters.periodMonth)
        : [];
  }
}

async function getChannelSkuPurchasePriceExportRows() {
  const rows = await listLoadedChannelSkuPurchasePriceRows();
  return rows.map((row) => ({
    ...row,
    central_warehouse_std_sell_price: row.source_sell_price,
    central_warehouse_std_sell_price_vat: row.source_sell_price_vat,
    currency_code: row.source_currency,
  }));
}

async function getBuPatternAmountWeeklyExportRows(periodMonth?: string | null) {
  const rows = await listLoadedBuPatternAmountWeeklyRows();
  return rows
    .filter((row) => !periodMonth || row.period_month === periodMonth)
    .map((row) => ({
      ...row,
      actual_amount: row.source_actual_amount,
      month_target_amount: row.source_month_target_amount,
      month_limit_amount: row.source_month_limit_amount,
      currency_code: row.source_currency,
    }));
}

async function getCalcSkuSplitResultRows(batchId: string, filters?: ExportRequest) {
  return prisma.calc_sku_split_result.findMany({
    where: {
      batch_id: batchId,
      ...(filters?.businessUnit ? { business_unit: filters.businessUnit } : {}),
      ...(filters?.channelCode ? { dealer_channel_code: filters.channelCode } : {}),
      ...(filters?.categoryCode ? { category_code: filters.categoryCode } : {}),
      ...(filters?.sku ? { sku: filters.sku } : {}),
      ...(filters?.isError ? { is_error: filters.isError === "Y" } : {}),
    },
    orderBy: [{ dealer_channel_code: "asc" }, { category_code: "asc" }, { sku: "asc" }],
    take: 10000,
  });
}

async function getCalcSkuSplitResultRowsByPeriodMonth(periodMonth: string, filters?: ExportRequest) {
  const rows = await listLoadedCalcResultRowsByPeriodMonth(periodMonth);

  return rows.filter((row) => {
    if (filters?.businessUnit && row.business_unit !== filters.businessUnit) return false;
    if (filters?.channelCode && row.dealer_channel_code !== filters.channelCode) return false;
    if (filters?.categoryCode && row.category_code !== filters.categoryCode) return false;
    if (filters?.sku && row.sku !== filters.sku) return false;
    if (filters?.isError && (row.is_error ? "Y" : "N") !== filters.isError) return false;
    return true;
  });
}

async function enrichWeeklyResultNames<T extends Record<string, unknown>>(
  rows: T[],
  periodMonth: Date | string,
) {
  const periodMonthKey =
    periodMonth instanceof Date ? periodMonth.toISOString().slice(0, 10) : periodMonth;
  const { channelNameByCode, categoryNameByCode } = await getCalcResultNameLookup(periodMonthKey);

  return rows.map((row) => {
    const channelCode = String(row.channel_code ?? "");
    const categoryCode = String(row.category_code ?? "");

    return {
      ...row,
      channel_name: channelNameByCode[channelCode] ?? row.channel_name ?? channelCode,
      category_name: categoryNameByCode[categoryCode] ?? row.category_name ?? categoryCode,
    };
  });
}

async function getWeeklyCalcBatchDetailRows(batchId: string, filters?: ExportRequest) {
  const detail = await prisma.calc_weekly_sku_split_batch.findUnique({
    where: { id: batchId },
    include: {
      bu_summaries: true,
      results: {
        where: {
          ...(filters?.businessUnit ? { business_unit: filters.businessUnit } : {}),
          ...(filters?.channelCode ? { channel_code: filters.channelCode } : {}),
          ...(filters?.categoryCode ? { category_code: filters.categoryCode } : {}),
          ...(filters?.sku ? { sku: filters.sku } : {}),
        },
        orderBy: [{ business_unit: "asc" }, { channel_code: "asc" }, { category_code: "asc" }, { sku: "asc" }],
        take: 10000,
      },
    },
  });
  if (!detail) return [];

  const summaryByBu = new Map(detail.bu_summaries.map((summary) => [summary.business_unit, summary]));
  const rows = detail.results.map((row) => {
    const summary = summaryByBu.get(row.business_unit);
    return {
      ...row,
      calculation_currency: detail.calculation_currency,
      usd_to_cny_rate: detail.usd_to_cny_rate,
      overage_threshold_pct: summary?.overage_threshold_pct ?? null,
      shortfall_threshold_pct: summary?.shortfall_threshold_pct ?? null,
      system_default_final_amount_total: summary?.system_default_final_amount_total ?? null,
      system_default_pattern_gap_amount: summary?.system_default_pattern_gap_amount ?? null,
      final_amount_total: summary?.final_amount_total ?? null,
      final_pattern_gap_amount: summary?.final_pattern_gap_amount ?? null,
      calendar_date: detail.calendar_date,
      period_month: detail.period_month,
    };
  });

  return enrichWeeklyResultNames(rows, detail.period_month);
}

async function getWeeklyCalcBatchDetailRowsByCalendarDate(
  calendarDate: string,
  filters?: ExportRequest,
) {
  const detail = await getWeeklyCalcBatchDetail(calendarDate);
  if (!detail) return [];

  const rows = detail.results
    .filter((row) => {
      if (filters?.businessUnit && row.business_unit !== filters.businessUnit) return false;
      if (filters?.channelCode && row.channel_code !== filters.channelCode) return false;
      if (filters?.categoryCode && row.category_code !== filters.categoryCode) return false;
      if (filters?.sku && row.sku !== filters.sku) return false;
      return true;
    })
    .map((row) => {
      const summary = detail.bu_summaries.find((item) => item.business_unit === row.business_unit);
      return {
        ...row,
        calculation_currency: detail.calculation_currency,
        usd_to_cny_rate: detail.usd_to_cny_rate,
        overage_threshold_pct: summary?.overage_threshold_pct ?? null,
        shortfall_threshold_pct: summary?.shortfall_threshold_pct ?? null,
        system_default_final_amount_total: summary?.system_default_final_amount_total ?? null,
        system_default_pattern_gap_amount: summary?.system_default_pattern_gap_amount ?? null,
        final_amount_total: summary?.final_amount_total ?? null,
        final_pattern_gap_amount: summary?.final_pattern_gap_amount ?? null,
        calendar_date: detail.calendar_date,
        period_month: detail.period_month,
      };
    });

  return enrichWeeklyResultNames(rows, detail.period_month);
}
