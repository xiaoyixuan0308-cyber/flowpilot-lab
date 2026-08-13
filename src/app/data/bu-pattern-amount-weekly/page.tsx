import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedBuPatternAmountWeeklyRows } from "@/server/repositories";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  period_week: string;
  period_month: string;
  sc_bu: string;
  actual_amount: string;
  month_target_amount: string;
  month_limit_amount: string;
  source_actual_amount: string;
  source_month_target_amount: string;
  source_month_limit_amount: string;
  source_currency: string;
  usd_to_cny_rate: string;
};

const columns: Column<Row>[] = [
  { key: "period_week", header: "周开始日" },
  { key: "period_month", header: "归属月份" },
  { key: "sc_bu", header: "业务单元" },
  { key: "source_actual_amount", header: "原始CA累计实际金额" },
  { key: "source_month_target_amount", header: "原始CE月目标金额" },
  { key: "source_month_limit_amount", header: "原始月预算上限" },
  { key: "source_currency", header: "输入币种" },
  { key: "usd_to_cny_rate", header: "导入汇率(1 USD=CNY)" },
  { key: "actual_amount", header: "CA累计实际金额(USD)" },
  { key: "month_target_amount", header: "CE月目标金额(USD)" },
  { key: "month_limit_amount", header: "月预算上限(USD)" },
];

export default async function BuPatternAmountWeeklyPage() {
  const rows = await listLoadedBuPatternAmountWeeklyRows();
  const data: Row[] = rows.map((row) => ({
    id: row.id,
    period_week: row.period_week,
    period_month: row.period_month,
    sc_bu: row.sc_bu,
    actual_amount: row.actual_amount ?? "",
    month_target_amount: row.month_target_amount,
    month_limit_amount: row.month_limit_amount,
    source_actual_amount: row.source_actual_amount ?? "",
    source_month_target_amount: row.source_month_target_amount,
    source_month_limit_amount: row.source_month_limit_amount,
    source_currency: row.source_currency,
    usd_to_cny_rate: row.usd_to_cny_rate,
  }));

  const periodWeekOptions = Array.from(new Set(data.map((row) => row.period_week)))
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));

  return (
    <DataPageLayout
      title="业务单元 周/月预算"
      description="每周每个 业务单元 一条，CA 可空、CE 和月预算上限必填；CA 有值时不能超过 CE，CE 不能超过月预算上限。"
      actions={<BaseTableActions table="buPatternAmountWeekly" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "周窗口数", value: periodWeekOptions.length },
      ]}
      table={{
        title: "业务单元 周/月预算输入",
        columns,
        data,
        filters: [{ key: "period_week", label: "周开始日", placeholder: "全部周", sort: "desc" }],
        searchKey: "sc_bu",
        searchPlaceholder: "搜索 业务单元",
        exportTable: "ods_bu_pattern_amount_weekly",
        exportParams: {},
      }}
    />
  );
}
