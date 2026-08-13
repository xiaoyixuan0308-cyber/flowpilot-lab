import { multiply10, normalizeRatio, subtract10 } from "../weekly-upn-split.helpers";
import type { WeeklyAmountRow, WeeklyAmountSummary, WeeklyCalendarRow } from "../weekly-upn-split.types";

export function buildAmountTargetSummary(
  calendar: WeeklyCalendarRow,
  amountRow: WeeklyAmountRow | null
): WeeklyAmountSummary {
  // currentWeekPatternPct 当前按“截至本周累计比例”使用。
  // actualAmount 当前也按“截至当前周累计 actual”理解，因此 CB / CR 都是累计金额口径。
  // CA / CE 直接来自本周当前 SC_BU 的唯一输入记录，不按 UPN 聚合。
  const currentWeekPatternPct = normalizeRatio(calendar.currentWeekPatternPct ?? 0);

  if (
    amountRow &&
    amountRow.periodMonth.toISOString().slice(0, 10) !== calendar.periodMonth.toISOString().slice(0, 10)
  ) {
    throw new Error(
      `BU 周金额目标归属月份与 Calendar 不一致：period_week=${amountRow.periodWeek.toISOString().slice(0, 10)}，BU period_month=${amountRow.periodMonth.toISOString().slice(0, 10)}，Calendar period_month=${calendar.periodMonth.toISOString().slice(0, 10)}`
    );
  }

  const actualAmount = amountRow?.actualAmount ?? null;
  const monthLeAmount = amountRow?.monthTargetAmount ?? null;
  const weekPatternAmount = monthLeAmount === null
    ? null
    : multiply10(monthLeAmount, currentWeekPatternPct);
  const targetPendingAmount = weekPatternAmount === null || actualAmount === null
    ? null
    : subtract10(weekPatternAmount, actualAmount);

  return {
    currentWeekPatternPct,
    monthLeAmount,
    actualAmount,
    weekPatternAmount,
    targetPendingAmount,
  };
}
