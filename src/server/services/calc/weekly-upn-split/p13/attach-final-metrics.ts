import {
  compareDecimal,
  floorToMultiple10,
  multiply10,
  subtract10,
  sumCompleteNumbers,
} from "../weekly-upn-split.helpers";
import type { WeeklyBundleRule, WeeklyP12Row, WeeklyP13Row } from "../weekly-upn-split.types";

export function attachFinalMetrics(
  rows: WeeklyP12Row[],
  bundleRules: WeeklyBundleRule[],
  contextByBu: Map<string, {
    weekPatternGapAmount: number | null;
    targetPendingAmount: number | null;
  }>,
) {
  const bundleQtyByUpn = new Map(bundleRules.map((rule) => [rule.upn, rule.bundleQty]));
  const finalRows: WeeklyP13Row[] = rows.map((row) => {
    const context = contextByBu.get(row.scBu);
    if (!context) throw new Error(`缺少 SC_BU=${row.scBu} 的最终金额上下文`);
    const bundleQty = bundleQtyByUpn.get(row.upn) ?? 1;
    const defaultFinalQty = context.weekPatternGapAmount === null
      ? null
      : compareDecimal(context.weekPatternGapAmount, 0) > 0
          ? row.rbPostGapFillQty
          : row.saSystemAdjustedQty;
    const rraFinalQty = defaultFinalQty === null
      ? null
      : floorToMultiple10(defaultFinalQty, bundleQty);
    return {
      ...row,
      bundleQty,
      systemDefaultFinalQty: rraFinalQty,
      manualFinalQty: null,
      rraFinalQty,
      rrbFinalAmount: rraFinalQty === null || row.amUnitPrice === null
        ? null
        : multiply10(rraFinalQty, row.amUnitPrice),
    };
  });

  const businessUnits = [...contextByBu.keys()];
  const buFinalSummaries = businessUnits.map((scBu) => {
    const context = contextByBu.get(scBu)!;
    const finalAmountTotal = sumCompleteNumbers(
      finalRows.filter((row) => row.scBu === scBu).map((row) => row.rrbFinalAmount),
    );
    const finalPatternGapAmount = context.targetPendingAmount === null || finalAmountTotal === null
      ? null
      : subtract10(context.targetPendingAmount, finalAmountTotal);
    return {
      scBu,
      systemDefaultFinalAmountTotal: finalAmountTotal,
      systemDefaultPatternGapAmount: finalPatternGapAmount,
      finalAmountTotal,
      finalPatternGapAmount,
    };
  });

  return { rows: finalRows, buFinalSummaries };
}
