import {
  add10,
  clampMinZero,
  divide10,
  indexByCompleteSum,
  multiply10,
  subtract10,
} from "../weekly-sku-split.helpers";
import type { WeeklyP4Row, WeeklyP5Row } from "../weekly-sku-split.types";

export function attachWeekTargetMetrics(rows: WeeklyP4Row[]): WeeklyP5Row[] {
  // CD 当前按“截至本周累计比例”理解，因此 J/JA/JB 也是累计到当前周的目标量，
  // 不是“单周新增目标量”。
  const targetBySku = indexByCompleteSum(
    rows,
    (row) => row.sku,
    (row) => row.monthQuotaQty === null
      ? null
      : clampMinZero(
          subtract10(
            multiply10(row.monthQuotaQty, row.currentWeekPatternPct),
            row.lMonthDeliveredQty
          )
        )
  );
  const quotaBySku = indexByCompleteSum(
    rows,
    (row) => row.sku,
    (row) => row.monthQuotaQty === null
      ? null
      : multiply10(row.monthQuotaQty, row.currentWeekPatternPct)
  );
  const deliveredBySku = new Map<string, number>();
  const seenChannelSku = new Set<string>();

  for (const row of rows) {
    const channelSkuKey = `${row.channelCode}||${row.sku}`;
    if (seenChannelSku.has(channelSkuKey)) continue;
    seenChannelSku.add(channelSkuKey);
    deliveredBySku.set(row.sku, add10(deliveredBySku.get(row.sku) ?? 0, row.lMonthDeliveredQty));
  }

  return rows.map((row) => {
    const jWeekQuotaPatternQty = row.monthQuotaQty === null
      ? null
      : multiply10(row.monthQuotaQty, row.currentWeekPatternPct);
    const jaWeekTargetPendingQty = jWeekQuotaPatternQty === null
      ? null
      : clampMinZero(subtract10(jWeekQuotaPatternQty, row.lMonthDeliveredQty));
    const gWeekQuotaPatternTotalQty = quotaBySku.get(row.sku) ?? null;

    return {
      ...row,
      gWeekQuotaPatternTotalQty,
      aaMonthDeliveredSuggestionPct:
        gWeekQuotaPatternTotalQty === null
          ? null
          : divide10(deliveredBySku.get(row.sku) ?? 0, gWeekQuotaPatternTotalQty),
      jWeekQuotaPatternQty,
      jaWeekTargetPendingQty,
      jbWeekTargetPendingTotalQty: targetBySku.get(row.sku) ?? null,
    };
  });
}
