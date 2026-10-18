import type { ExportRequest } from "./export.types";

export function normalizeRowValue(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "object" && value !== null && "toString" in value) {
    return (value as { toString: () => string }).toString();
  }

  return value == null ? "" : String(value);
}

export function applySearchFilter(
  rows: Record<string, unknown>[],
  fields: string[],
  searchKey?: string | null,
  searchValue?: string | null
) {
  if (!searchKey || !searchValue?.trim()) {
    return rows;
  }

  const keyword = searchValue.trim().toLowerCase();
  const requestedFields = searchKey.split(",").map((field) => field.trim());
  const searchableFields = requestedFields.filter((field) => fields.includes(field));
  if (searchableFields.length === 0) return rows;

  return rows.filter((row) =>
    searchableFields.some((field) =>
      normalizeRowValue(row[field]).toLowerCase().includes(keyword)
    )
  );
}

function normalizeBooleanFlag(value: unknown) {
  return value ? "Y" : "N";
}

export function applyLoadedScopeFilters(
  table: string,
  rows: Record<string, unknown>[],
  filters: ExportRequest
) {
  return rows.filter((row) => {
    const periodMonth = normalizeRowValue(row.period_month);
    const calendarDate = normalizeRowValue(row.calendar_date);
    const businessUnit = normalizeRowValue(row.business_unit);
    const year = normalizeRowValue(row.year);
    const month = normalizeRowValue(row.month);
    const abcClass = normalizeRowValue(row.abc_class);
    const categoryCode = normalizeRowValue(row.category_code);
    const channelCode = normalizeRowValue(row.channel_code || row.dealer_channel_code);
    const sku = normalizeRowValue(row.sku);
    const status = normalizeRowValue(row.status);
    const hasQuota = normalizeBooleanFlag(row.has_quota);
    const hasHistory = normalizeBooleanFlag(row.has_history);
    const isError = normalizeBooleanFlag(row.is_error);
    const errorMessage = normalizeRowValue(row.error_message);
    const tolerance = abcClass === "A" ? "是" : "否";

    if (table === "calc_sku_split_result" || table === "calc_sku_split_trace") {
      if (filters.businessUnit && businessUnit !== filters.businessUnit) return false;
      if (filters.channelCode && channelCode !== filters.channelCode) return false;
      if (filters.categoryCode && categoryCode !== filters.categoryCode) return false;
      if (filters.sku && sku !== filters.sku) return false;
      if (filters.isError && isError !== filters.isError) return false;
    }

    if (table === "calc_weekly_sku_split_result") {
      if (filters.businessUnit && businessUnit !== filters.businessUnit) return false;
      if (filters.channelCode && channelCode !== filters.channelCode) return false;
      if (filters.categoryCode && categoryCode !== filters.categoryCode) return false;
      if (filters.sku && sku !== filters.sku) return false;
      if (filters.calendarDate && calendarDate !== filters.calendarDate) return false;
    }

    if (filters.errorMessage && errorMessage !== filters.errorMessage) return false;
    if (filters.periodMonth && periodMonth !== filters.periodMonth) return false;
    if (filters.status && status !== filters.status) return false;
    if (filters.hasQuota && hasQuota !== filters.hasQuota) return false;
    if (filters.hasHistory && hasHistory !== filters.hasHistory) return false;
    if (filters.year && year !== filters.year) return false;
    if (filters.month && month !== filters.month) return false;
    if (filters.abcClass && abcClass !== filters.abcClass) return false;
    if (filters.tolerance && tolerance !== filters.tolerance) return false;

    return true;
  });
}
