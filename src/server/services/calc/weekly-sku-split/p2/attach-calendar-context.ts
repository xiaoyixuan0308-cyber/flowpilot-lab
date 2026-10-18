import { normalizeRatio } from "../weekly-sku-split.helpers";
import type { WeeklyBaseRow, WeeklyCalendarRow, WeeklyP2Row } from "../weekly-sku-split.types";

export function attachCalendarContext(rows: WeeklyBaseRow[], calendars: WeeklyCalendarRow[]): WeeklyP2Row[] {
  const calendarByBu = new Map(calendars.map((calendar) => [calendar.businessUnit, calendar]));

  return rows.map((row) => {
    const calendar = calendarByBu.get(row.businessUnit);
    if (!calendar) throw new Error(`未找到 业务单元=${row.businessUnit} 的周配比记录`);
    return {
      ...row,
      prevWeekPatternPct: calendar.prevWeekPatternPct === null
        ? null
        : normalizeRatio(calendar.prevWeekPatternPct),
      currentWeekPatternPct: normalizeRatio(calendar.currentWeekPatternPct ?? 0),
    };
  });
}
