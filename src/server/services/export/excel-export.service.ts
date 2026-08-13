import ExcelJS from "exceljs";
import { getExportTableDisplayName } from "@/server/constants/export-table-map";
import { normalizeRowValue } from "./export-filter";
import { loadExportRows } from "./export-row-loader";
import type { ExportRequest } from "./export.types";

const WEEKLY_RESULT_HEADER_LABELS: Record<string, string> = {
  batch_id: "计算批次ID",
  sc_bu: "业务单元",
  calculation_currency: "计算币种",
  usd_to_cny_rate: "USD兑CNY汇率",
  overage_threshold_pct: "超额缩减阈值",
  shortfall_threshold_pct: "缺口补差阈值",
  system_default_final_amount_total: "系统默认最终金额合计",
  system_default_pattern_gap_amount: "系统默认差额",
  final_amount_total: "最终金额合计(RRC)",
  final_pattern_gap_amount: "最终差额(RD)",
  lp_code: "LP",
  lp_name: "LP名称",
  pl5_code: "PL5",
  pl5_name: "PL5名称",
  upn: "UPN",
  month_quota_qty: "月建议量(H_row)",
  current_week_pattern_pct: "累计配比(CD)",
  aa_month_delivered_suggestion_pct: "已发占比(AA)",
  ab_current_inventory_days: "当前库存天数(AB)",
  bb_upn_abc_class: "ABC类型(BB)",
  be_original_target_inventory_qty: "目标期末库存(BE)",
  bf_current_inventory_qty: "当前库存(BF)",
  bj_t2_purchase_3m_avg_qty: "T2采购3月均量(BJ)",
  cc_prev_week_pattern_pct: "上周配比(CC)",
  g_week_quota_pattern_total_qty: "累计目标总量(G)",
  month_delivered_qty: "LP本月已发量(L)",
  n_other_dealer_month_delivered_qty: "其他Dealer已发量(N)",
  o_month_delivered_total_qty: "UPN已发总量(O)",
  open_order_or_qty: "LP OR订单(P)",
  other_dealer_open_order_or_qty: "非LP OR订单(R)",
  s_open_order_or_total_qty: "OR订单总量(S)",
  t_open_order_non_or_qty: "LP非OR订单(T)",
  v_other_dealer_open_order_non_or_qty: "非LP非OR订单(V)",
  w_open_order_non_or_total_qty: "非OR订单总量(W)",
  x_open_order_total_qty: "订单总量(X)",
  bsc_inventory_qty: "BSC库存(YA)",
  intransit_qty: "在途量(YB)",
  safety_stock_qty: "安全库存(YC)",
  bsc_available_qty: "可用库存(Y)",
  week_quota_pattern_qty: "累计目标量(J)",
  week_target_pending_qty: "LP待发量(JA)",
  week_target_pending_total_qty: "UPN待发总量(JB)",
  inventory_status: "库存状态(Z)",
  suggest_qty: "建议补货量(AD)",
  remaining_bsc_available_qty: "剩余BSC库存(BH)",
  target_inventory_adjustable_qty: "库存可调上限(BI)",
  post_suggest_dioh: "补货后DIOH(BK)",
  unit_price: "采购单价(AM)",
  suggest_amount: "建议金额(AO)",
  system_adjusted_suggest_qty: "调整后数量(SA)",
  upn_month_cap_qty: "UPN月上限(H_upn)",
  constraint_types: "约束类型(BA)",
  adjustment_allowed_flag: "允许调整(BD)",
  monthly_remaining_adjustable_qty: "月剩余可调量(BL)",
  bundle_qty: "套包数量(BG)",
  gap_fill_qty: "补差量(RA)",
  post_gap_fill_qty: "补差后数量(RB)",
  system_default_final_qty: "系统默认RRA",
  manual_final_qty: "人工RRA",
  final_qty: "生效RRA",
  final_amount: "最终金额(RRB)",
};

const WEEKLY_RESULT_BASE_DATA_FIELDS = new Set<string>([
  "sc_bu",
  "calculation_currency",
  "usd_to_cny_rate",
  "overage_threshold_pct",
  "shortfall_threshold_pct",
  "lp_code",
  "lp_name",
  "pl5_code",
  "pl5_name",
  "upn",
  "month_quota_qty",
  "current_week_pattern_pct",
  "ab_current_inventory_days",
  "bb_upn_abc_class",
  "be_original_target_inventory_qty",
  "bf_current_inventory_qty",
  "bj_t2_purchase_3m_avg_qty",
  "cc_prev_week_pattern_pct",
  "month_delivered_qty",
  "n_other_dealer_month_delivered_qty",
  "o_month_delivered_total_qty",
  "open_order_or_qty",
  "other_dealer_open_order_or_qty",
  "s_open_order_or_total_qty",
  "t_open_order_non_or_qty",
  "v_other_dealer_open_order_non_or_qty",
  "w_open_order_non_or_total_qty",
  "x_open_order_total_qty",
  "bsc_inventory_qty",
  "intransit_qty",
  "safety_stock_qty",
  "unit_price",
  "upn_month_cap_qty",
  "constraint_types",
  "bundle_qty",
  "manual_final_qty",
]);

