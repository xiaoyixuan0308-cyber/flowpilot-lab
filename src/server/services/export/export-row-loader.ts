import { EXPORT_TABLE_FIELDS } from "@/server/constants/export-table-map";
import { prisma } from "@/lib/prisma";
import {
  getCalcBatchPeriodMonth,
  getCalcResultNameLookup,
  listCalcTraceRows,
  listLoadedCalcTraceRowsByPeriodMonth,
} from "@/server/repositories";
import type { ExportRequest } from "./export.types";
import {
  applyLoadedScopeFilters,
  applySearchFilter,
} from "./export-filter";
import {
  getAllExportRows,
  getBatchExportRows,
  getFilteredExportRows,
  getLoadedExportRows,
} from "./export-source-selector";

const CALC_RESULT_EXPORT_FIELDS = [
  "batch_id",
  "lp_name",
  "pl5_name",
  "upn",
  "e_t2_mix_portion",
  "f_t2_purchase_3m_avg",
  "g_t2_purchase_m0",
  "h_t2_purchase_mtd",
  "t_pl5_purchase_m2",
  "u_pl5_purchase_m1",
  "v_pl5_purchase_m0_fcst",
  "i_t2_purchase_mtg",
  "j_opening_inventory",
  "k_target_days",
  "l_tolerance",
  "q_actual_theoretical",
  "q_star_pl5_theoretical",
  "w_mtg_allocate_qty",
  "r_base_replenish",
  "s_tolerance_replenish",
  "t_adjusted_dioh",
  "current_dioh",
  "is_error",
  "error_message",
  "error_id",
];

function toPeriodDate(periodMonth: string) {
  return new Date(`${periodMonth.slice(0, 10)}T08:00:00+08:00`);
}

function emptyCalcExportMetrics() {
  return {
    e_t2_mix_portion: null,
    f_t2_purchase_3m_avg: null,
    g_t2_purchase_m0: null,
    h_t2_purchase_mtd: null,
    t_pl5_purchase_m2: null,
    u_pl5_purchase_m1: null,
    v_pl5_purchase_m0_fcst: null,
    i_t2_purchase_mtg: null,
    j_opening_inventory: null,
    k_target_days: null,
    l_tolerance: null,
    q_actual_theoretical: null,
    q_star_pl5_theoretical: null,
    w_mtg_allocate_qty: null,
    r_base_replenish: null,
    s_tolerance_replenish: null,
    t_adjusted_dioh: null,
    current_dioh: null,
  };
}

async function loadSkippedCalcScopeRows(periodMonth: string, batchId?: string | null) {
  const periodDate = toPeriodDate(periodMonth);
  const [lpPl5Rows, lpPl5UpnRows] = await Promise.all([
    prisma.list_lp_pl5_status_monthly.findMany({
      where: {
        period_month: periodDate,
        error_id: { not: null },
      },
      include: { error_catalog: true },
    }),
    prisma.list_lp_pl5_upn_status_monthly.findMany({
      where: {
        period_month: periodDate,
        error_id: { not: null },
      },
      include: { error_catalog: true },
    }),
  ]);

  const upnRows = lpPl5UpnRows.map((row) => ({
    batch_id: batchId ?? "",
    dealerlpcode: row.lp_code,
    lp_name: row.lp_name,
    pl5_code: row.pl5_code,
    pl5_name: row.pl5_name,
    upn: row.upn,
    ...emptyCalcExportMetrics(),
    is_error: true,
    error_message: row.error_catalog?.error_message ?? "",
    error_id: row.error_id,
  }));

  const upnErrorKeys = new Set(lpPl5UpnRows.map((row) => `${row.lp_code}|${row.pl5_code}`));
  const pl5Rows = lpPl5Rows
    .filter((row) => !upnErrorKeys.has(`${row.lp_code}|${row.pl5_code}`))
    .map((row) => ({
      batch_id: batchId ?? "",
      dealerlpcode: row.lp_code,
      lp_name: row.lp_name,
      pl5_code: row.pl5_code,
      pl5_name: row.pl5_name,
      upn: "",
      ...emptyCalcExportMetrics(),
      is_error: true,
      error_message: row.error_catalog?.error_message ?? "",
      error_id: row.error_id,
    }));

  return [...upnRows, ...pl5Rows];
}

