import { normalizeRatio } from "../weekly-upn-split.helpers";
import type { WeeklyBaseRow, WeeklyCalendarRow, WeeklyP2Row } from "../weekly-upn-split.types";

export function attachCalendarContext(rows: WeeklyBaseRow[], calendars: WeeklyCalendarRow[]): WeeklyP2Row[] {
  const calendarByBu = new Map(calendars.map((calendar) => [calendar.scBu, calendar]));

  return rows.map((row) => {
    const calendar = calendarByBu.get(row.scBu);
    if (!calendar) throw new Error(`未找到 SC_BU=${row.scBu} 的周配比记录`);
    return {
      ...row,
      prevWeekPatternPct: calendar.prevWeekPatternPct === null
        ? null
        : normalizeRatio(calendar.prevWeekPatternPct),
      currentWeekPatternPct: normalizeRatio(calendar.currentWeekPatternPct ?? 0),
    };
  });
}
