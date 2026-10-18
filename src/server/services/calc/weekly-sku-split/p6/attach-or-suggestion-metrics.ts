import {
  add10,
  compareDecimal,
  multiplyDivide10,
  subtract10,
} from "../weekly-sku-split.helpers";
import type { WeeklyP5Row, WeeklyP6Row } from "../weekly-sku-split.types";

export function attachOrSuggestionMetrics(rows: WeeklyP5Row[]): WeeklyP6Row[] {
  return rows.map((row) => {
    if (
      row.yCentralWarehouseAvailableQty === null ||
      row.jaWeekTargetPendingQty === null ||
      row.jbWeekTargetPendingTotalQty === null
    ) {
      return {
        ...row,
        zInventoryStatus: null,
        adOrSuggestQty: null,
      };
    }

    // R 当前按“其他 渠道 对同一 SKU 的 OR 压力”处理，先占用共享可发库存 Y，
    // 再把剩余库存按当前 SKU 各 渠道 的 JA / JB 比例分给当前行。
    const remainingAfterOtherDealer = subtract10(
      row.yCentralWarehouseAvailableQty,
      row.rOtherDealerOpenOrderOrQty
    );
    const zInventoryStatus =
      compareDecimal(
        subtract10(
          add10(row.jbWeekTargetPendingTotalQty, row.rOtherDealerOpenOrderOrQty),
          row.yCentralWarehouseAvailableQty
        ),
        0
      ) > 0
        ? "STOP"
        : "OK";

    let adOrSuggestQty = row.jaWeekTargetPendingQty;
    if (zInventoryStatus === "STOP") {
      if (
        compareDecimal(remainingAfterOtherDealer, 0) <= 0 ||
        compareDecimal(row.jbWeekTargetPendingTotalQty, 0) <= 0
      ) {
        adOrSuggestQty = 0;
      } else {
        adOrSuggestQty = multiplyDivide10(
          row.jaWeekTargetPendingQty,
          remainingAfterOtherDealer,
          row.jbWeekTargetPendingTotalQty
        );
      }
    }

    return {
      ...row,
      zInventoryStatus,
      adOrSuggestQty,
    };
  });
}
