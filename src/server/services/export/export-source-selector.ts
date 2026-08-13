import { prisma } from "@/lib/prisma";
import {
  listLoadedBscUpnInventoryRows,
  listLoadedBscUpnIntransitRows,
  listLoadedActiveUpnRows,
  listLoadedCalcBatches,
  listLoadedCalcResultRows,
  listCalcTraceRows,
  listLoadedCalcTraceRows,
  listLoadedCalcResultRowsByPeriodMonth,
  listLoadedCalcTraceRowsByPeriodMonth,
  listLoadedCalendarPatternWeeklyRows,
  listLoadedDealerUpnDnRows,
  listLoadedDealerUpnOpenOrderRows,
  listLoadedDiohTargetRows,
  listLoadedFcstLpPl5Rows,
  listLoadedFcstT2Pl5Rows,
  listLoadedInventoryRows,
  listLoadedBuPatternAmountWeeklyRows,
  listLoadedLpUpnPurchasePriceRows,
  listLoadedLpPl5AllocateRows,
  listLoadedLpPl5StatusRows,
  listLoadedLpPl5UpnStatusRows,
  listLoadedT2PurchaseRows,
  listLoadedUpnBundleRows,
  listLoadedUpnConstraintRows,
  listLoadedUpnSafetyStockRows,
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
    case "ods_inventory_dealer_upn":
      return listLoadedInventoryRows();
    case "ods_t2_purchase_monthly":
      return listLoadedT2PurchaseRows();
    case "ods_dioh_dealer_upn":
      return listLoadedDiohTargetRows();
    case "ods_fcst_lp_pl5_monthly":
      return listLoadedFcstLpPl5Rows();
    case "ods_fcst_t2_pl5_monthly":
      return listLoadedFcstT2Pl5Rows();
    case "ods_lp_pl5_allocate_monthly":
      return listLoadedLpPl5AllocateRows();
    case "ods_upn_active_list":
      return listLoadedActiveUpnRows();
    case "ods_dealer_upn_dn":
      return listLoadedDealerUpnDnRows();
    case "ods_dealer_upn_open_order":
      return listLoadedDealerUpnOpenOrderRows();
    case "ods_bsc_upn_inventory":
      return listLoadedBscUpnInventoryRows();
    case "ods_bsc_upn_intransit":
      return listLoadedBscUpnIntransitRows();
    case "ods_upn_safety_stock_manual":
      return listLoadedUpnSafetyStockRows();
    case "ods_upn_constraint_manual":
      return listLoadedUpnConstraintRows();
    case "ods_upn_bundle_manual":
      return listLoadedUpnBundleRows();
    case "ods_lp_upn_purchase_price":
      return getLpUpnPurchasePriceExportRows();
    case "ods_calendar_pattern_weekly":
      return listLoadedCalendarPatternWeeklyRows();
    case "ods_weekly_amount_threshold_manual":
      return listLoadedWeeklyAmountThresholdRows();
    case "ods_bu_pattern_amount_weekly":
      return getBuPatternAmountWeeklyExportRows();
    case "list_lp_pl5_status_monthly":
      return listLoadedLpPl5StatusRows();
    case "list_lp_pl5_upn_status_monthly":
      return listLoadedLpPl5UpnStatusRows();
    case "calc_batch":
      return listLoadedCalcBatches();
    case "calc_weekly_upn_split_batch":
      return listWeeklyCalcBatches();
    case "calc_weekly_upn_split_result":
      if (batchId) return getWeeklyCalcBatchDetailRows(batchId, filters);
      return filters?.calendarDate ? getWeeklyCalcBatchDetailRowsByCalendarDate(filters.calendarDate) : [];
    case "calc_upn_split_result":
      if (batchId) return listLoadedCalcResultRows(batchId);
      return filters?.periodMonth ? listLoadedCalcResultRowsByPeriodMonth(filters.periodMonth) : [];
    case "calc_upn_split_trace":
      if (batchId) return listLoadedCalcTraceRows(batchId);
      return filters?.periodMonth ? listLoadedCalcTraceRowsByPeriodMonth(filters.periodMonth) : [];
  }
}

export async function getBatchExportRows(table: ExportRequest["table"], batchId: string) {
  switch (table) {
    case "calc_upn_split_result":
      return getCalcUpnSplitResultRows(batchId);
    case "calc_upn_split_trace":
      return listCalcTraceRows(batchId);
    default:
      return getAllExportRows(table);
  }
}

