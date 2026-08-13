import {
  add10,
  clampMinZero,
  compareDecimal,
  indexByCompleteSum,
  multiplyDivide10,
  subtract10,
} from "../weekly-upn-split.helpers";
import type { WeeklyP6Row, WeeklyP7Row } from "../weekly-upn-split.types";

export function attachAdjustmentCapMetrics(rows: WeeklyP6Row[]): WeeklyP7Row[] {
  const suggestedQtyByUpn = indexByCompleteSum(
    rows,
    (row) => row.upn,
    (row) => row.adOrSuggestQty
  );

  return rows.map((row) => {
    const suggestedQtyTotal = suggestedQtyByUpn.get(row.upn) ?? null;
    const bhRemainingBscAvailableQty =
      row.yBscAvailableQty === null || suggestedQtyTotal === null
        ? null
        : clampMinZero(
            subtract10(
              subtract10(row.yBscAvailableQty, row.rOtherDealerOpenOrderOrQty),
              suggestedQtyTotal
            )
          );
    const biTargetInventoryAdjustableQty =
      row.originalTargetInventoryQty === null ||
      row.currentInventoryQty === null ||
      row.adOrSuggestQty === null
        ? null
        : clampMinZero(
            subtract10(
              subtract10(row.originalTargetInventoryQty, row.currentInventoryQty),
              row.adOrSuggestQty
            )
          );
    const bkPostSuggestDioh =
      row.t2Purchase3mAvgQty !== null &&
      row.adOrSuggestQty !== null &&
      row.currentInventoryQty !== null &&
      compareDecimal(row.t2Purchase3mAvgQty, 0) > 0
        ? multiplyDivide10(
            add10(row.adOrSuggestQty, row.currentInventoryQty),
            30,
            row.t2Purchase3mAvgQty
          )
        : null;

    return {
      ...row,
      bhRemainingBscAvailableQty,
      biTargetInventoryAdjustableQty,
      bkPostSuggestDioh,
    };
  });
}