async function loadFullCalcResultExportRows(filters: ExportRequest) {
  const periodMonth = filters.periodMonth ?? (
    filters.batchId ? await getCalcBatchPeriodMonth(filters.batchId) : null
  );
  if (!periodMonth) return [];

  const computedRows = filters.batchId
    ? await listCalcTraceRows(filters.batchId, {
        pl5Code: filters.pl5Code,
        isError: filters.isError,
      })
    : await listLoadedCalcTraceRowsByPeriodMonth(periodMonth);
  const skippedRows = await loadSkippedCalcScopeRows(periodMonth, filters.batchId);
  const rows = [...(computedRows as unknown as Record<string, unknown>[]), ...skippedRows];

  return rows
    .filter((row) => {
      if (filters.pl5Code && row.pl5_code !== filters.pl5Code) return false;
      if (filters.isError && (row.is_error ? "Y" : "N") !== filters.isError) return false;
      return true;
    })
    .sort((a, b) =>
      String(a.dealerlpcode ?? "").localeCompare(String(b.dealerlpcode ?? "")) ||
      String(a.pl5_code ?? "").localeCompare(String(b.pl5_code ?? "")) ||
      String(a.upn ?? "").localeCompare(String(b.upn ?? ""))
    );
}

async function transformCalcResultRows(
  rows: Record<string, unknown>[],
  batchId?: string | null,
  filterPeriodMonth?: string | null,
) {
  const periodMonth = batchId
    ? await getCalcBatchPeriodMonth(batchId)
    : filterPeriodMonth;
  if (!periodMonth) return rows;

  const { lpNameByCode, pl5NameByCode } = await getCalcResultNameLookup(periodMonth);

  return rows.map((row) => {
    const dealerlpcode = String(row.dealerlpcode ?? "");
    const pl5Code = String(row.pl5_code ?? "");

    return {
      ...row,
      lp_name: lpNameByCode[dealerlpcode] ?? row.lp_name ?? dealerlpcode,
      pl5_name: pl5NameByCode[pl5Code] ?? row.pl5_name ?? pl5Code,
    };
  });
}

export async function loadExportRows(filters: ExportRequest) {
  const fields =
    filters.table === "calc_upn_split_result"
      ? [...CALC_RESULT_EXPORT_FIELDS]
      : [...EXPORT_TABLE_FIELDS[filters.table]];
  const rawRows =
    filters.table === "calc_upn_split_result"
      ? await loadFullCalcResultExportRows(filters)
      : filters.scope === "loaded"
      ? await getLoadedExportRows(filters.table, filters.batchId, filters)
      : filters.scBu ||
            filters.periodMonth ||
            filters.calendarDate ||
            filters.status ||
            filters.hasQuota ||
            filters.hasHistory ||
            filters.year ||
            filters.month ||
            filters.abcClass ||
            filters.tolerance
        ? await getFilteredExportRows(filters.table, filters)
        : filters.batchId
          ? await getBatchExportRows(filters.table, filters.batchId)
          : await getAllExportRows(filters.table);

  const scopeFilteredRows =
    filters.scope === "loaded"
      ? applyLoadedScopeFilters(filters.table, rawRows as Record<string, unknown>[], filters)
      : (rawRows as Record<string, unknown>[]);
  const exportRows =
    filters.table === "calc_upn_split_result"
      ? await transformCalcResultRows(scopeFilteredRows, filters.batchId, filters.periodMonth)
      : scopeFilteredRows;

  return {
    fields,
    rows: applySearchFilter(exportRows, fields, filters.searchKey, filters.searchValue),
  };
}
