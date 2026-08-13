import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedCalendarPatternWeeklyRows } from "@/server/repositories";

type Row = {
  sc_bu: string;
  period_month: string;
  month_start_date: string;
  week_start_date: string;
  week_end_date: string;
  prev_week_pattern_pct: string;
  current_week_pattern_pct: string;
};

const columns: Column<Row>[] = [
  { key: "sc_bu", header: "业务单元" },
  { key: "period_month", header: "归属月份" },
  { key: "month_start_date", header: "业务月开始日" },
  { key: "week_start_date", header: "周开始日" },
  { key: "week_end_date", header: "周结束日" },
  { key: "prev_week_pattern_pct", header: "上周累计配比" },
  { key: "current_week_pattern_pct", header: "截至本周累计配比" },
];

export default async function CalendarPatternWeeklyPage() {
  const rows = await listLoadedCalendarPatternWeeklyRows();
  const data: Row[] = rows.map((row) => ({
    sc_bu: row.sc_bu,
    period_month: row.period_month,
    month_start_date: row.month_start_date,
    week_start_date: row.week_start_date,
    week_end_date: row.week_end_date,
    prev_week_pattern_pct: row.prev_week_pattern_pct ?? "",
    current_week_pattern_pct: row.current_week_pattern_pct ?? "",
  }));

  const periodMonthOptions = Array.from(new Set(data.map((row) => row.period_month)))
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));

  return (
    <DataPageLayout
      title="周历与周配比"
      description="周拆分第一阶段输入表。维护业务月、业务周和截至本周累计配比。"
      actions={<BaseTableActions table="calendarPatternWeekly" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "月份数", value: periodMonthOptions.length },
      ]}
      table={{
        title: "周历与周配比明细",
        columns,
        data,
        searchKey: "sc_bu",
        searchPlaceholder: "搜索业务单元...",
        filters: [{ key: "period_month", label: "月份", placeholder: "全部月份", sort: "desc" }],
        exportTable: "ods_calendar_pattern_weekly",
        exportParams: {},
      }}
    />
  );
}
