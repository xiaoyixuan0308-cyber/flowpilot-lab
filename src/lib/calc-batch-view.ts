export interface CalcBatchSummaryLike {
  id: string;
  period_month: Date;
  status: string;
  total_upns: number;
  error_upns: number;
  calculated_at: Date | null;
  created_at?: Date | null;
}

export type CalcBatchTableRow = Record<string, unknown> & {
  id: string;
  baseline_month: string;
  detail_href: string;
  trace_href: string;
  period_month: string;
  status: string;
  total_upns: string;
  error_upns: string;
  calculated_at: string;
};

export interface CalcBatchOverview {
  periods: string[];
  totalBatches: number;
  successBatches: number;
  partialBatches: number;
  totalBaselines: number;
  successBaselines: number;
  partialBaselines: number;
  latestPeriod: string | null;
  latestPeriodRows: number;
  latestBatch: CalcBatchTableRow | null;
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

export function buildCalcBatchTableRows(
  baselines: CalcBatchSummaryLike[],
): CalcBatchTableRow[] {
  return baselines.map((baseline) => {
    const baselineMonth = formatDateUtc8(baseline.period_month);

    return {
      id: baseline.id,
      baseline_month: baselineMonth,
      detail_href: `/calc/results/${baselineMonth}`,
      trace_href: `/calc/trace/${baselineMonth}`,
      period_month: baselineMonth,
      status: baseline.status,
      total_upns: String(baseline.total_upns),
      error_upns: String(baseline.error_upns),
      calculated_at: formatDateTimeUtc8(baseline.calculated_at),
    };
  });
}

export function summarizeCalcBatchRows(
  rows: CalcBatchTableRow[],
): CalcBatchOverview {
  const periods = Array.from(new Set(rows.map((row) => row.period_month))).sort(
    (a, b) => b.localeCompare(a),
  );
  const latestPeriod = periods[0] ?? null;

  return {
    periods,
    totalBatches: rows.length,
    successBatches: rows.filter((row) => row.status === "SUCCESS").length,
    partialBatches: rows.filter((row) => row.status === "PARTIAL").length,
    totalBaselines: rows.length,
    successBaselines: rows.filter((row) => row.status === "SUCCESS").length,
    partialBaselines: rows.filter((row) => row.status === "PARTIAL").length,
    latestPeriod,
    latestPeriodRows: latestPeriod
      ? rows.filter((row) => row.period_month === latestPeriod).length
      : 0,
    latestBatch: rows[0] ?? null,
  };
}