export async function getAllExportRows(table: ExportRequest["table"]) {
  switch (table) {
    case "ods_inventory_dealer_upn":
      return prisma.ods_inventory_dealer_upn.findMany({ take: 10000 });
    case "ods_t2_purchase_monthly":
      return prisma.ods_t2_purchase_monthly.findMany({ take: 10000 });
    case "ods_dioh_dealer_upn":
      return prisma.ods_dioh_dealer_upn.findMany({ take: 10000 });
    case "ods_fcst_lp_pl5_monthly":
      return prisma.ods_fcst_lp_pl5_monthly.findMany({ take: 10000 });
    case "ods_fcst_t2_pl5_monthly":
      return prisma.ods_fcst_t2_pl5_monthly.findMany({ take: 10000 });
    case "ods_lp_pl5_allocate_monthly":
      return prisma.ods_lp_pl5_allocate_monthly.findMany({ take: 10000 });
    case "ods_upn_active_list":
      return prisma.ods_upn_active_list.findMany({ take: 10000 });
    case "ods_dealer_upn_dn":
      return listLoadedDealerUpnDnRows();
    case "ods_dealer_upn_open_order":
      return listLoadedDealerUpnOpenOrderRows();
    case "ods_bsc_upn_inventory":
      return listLoadedBscUpnInventoryRows();
    case "ods_bsc_upn_intransit":
      return listLoadedBscUpnIntransitRows();
    case "ods_upn_safety_stock_manual":
      return listLoadedUpnSafetyStockRows();
    case "ods_upn_constraint_manual":
      return listLoadedUpnConstraintRows();
    case "ods_upn_bundle_manual":
      return listLoadedUpnBundleRows();
    case "ods_lp_upn_purchase_price":
      return getLpUpnPurchasePriceExportRows();
    case "ods_calendar_pattern_weekly":
      return prisma.ods_calendar_pattern_weekly.findMany({ take: 10000 });
    case "ods_weekly_amount_threshold_manual":
      return prisma.ods_weekly_amount_threshold_manual.findMany({ take: 10000 });
    case "ods_bu_pattern_amount_weekly":
      return getBuPatternAmountWeeklyExportRows();
    case "list_lp_pl5_status_monthly":
      return prisma.list_lp_pl5_status_monthly.findMany({ take: 10000 });
    case "list_lp_pl5_upn_status_monthly":
      return prisma.list_lp_pl5_upn_status_monthly.findMany({ take: 10000 });
    case "calc_batch":
      return prisma.calc_batch.findMany({ orderBy: { created_at: "desc" }, take: 10000 });
    case "calc_weekly_upn_split_batch":
      return prisma.calc_weekly_upn_split_batch.findMany({ orderBy: { created_at: "desc" }, take: 10000 });
    case "calc_weekly_upn_split_result":
      return [];
    case "calc_upn_split_result":
    case "calc_upn_split_trace":
      return [];
  }
}

