import {
  add10,
  clampMinZero,
  divide10,
  indexByCompleteSum,
  multiply10,
  subtract10,
} from "../weekly-upn-split.helpers";
import type { WeeklyP4Row, WeeklyP5Row } from "../weekly-upn-split.types";

export function attachWeekTargetMetrics(rows: WeeklyP4Row[]): WeeklyP5Row[] {
  // CD 当前按“截至本周累计比例”理解，因此 J/JA/JB 也是累计到当前周的目标量，
  // 不是“单周新增目标量”。
  const targetByUpn = indexByCompleteSum(
    rows,
    (row) => row.upn,
    (row) => row.monthQuotaQty === null
      ? null
      : clampMinZero(
          subtract10(
            multiply10(row.monthQuotaQty, row.currentWeekPatternPct),
            row.lMonthDeliveredQty
          )
        )
  );
  const quotaByUpn = indexByCompleteSum(
    rows,
    (row) => row.upn,
    (row) => row.monthQuotaQty === null
      ? null
      : multiply10(row.monthQuotaQty, row.currentWeekPatternPct)
  );
  const deliveredByUpn = new Map<string, number>();
  const seenLpUpn = new Set<string>();

  for (const row of rows) {
    const lpUpnKey = `${row.lpCode}||${row.upn}`;
    if (seenLpUpn.has(lpUpnKey)) continue;
    seenLpUpn.add(lpUpnKey);
    deliveredByUpn.set(row.upn, add10(deliveredByUpn.get(row.upn) ?? 0, row.lMonthDeliveredQty));
  }

  return rows.map((row) => {
    const jWeekQuotaPatternQty = row.monthQuotaQty === null
      ? null
      : multiply10(row.monthQuotaQty, row.currentWeekPatternPct);
    const jaWeekTargetPendingQty = jWeekQuotaPatternQty === null
      ? null
      : clampMinZero(subtract10(jWeekQuotaPatternQty, row.lMonthDeliveredQty));
    const gWeekQuotaPatternTotalQty = quotaByUpn.get(row.upn) ?? null;

    return {
      ...row,
      gWeekQuotaPatternTotalQty,
      aaMonthDeliveredSuggestionPct:
        gWeekQuotaPatternTotalQty === null
          ? null
          : divide10(deliveredByUpn.get(row.upn) ?? 0, gWeekQuotaPatternTotalQty),
      jWeekQuotaPatternQty,
      jaWeekTargetPendingQty,
      jbWeekTargetPendingTotalQty: targetByUpn.get(row.upn) ?? null,
    };
  });
}
