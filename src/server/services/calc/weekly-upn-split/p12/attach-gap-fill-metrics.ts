import {
  add10,
  clampMinZero,
  compareDecimal,
  divideDown10,
  multiply10,
  subtract10,
} from "../weekly-upn-split.helpers";
import type { WeeklyP11Row, WeeklyP12Row } from "../weekly-upn-split.types";

function minQuantity(...values: number[]) {
  return values.reduce((minimum, value) =>
    compareDecimal(value, minimum) < 0 ? value : minimum
  );
}

function compareCandidates(left: WeeklyP11Row, right: WeeklyP11Row) {
  const diohComparison = compareDecimal(left.bkPostSuggestDioh!, right.bkPostSuggestDioh!);
  if (diohComparison !== 0) return diohComparison;
  for (const [leftValue, rightValue] of [
    [left.scBu, right.scBu],
    [left.lpCode, right.lpCode],
    [left.pl5Code, right.pl5Code],
    [left.upn, right.upn],
  ]) {
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
  }
  return 0;
}

export function attachGapFillMetrics(
  rows: WeeklyP11Row[],
  contextByBu: Map<string, {
    weekPatternGapAmount: number | null;
    weekPatternGapPct: number | null;
    shortfallThresholdPct: number;
  }>
): WeeklyP12Row[] {
  const gapFillQtyByRow = new Map<WeeklyP11Row, number>();
  const shouldFillByBu = new Map(
    [...contextByBu].map(([scBu, context]) => [
      scBu,
      context.weekPatternGapAmount !== null &&
        context.weekPatternGapPct !== null &&
        compareDecimal(context.weekPatternGapPct, context.shortfallThresholdPct) > 0,
    ]),
  );

  if ([...shouldFillByBu.values()].some(Boolean)) {
    const remainingGapByBu = new Map(
      [...contextByBu].map(([scBu, context]) => [scBu, context.weekPatternGapAmount ?? 0]),
    );
    const remainingBhByUpn = new Map<string, number>();
    const remainingBlByUpn = new Map<string, number>();

    const candidates = rows
      .filter(
        (row) =>
          shouldFillByBu.get(row.scBu) === true &&
          row.bdAdjustmentAllowedFlag === "Y" &&
          row.bkPostSuggestDioh !== null &&
          row.bhRemainingBscAvailableQty !== null &&
          compareDecimal(row.bhRemainingBscAvailableQty, 0) > 0 &&
          row.biTargetInventoryAdjustableQty !== null &&
          compareDecimal(row.biTargetInventoryAdjustableQty, 0) > 0 &&
          row.blMonthlyRemainingAdjustableQty !== null &&
          compareDecimal(row.blMonthlyRemainingAdjustableQty, 0) > 0 &&
          row.amUnitPrice !== null &&
          compareDecimal(row.amUnitPrice, 0) > 0
      )
      .sort(compareCandidates);

    for (const row of candidates) {
      let remainingGap = remainingGapByBu.get(row.scBu) ?? 0;
      if (compareDecimal(remainingGap, 0) <= 0) continue;

      const remainingBh = remainingBhByUpn.get(row.upn) ?? row.bhRemainingBscAvailableQty!;
      const remainingBl = remainingBlByUpn.get(row.upn) ?? row.blMonthlyRemainingAdjustableQty!;
      const amountLimitedQty = divideDown10(remainingGap, row.amUnitPrice!);
      const gapFillQty = clampMinZero(
        minQuantity(
          remainingBh,
          row.bhRemainingBscAvailableQty!,
          row.biTargetInventoryAdjustableQty!,
          remainingBl,
          row.blMonthlyRemainingAdjustableQty!,
          amountLimitedQty
        )
      );

      if (compareDecimal(gapFillQty, 0) <= 0) continue;

      gapFillQtyByRow.set(row, gapFillQty);
      remainingGap = clampMinZero(
        subtract10(remainingGap, multiply10(gapFillQty, row.amUnitPrice!))
      );
      remainingGapByBu.set(row.scBu, remainingGap);
      remainingBhByUpn.set(row.upn, clampMinZero(subtract10(remainingBh, gapFillQty)));
      remainingBlByUpn.set(row.upn, clampMinZero(subtract10(remainingBl, gapFillQty)));
    }
  }

  return rows.map((row) => {
    const context = contextByBu.get(row.scBu);
    if (!context) throw new Error(`缺少 SC_BU=${row.scBu} 的补差上下文`);
    const shouldFillGap = shouldFillByBu.get(row.scBu) === true;
    if (row.adOrSuggestQty === null) {
      return {
        ...row,
        raGapFillQty: null,
        rbPostGapFillQty: null,
      };
    }

    if (context.weekPatternGapAmount === null) {
      return {
        ...row,
        raGapFillQty: null,
        rbPostGapFillQty: null,
      };
    }

    if (
      row.bdAdjustmentAllowedFlag === "N" ||
      (row.t2Purchase3mAvgQty !== null && compareDecimal(row.t2Purchase3mAvgQty, 0) <= 0)
    ) {
      return {
        ...row,
        raGapFillQty: 0,
        rbPostGapFillQty: row.adOrSuggestQty,
      };
    }

    if (!shouldFillGap) {
      return {
        ...row,
        raGapFillQty: 0,
        rbPostGapFillQty: row.adOrSuggestQty,
      };
    }

    const hasUnknownGapFillInput =
      row.bdAdjustmentAllowedFlag === null ||
      row.bhRemainingBscAvailableQty === null ||
      row.biTargetInventoryAdjustableQty === null ||
      row.blMonthlyRemainingAdjustableQty === null ||
      row.amUnitPrice === null ||
      row.t2Purchase3mAvgQty === null ||
      row.currentInventoryQty === null;

    if (hasUnknownGapFillInput) {
      return {
        ...row,
        raGapFillQty: null,
        rbPostGapFillQty: null,
      };
    }

    const raGapFillQty = gapFillQtyByRow.get(row) ?? 0;
    return {
      ...row,
      raGapFillQty,
      rbPostGapFillQty: add10(row.adOrSuggestQty, raGapFillQty),
    };
  });
}
