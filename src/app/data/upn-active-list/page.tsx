import type { Column } from "@/components/data-table";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedActiveUpnRows } from "@/server/repositories";

type Row = {
  id: string;
  dealerlpcode: string | null;
  dealerlpname: string | null;
  pl5_code: string;
  pl5_name: string | null;
  upn: string;
  year: string;
  month: string;
};

const columns: Column<Row>[] = [
  { key: "dealerlpcode", header: "LP编码" },
  { key: "dealerlpname", header: "LP名称" },
  { key: "pl5_code", header: "产品分类编码" },
  { key: "pl5_name", header: "产品分类名称" },
  { key: "upn", header: "SKU" },
  { key: "year", header: "年" },
  { key: "month", header: "月" },
];

export default async function UpnActiveListPage() {
  const rows = await listLoadedActiveUpnRows();
  const data: Row[] = rows.map((r) => ({
    id: r.id,
    dealerlpcode: r.dealerlpcode,
    dealerlpname: r.dealerlpname,
    pl5_code: r.pl5_code,
    pl5_name: r.pl5_name,
    upn: r.upn,
    year: r.year,
    month: r.month,
  }));

  const yearOptions = Array.from(new Set(data.map((row) => row.year)))
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));
  const monthOptions = Array.from(new Set(data.map((row) => row.month)))
    .sort((a, b) => Number(b) - Number(a))
    .map((value) => ({ label: value, value }));
  const latestYear = yearOptions[0]?.value;
  const latestMonth = monthOptions[0]?.value;
  const latestRows =
    latestYear && latestMonth
      ? data.filter((row) => row.year === latestYear && row.month === latestMonth)
      : [];
  const latestLpCount = Array.from(
    new Set(latestRows.map((row) => row.dealerlpcode ?? ""))
  ).filter(Boolean).length;
  const latestPl5Count = Array.from(new Set(latestRows.map((row) => row.pl5_code))).length;

  return (
    <DataPageLayout
      title="SKU范围关系表"
      description="过程范围表。当前根据 T2 采购中的 year/month + LP + 产品分类 + SKU 关系实时派生，不再视为人工维护的基础输入表。"
      statsItems={[
        { label: "最近年份", value: latestYear ?? "-" },
        { label: "最近月份", value: latestMonth ?? "-" },
        { label: "最近窗口LP数", value: latestLpCount },
        { label: "最近窗口产品分类数", value: latestPl5Count },
      ]}
      table={{
        title: "SKU范围关系表",
        columns,
        data,
        searchKey: "upn",
        searchPlaceholder: "搜索SKU...",
        filters: [
          {
            key: "dealerlpcode",
            label: "经销商",
            placeholder: "全部经销商",
            optionLabelKey: "dealerlpname",
          },
          {
            key: "pl5_code",
            label: "产品分类",
            placeholder: "全部产品分类",
            optionLabelKey: "pl5_name",
          },
          { key: "year", label: "年", placeholder: "全部年份", options: yearOptions },
          { key: "month", label: "月", placeholder: "全部月份", options: monthOptions },
        ],
        exportTable: "ods_upn_active_list",
      }}
    />
  );
}
