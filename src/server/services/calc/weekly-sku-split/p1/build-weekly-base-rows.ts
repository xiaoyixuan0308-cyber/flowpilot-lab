import type { WeeklyBaseRow, WeeklyMonthlySnapshotRow } from "../weekly-sku-split.types";

export function buildWeeklyBaseRows(rows: WeeklyMonthlySnapshotRow[]): WeeklyBaseRow[] {
  return rows.map((row) => ({ ...row }));
}
