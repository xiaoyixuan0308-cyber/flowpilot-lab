import { compareDecimal, divide10, subtract10, sumCompleteNumbers } from "../weekly-sku-split.helpers";
import type { WeeklyAmountSummary, WeeklyGapSummary, WeeklyP8Row } from "../weekly-sku-split.types";

export function buildWeekPatternGapSummary(
  rows: WeeklyP8Row[],
  amountSummary: WeeklyAmountSummary
): WeeklyGapSummary {
  const suggestedAmountTotal = sumCompleteNumbers(rows.map((row) => row.aoOrSuggestAmount));
  const weekPatternGapAmount =
    amountSummary.targetPendingAmount === null || suggestedAmountTotal === null
      ? null
      : subtract10(amountSummary.targetPendingAmount, suggestedAmountTotal);

  return {
    ...amountSummary,
    suggestedAmountTotal,
    weekPatternGapAmount,
    weekPatternGapPct:
      amountSummary.monthLeAmount === null || weekPatternGapAmount === null ||
      compareDecimal(amountSummary.monthLeAmount, 0) === 0
        ? null
        : divide10(weekPatternGapAmount, amountSummary.monthLeAmount),
  };
}
