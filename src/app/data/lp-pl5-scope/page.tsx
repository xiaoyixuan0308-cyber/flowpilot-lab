import type { Column } from "@/components/data-table";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedLpPl5ScopeRows } from "@/server/repositories";

type Row = {
  period_month: string;
  sc_bu: string;
  lp_code: string;
  lp_name: string | null;
  pl5_code: string;
  pl5_name: string | null;
  scope_source: string;
};

const columns: Column<Row>[] = [
  { key: "period_month", header: "月份" },
  { key: "sc_bu", header: "业务单元" },
  { key: "lp_code", header: "LP编码" },
  { key: "lp_name", header: "LP名称" },
  { key: "pl5_code", header: "产品分类编码" },
  { key: "pl5_name", header: "产品分类名称" },
  { key: "scope_source", header: "范围来源", className: "max-w-[26rem] whitespace-normal break-words leading-5 text-sm" },
];

export default async function LpPl5ScopePage() {
  const rows = await listLoadedLpPl5ScopeRows();
  const data: Row[] = rows.map((row) => ({
    period_month: row.period_month.toISOString().slice(0, 10),
    sc_bu: row.sc_bu,
    lp_code: row.lp_code,
    lp_name: row.lp_name,
    pl5_code: row.pl5_code,
    pl5_name: row.pl5_name,
    scope_source: row.scope_source,
  }));

  const periodOptions = Array.from(new Set(data.map((row) => row.period_month)))
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));

  return (
    <DataPageLayout
      title="LP-产品分类范围表"
      description="过程数据表。展示当前月下 LP × 产品分类 组合是由哪些基础输入共同补齐出来的。"
      statsItems={[
        { label: "当前记录数", value: data.length },
        { label: "月份数", value: periodOptions.length },
      ]}
      statsColumns={2}
      table={{
        title: "LP-产品分类范围表",
        columns,
        data,
        searchKey: "pl5_code",
        searchPlaceholder: "搜索产品分类...",
        filters: [
          { key: "period_month", label: "月份", placeholder: "全部月份", sort: "desc" },
          {
            key: "lp_code",
            label: "经销商",
            placeholder: "全部经销商",
            optionLabelKey: "lp_name",
          },
          {
            key: "pl5_code",
            label: "产品分类",
            placeholder: "全部产品分类",
            optionLabelKey: "pl5_name",
          },
        ],
      }}
    />
  );
}
