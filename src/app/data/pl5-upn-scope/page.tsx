import type { Column } from "@/components/data-table";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedPl5UpnScopeRows } from "@/server/repositories";

type Row = {
  period_month: string;
  sc_bu: string;
  pl5_code: string;
  pl5_name: string | null;
  upn: string;
  upn_source: string;
};

const columns: Column<Row>[] = [
  { key: "period_month", header: "月份" },
  { key: "sc_bu", header: "业务单元" },
  { key: "pl5_code", header: "产品分类编码" },
  { key: "pl5_name", header: "产品分类名称" },
  { key: "upn", header: "SKU" },
  { key: "upn_source", header: "范围来源", className: "max-w-[26rem] whitespace-normal break-words leading-5 text-sm" },
];

export default async function Pl5UpnScopePage() {
  const rows = await listLoadedPl5UpnScopeRows();
  const data: Row[] = rows.map((row) => ({
    period_month: row.period_month.toISOString().slice(0, 10),
    sc_bu: row.sc_bu,
    pl5_code: row.pl5_code,
    pl5_name: row.pl5_name,
    upn: row.upn,
    upn_source: row.upn_source,
  }));

  const periodOptions = Array.from(new Set(data.map((row) => row.period_month)))
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));

  return (
    <DataPageLayout
      title="产品分类-SKU范围表"
      description="过程数据表。展示当前月下每个 产品分类 可以展开到哪些 SKU，以及这些 SKU 是由哪些基础输入观察到的。"
      statsItems={[
        { label: "当前记录数", value: data.length },
        { label: "月份数", value: periodOptions.length },
      ]}
      statsColumns={2}
      table={{
        title: "产品分类-SKU范围表",
        columns,
        data,
        searchKey: "upn",
        searchPlaceholder: "搜索SKU...",
        filters: [
          { key: "period_month", label: "月份", placeholder: "全部月份", sort: "desc" },
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