export async function getFilteredExportRows(
  table: ExportRequest["table"],
  filters?: ExportRequest
) {
  switch (table) {
    case "ods_fcst_lp_pl5_monthly":
      return prisma.ods_fcst_lp_pl5_monthly.findMany({
        where: buildYearMonthWhere(filters),
        take: 10000,
      });
    case "ods_fcst_t2_pl5_monthly":
      return prisma.ods_fcst_t2_pl5_monthly.findMany({
        where: buildYearMonthWhere(filters),
        take: 10000,
      });
    case "ods_t2_purchase_monthly":
      return prisma.ods_t2_purchase_monthly.findMany({
        where: buildYearMonthWhere(filters),
        take: 10000,
      });
    case "ods_inventory_dealer_upn":
      return prisma.ods_inventory_dealer_upn.findMany({
        where: buildYearMonthWhere(filters),
        take: 10000,
      });
    case "ods_upn_active_list":
      return prisma.ods_upn_active_list.findMany({
        where: buildYearMonthWhere(filters),
        take: 10000,
      });
    case "ods_dealer_upn_dn":
      return listLoadedDealerUpnDnRows();
    case "ods_dealer_upn_open_order":
      return listLoadedDealerUpnOpenOrderRows();
    case "ods_bsc_upn_inventory":
      return listLoadedBscUpnInventoryRows();
    case "ods_bsc_upn_intransit":
      return listLoadedBscUpnIntransitRows();
    case "ods_upn_safety_stock_manual":
      return listLoadedUpnSafetyStockRows();
    case "ods_upn_constraint_manual":
      return listLoadedUpnConstraintRows();
    case "ods_upn_bundle_manual":
      return listLoadedUpnBundleRows();
    case "ods_lp_upn_purchase_price":
      return getLpUpnPurchasePriceExportRows();
    case "ods_calendar_pattern_weekly":
      return prisma.ods_calendar_pattern_weekly.findMany({
        where: filters?.periodMonth ? buildPeriodMonthWhere(filters.periodMonth) : undefined,
        take: 10000,
      });
    case "ods_weekly_amount_threshold_manual":
      return prisma.ods_weekly_amount_threshold_manual.findMany({
        orderBy: { sc_bu: "asc" },
        take: 10000,
      });
    case "ods_bu_pattern_amount_weekly":
      return getBuPatternAmountWeeklyExportRows(filters?.periodMonth);
    case "ods_dioh_dealer_upn":
      return prisma.ods_dioh_dealer_upn.findMany({
        where: buildAbcToleranceWhere(filters),
        take: 10000,
      });
    case "ods_lp_pl5_allocate_monthly":
      return prisma.ods_lp_pl5_allocate_monthly.findMany({
        where: buildPeriodMonthWhere(filters?.periodMonth),
        take: 10000,
      });
    case "list_lp_pl5_status_monthly":
      return prisma.list_lp_pl5_status_monthly.findMany({
        where: {
          ...buildPeriodMonthWhere(filters?.periodMonth),
          ...buildQuotaHistoryWhere(filters),
        },
        take: 10000,
      });
    case "list_lp_pl5_upn_status_monthly":
      return prisma.list_lp_pl5_upn_status_monthly.findMany({
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
    case "calc_weekly_upn_split_batch":
      return prisma.calc_weekly_upn_split_batch.findMany({
        where: {
          ...(filters?.periodMonth ? buildPeriodMonthWhere(filters.periodMonth) : {}),
          ...buildStatusWhere(filters),
        },
        orderBy: { created_at: "desc" },
        take: 10000,
      });
    case "calc_weekly_upn_split_result":
      if (filters?.batchId) return getWeeklyCalcBatchDetailRows(filters.batchId, filters);
      return filters?.calendarDate ? getWeeklyCalcBatchDetailRowsByCalendarDate(filters.calendarDate, filters) : [];
    case "calc_upn_split_result":
      if (filters?.batchId) return getCalcUpnSplitResultRows(filters.batchId, filters);
      return filters?.periodMonth ? getCalcUpnSplitResultRowsByPeriodMonth(filters.periodMonth, filters) : [];
    case "calc_upn_split_trace":
      if (filters?.batchId) {
        return listCalcTraceRows(filters.batchId, {
          pl5Code: filters.pl5Code,
          isError: filters.isError,
        });
      }
      return filters?.periodMonth
        ? listLoadedCalcTraceRowsByPeriodMonth(filters.periodMonth)
        : [];
  }
}

async function getLpUpnPurchasePriceExportRows() {
  const rows = await listLoadedLpUpnPurchasePriceRows();
  return rows.map((row) => ({
    ...row,
    bsc_std_sell_price: row.source_sell_price,
    bsc_std_sell_price_vat: row.source_sell_price_vat,
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

async function getCalcUpnSplitResultRows(batchId: string, filters?: ExportRequest) {
  return prisma.calc_upn_split_result.findMany({
    where: {
      batch_id: batchId,
      ...(filters?.scBu ? { sc_bu: filters.scBu } : {}),
      ...(filters?.lpCode ? { dealerlpcode: filters.lpCode } : {}),
      ...(filters?.pl5Code ? { pl5_code: filters.pl5Code } : {}),
      ...(filters?.upn ? { upn: filters.upn } : {}),
      ...(filters?.isError ? { is_error: filters.isError === "Y" } : {}),
    },
    orderBy: [{ dealerlpcode: "asc" }, { pl5_code: "asc" }, { upn: "asc" }],
    take: 10000,
  });
}

async function getCalcUpnSplitResultRowsByPeriodMonth(periodMonth: string, filters?: ExportRequest) {
  const rows = await listLoadedCalcResultRowsByPeriodMonth(periodMonth);

  return rows.filter((row) => {
    if (filters?.scBu && row.sc_bu !== filters.scBu) return false;
    if (filters?.lpCode && row.dealerlpcode !== filters.lpCode) return false;
    if (filters?.pl5Code && row.pl5_code !== filters.pl5Code) return false;
    if (filters?.upn && row.upn !== filters.upn) return false;
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
  const { lpNameByCode, pl5NameByCode } = await getCalcResultNameLookup(periodMonthKey);

  return rows.map((row) => {
    const lpCode = String(row.lp_code ?? "");
    const pl5Code = String(row.pl5_code ?? "");

    return {
      ...row,
      lp_name: lpNameByCode[lpCode] ?? row.lp_name ?? lpCode,
      pl5_name: pl5NameByCode[pl5Code] ?? row.pl5_name ?? pl5Code,
    };
  });
}

async function getWeeklyCalcBatchDetailRows(batchId: string, filters?: ExportRequest) {
  const detail = await prisma.calc_weekly_upn_split_batch.findUnique({
    where: { id: batchId },
    include: {
      bu_summaries: true,
      results: {
        where: {
          ...(filters?.scBu ? { sc_bu: filters.scBu } : {}),
          ...(filters?.lpCode ? { lp_code: filters.lpCode } : {}),
          ...(filters?.pl5Code ? { pl5_code: filters.pl5Code } : {}),
          ...(filters?.upn ? { upn: filters.upn } : {}),
        },
        orderBy: [{ sc_bu: "asc" }, { lp_code: "asc" }, { pl5_code: "asc" }, { upn: "asc" }],
        take: 10000,
      },
    },
  });
  if (!detail) return [];

  const summaryByBu = new Map(detail.bu_summaries.map((summary) => [summary.sc_bu, summary]));
  const rows = detail.results.map((row) => {
    const summary = summaryByBu.get(row.sc_bu);
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
      if (filters?.scBu && row.sc_bu !== filters.scBu) return false;
      if (filters?.lpCode && row.lp_code !== filters.lpCode) return false;
      if (filters?.pl5Code && row.pl5_code !== filters.pl5Code) return false;
      if (filters?.upn && row.upn !== filters.upn) return false;
      return true;
    })
    .map((row) => {
      const summary = detail.bu_summaries.find((item) => item.sc_bu === row.sc_bu);
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
