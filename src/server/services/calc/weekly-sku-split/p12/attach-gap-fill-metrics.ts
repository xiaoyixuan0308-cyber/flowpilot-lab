import {
  add10,
  clampMinZero,
  compareDecimal,
  divideDown10,
  multiply10,
  subtract10,
} from "../weekly-sku-split.helpers";
import type { WeeklyP11Row, WeeklyP12Row } from "../weekly-sku-split.types";

function minQuantity(...values: number[]) {
  return values.reduce((minimum, value) =>
    compareDecimal(value, minimum) < 0 ? value : minimum
  );
}

function compareCandidates(left: WeeklyP11Row, right: WeeklyP11Row) {
  const diohComparison = compareDecimal(left.bkPostSuggestDioh!, right.bkPostSuggestDioh!);
  if (diohComparison !== 0) return diohComparison;
  for (const [leftValue, rightValue] of [
    [left.businessUnit, right.businessUnit],
    [left.channelCode, right.channelCode],
    [left.categoryCode, right.categoryCode],
    [left.sku, right.sku],
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
    [...contextByBu].map(([businessUnit, context]) => [
      businessUnit,
      context.weekPatternGapAmount !== null &&
        context.weekPatternGapPct !== null &&
        compareDecimal(context.weekPatternGapPct, context.shortfallThresholdPct) > 0,
    ]),
  );

  if ([...shouldFillByBu.values()].some(Boolean)) {
    const remainingGapByBu = new Map(
      [...contextByBu].map(([businessUnit, context]) => [businessUnit, context.weekPatternGapAmount ?? 0]),
    );
    const remainingBhBySku = new Map<string, number>();
    const remainingBlBySku = new Map<string, number>();

    const candidates = rows
      .filter(
        (row) =>
          shouldFillByBu.get(row.businessUnit) === true &&
          row.bdAdjustmentAllowedFlag === "Y" &&
          row.bkPostSuggestDioh !== null &&
          row.bhRemainingCentralWarehouseAvailableQty !== null &&
          compareDecimal(row.bhRemainingCentralWarehouseAvailableQty, 0) > 0 &&
          row.biTargetInventoryAdjustableQty !== null &&
          compareDecimal(row.biTargetInventoryAdjustableQty, 0) > 0 &&
          row.blMonthlyRemainingAdjustableQty !== null &&
          compareDecimal(row.blMonthlyRemainingAdjustableQty, 0) > 0 &&
          row.amUnitPrice !== null &&
          compareDecimal(row.amUnitPrice, 0) > 0
      )
      .sort(compareCandidates);

    for (const row of candidates) {
      let remainingGap = remainingGapByBu.get(row.businessUnit) ?? 0;
      if (compareDecimal(remainingGap, 0) <= 0) continue;

      const remainingBh = remainingBhBySku.get(row.sku) ?? row.bhRemainingCentralWarehouseAvailableQty!;
      const remainingBl = remainingBlBySku.get(row.sku) ?? row.blMonthlyRemainingAdjustableQty!;
      const amountLimitedQty = divideDown10(remainingGap, row.amUnitPrice!);
      const gapFillQty = clampMinZero(
        minQuantity(
          remainingBh,
          row.bhRemainingCentralWarehouseAvailableQty!,
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
      remainingGapByBu.set(row.businessUnit, remainingGap);
      remainingBhBySku.set(row.sku, clampMinZero(subtract10(remainingBh, gapFillQty)));
      remainingBlBySku.set(row.sku, clampMinZero(subtract10(remainingBl, gapFillQty)));
    }
  }

  return rows.map((row) => {
    const context = contextByBu.get(row.businessUnit);
    if (!context) throw new Error(`缺少 业务单元=${row.businessUnit} 的补差上下文`);
    const shouldFillGap = shouldFillByBu.get(row.businessUnit) === true;
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
      row.bhRemainingCentralWarehouseAvailableQty === null ||
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
