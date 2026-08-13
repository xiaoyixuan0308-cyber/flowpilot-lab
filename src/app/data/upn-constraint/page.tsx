import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedUpnConstraintRows } from "@/server/repositories";

type Row = {
  id: string;
  period_month: string;
  sc_bu: string;
  upn: string;
  constraint_type: string;
  constraint_name: string;
  source_system: string;
};

const columns: Column<Row>[] = [
  { key: "period_month", header: "归属月份" },
  { key: "sc_bu", header: "业务单元" },
  { key: "upn", header: "SKU" },
  { key: "constraint_name", header: "约束类型" },
  { key: "source_system", header: "数据来源" },
];

function formatConstraintType(value: string) {
  if (value === "WEEK_CAP") return "周不能超";
  if (value === "MONTH_CAP") return "月不能超";
  return value;
}

export default async function UpnConstraintPage() {
  const rows = await listLoadedUpnConstraintRows();
  const data: Row[] = rows.map((row) => ({
    ...row,
    constraint_name: formatConstraintType(row.constraint_type),
  }));
  const periodOptions = Array.from(new Set(data.map((row) => row.period_month)))
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));
  const typeOptions = Array.from(new Set(data.map((row) => row.constraint_name)))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));
  const scBuOptions = Array.from(new Set(data.map((row) => row.sc_bu)))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));

  return (
    <DataPageLayout
      title="SKU周月约束规则"
      description="按 业务单元 和 SKU 维护指定月份的周不能超、月不能超规则；同一组合可同时存在两种规则。"
      actions={<BaseTableActions table="upnConstraint" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "业务单元数", value: scBuOptions.length },
        { label: "SKU数", value: new Set(data.map((row) => row.upn)).size },
        { label: "月份数", value: periodOptions.length },
      ]}
      statsColumns={4}
      table={{
        title: "SKU周月约束明细",
        columns,
        data,
        searchKey: "upn",
        searchPlaceholder: "搜索SKU...",
        filters: [
          { key: "period_month", label: "月份", placeholder: "全部月份", options: periodOptions },
          { key: "sc_bu", label: "业务单元", placeholder: "全部业务单元", options: scBuOptions },
          { key: "constraint_name", label: "约束类型", placeholder: "全部类型", options: typeOptions },
        ],
        exportTable: "ods_upn_constraint_manual",
        exportParams: {},
      }}
    />
  );
}
