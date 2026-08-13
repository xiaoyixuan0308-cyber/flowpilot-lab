import type { ExportRequest } from "./export.types";

export function buildYearMonthWhere(filters?: ExportRequest) {
  return {
    ...(filters?.year ? { year: filters.year } : {}),
    ...(filters?.month ? { month: filters.month } : {}),
  };
}

export function buildPeriodMonthWhere(periodMonth?: string | null) {
  return periodMonth
    ? { period_month: new Date(`${periodMonth}T08:00:00+08:00`) }
    : {};
}

export function buildQuotaHistoryWhere(filters?: ExportRequest) {
  return {
    ...(filters?.hasQuota ? { has_quota: filters.hasQuota === "Y" } : {}),
    ...(filters?.hasHistory ? { has_history: filters.hasHistory === "Y" } : {}),
  };
}

export function buildStatusWhere(filters?: ExportRequest) {
  return {
    ...buildPeriodMonthWhere(filters?.periodMonth),
    ...(filters?.status ? { status: filters.status } : {}),
  };
}

export function buildAbcToleranceWhere(filters?: ExportRequest) {
  return {
    ...(filters?.abcClass ? { abc_class: filters.abcClass } : {}),
    ...(!filters?.abcClass && filters?.tolerance
      ? filters.tolerance === "是"
        ? { abc_class: "A" }
        : { NOT: { abc_class: "A" } }
      : {}),
  };
}