const NORMAL_HEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F4E78" },
} as const;

const BASE_DATA_HEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF4B183" },
} as const;

const BASE_DATA_CELL_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFF2CC" },
} as const;

function normalizeFileToken(value: string) {
  return value
    .replace(/是/g, "yes")
    .replace(/否/g, "no")
    .replace(/[^a-zA-Z0-9_-]/g, "-");
}

function getExportHeader(table: ExportRequest["table"], field: string) {
  if (table === "calc_weekly_upn_split_result") {
    return WEEKLY_RESULT_HEADER_LABELS[field] ?? field;
  }

  return field;
}

function styleWeeklyResultSheet(sheet: ExcelJS.Worksheet, fields: string[]) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: fields.length },
  };

  fields.forEach((field, index) => {
    const column = sheet.getColumn(index + 1);
    const header = WEEKLY_RESULT_HEADER_LABELS[field] ?? field;
    const isBaseData = WEEKLY_RESULT_BASE_DATA_FIELDS.has(field);
    column.width = Math.max(column.width ?? 20, header.length + 4);

    column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber === 1) {
        cell.font = { bold: true, color: { argb: isBaseData ? "FF000000" : "FFFFFFFF" } };
        cell.fill = isBaseData ? BASE_DATA_HEADER_FILL : NORMAL_HEADER_FILL;
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        return;
      }

      if (isBaseData) {
        cell.fill = BASE_DATA_CELL_FILL;
      }
    });
  });
}

export async function exportTableToExcel(filters: ExportRequest) {
  const { fields, rows } = await loadExportRows(filters);
  const displayName = getExportTableDisplayName(filters.table);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(displayName);
  sheet.columns = fields.map((field) => ({
    header: getExportHeader(filters.table, field),
    key: field,
    width: Math.max(20, getExportHeader(filters.table, field).length + 4),
  }));

  for (const row of rows) {
    const values: Record<string, unknown> = {};
    for (const field of fields) {
      values[field] = normalizeRowValue((row as Record<string, unknown>)[field]);
    }
    sheet.addRow(values);
  }

  if (filters.table === "calc_weekly_upn_split_result") {
    styleWeeklyResultSheet(sheet, fields);
  }

  const suffixParts: string[] = [displayName];
  if (filters.batchId) suffixParts.push(filters.batchId);
  if (filters.scope) suffixParts.push(`scope-${normalizeFileToken(filters.scope)}`);
  if (filters.pl5Code) suffixParts.push(`pl5-${normalizeFileToken(filters.pl5Code)}`);
  if (filters.isError) suffixParts.push(`error-${normalizeFileToken(filters.isError)}`);
  if (filters.periodMonth) suffixParts.push(`period-${normalizeFileToken(filters.periodMonth)}`);
  if (filters.calendarDate) suffixParts.push(`date-${normalizeFileToken(filters.calendarDate)}`);
  if (filters.status) suffixParts.push(`status-${normalizeFileToken(filters.status)}`);
  if (filters.hasQuota) suffixParts.push(`quota-${normalizeFileToken(filters.hasQuota)}`);
  if (filters.hasHistory) suffixParts.push(`history-${normalizeFileToken(filters.hasHistory)}`);
  if (filters.year) suffixParts.push(`year-${normalizeFileToken(filters.year)}`);
  if (filters.month) suffixParts.push(`month-${normalizeFileToken(filters.month)}`);
  if (filters.abcClass) suffixParts.push(`abc-${normalizeFileToken(filters.abcClass)}`);
  if (filters.tolerance) suffixParts.push(`tolerance-${normalizeFileToken(filters.tolerance)}`);
  if (filters.searchKey && filters.searchValue?.trim()) {
    suffixParts.push(`search-${normalizeFileToken(filters.searchKey)}`);
    suffixParts.push(normalizeFileToken(filters.searchValue.trim()));
  }
  if (filters.errorMessage) {
    suffixParts.push(`message-${normalizeFileToken(filters.errorMessage)}`);
  }
  if (!filters.batchId) suffixParts.push(new Date().toISOString().slice(0, 10));

  return {
    buffer: await workbook.xlsx.writeBuffer(),
    fileName: `${suffixParts.join("_")}.xlsx`,
  };
}
