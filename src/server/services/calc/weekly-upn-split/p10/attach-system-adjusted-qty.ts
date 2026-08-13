import {
  compareDecimal,
  decimal10,
  multiplyDivide10,
  roundDecimalInteger,
} from "../weekly-upn-split.helpers";
import type {
  WeeklyGapSummary,
  WeeklyP8Row,
  WeeklyP10Row,
} from "../weekly-upn-split.types";

type SystemAdjustmentContext = Pick<
  WeeklyGapSummary,
  "targetPendingAmount" | "suggestedAmountTotal" | "weekPatternGapPct"
> & { overageThresholdPct: number };

export function calculateSystemAdjustedQty(
  adOrSuggestQty: number | null,
  context: SystemAdjustmentContext
) {
  if (
    adOrSuggestQty === null ||
    context.targetPendingAmount === null ||
    context.suggestedAmountTotal === null
  ) {
    return null;
  }

  if (
    compareDecimal(context.targetPendingAmount, 0) <= 0 ||
    compareDecimal(context.suggestedAmountTotal, 0) <= 0
  ) {
    return 0;
  }

  if (
    context.weekPatternGapPct !== null &&
    compareDecimal(context.weekPatternGapPct, -context.overageThresholdPct) < 0
  ) {
    return roundDecimalInteger(
      multiplyDivide10(
        context.targetPendingAmount,
        adOrSuggestQty,
        context.suggestedAmountTotal
      )
    );
  }

  return decimal10(adOrSuggestQty);
}

export function attachSystemAdjustedQty(
  rows: WeeklyP8Row[],
  contextByBu: Map<string, SystemAdjustmentContext>
): WeeklyP10Row[] {
  return rows.map((row) => {
    const context = contextByBu.get(row.scBu);
    if (!context) throw new Error(`缺少 SC_BU=${row.scBu} 的金额调整上下文`);
    return {
      ...row,
      saSystemAdjustedQty: calculateSystemAdjustedQty(row.adOrSuggestQty, context),
    };
  });
}
