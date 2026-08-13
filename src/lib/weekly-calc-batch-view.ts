export interface WeeklyCalcBatchSummaryLike {
  id: string;
  period_month: Date;
  calendar_date: Date;
  status: string;
  total_rows: number;
  total_upns: number;
  month_le_amount?: unknown;
  week_pattern_gap_pct?: unknown;
  overage_threshold_pct?: unknown;
  shortfall_threshold_pct?: unknown;
  calculation_currency?: string;
  usd_to_cny_rate?: unknown;
  calculated_at: Date | null;
  created_at?: Date | null;
}

export type WeeklyCalcBatchTableRow = Record<string, unknown> & {
  baseline_date: string;
  detail_href: string;
  period_month: string;
  calendar_date: string;
  status: string;
  total_rows: string;
  total_upns: string;
  month_le_amount: string;
  week_pattern_gap_pct: string;
  overage_threshold_pct: string;
  shortfall_threshold_pct: string;
  calculation_currency: string;
  usd_to_cny_rate: string;
  calculated_at: string;
};

export interface WeeklyCalcBatchOverview {
  periods: string[];
  totalBaselines: number;
  successBaselines: number;
  latestPeriod: string | null;
  latestPeriodRows: number;
  latestBatch: WeeklyCalcBatchTableRow | null;
}

const UTC_PLUS_8_OFFSET_MS = 8 * 60 * 60 * 1000;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toUtcPlus8Parts(date: Date) {
  const shifted = new Date(date.getTime() + UTC_PLUS_8_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

function formatDateUtc8(date: Date | null | undefined) {
  if (!date) return "";
  const parts = toUtcPlus8Parts(date);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function formatDateTimeUtc8(date: Date | null | undefined) {
  if (!date) return "";
  const parts = toUtcPlus8Parts(date);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)} ${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
}

function formatMetric(value: unknown) {
  if (value === null || value === undefined) return "";
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return String(value);
  return numberValue.toFixed(6).replace(/\.?0+$/, "");
}

export function buildWeeklyCalcBatchTableRows(
  baselines: WeeklyCalcBatchSummaryLike[],
): WeeklyCalcBatchTableRow[] {
  return baselines.map((baseline) => {
    const baselineDate = formatDateUtc8(baseline.calendar_date);

    return {
      baseline_date: baselineDate,
      detail_href: `/calc/weekly-results/${baselineDate}`,
      period_month: formatDateUtc8(baseline.period_month),
      calendar_date: baselineDate,
      status: baseline.status,
      total_rows: String(baseline.total_rows),
      total_upns: String(baseline.total_upns),
      month_le_amount: formatMetric(baseline.month_le_amount),
      week_pattern_gap_pct: formatMetric(baseline.week_pattern_gap_pct),
      overage_threshold_pct: formatMetric(baseline.overage_threshold_pct),
      shortfall_threshold_pct: formatMetric(baseline.shortfall_threshold_pct),
      calculation_currency: baseline.calculation_currency ?? "USD",
      usd_to_cny_rate: formatMetric(baseline.usd_to_cny_rate),
      calculated_at: formatDateTimeUtc8(baseline.calculated_at),
    };
  });
}

export function summarizeWeeklyCalcBatchRows(
  rows: WeeklyCalcBatchTableRow[],
): WeeklyCalcBatchOverview {
  const periods = Array.from(new Set(rows.map((row) => row.period_month))).sort((a, b) => b.localeCompare(a));
  const latestPeriod = periods[0] ?? null;

  return {
    periods,
    totalBaselines: rows.length,
    successBaselines: rows.filter((row) => row.status === "SUCCESS").length,
    latestPeriod,
    latestPeriodRows: latestPeriod ? rows.filter((row) => row.period_month === latestPeriod).length : 0,
    latestBatch: rows[0] ?? null,
  };
}
