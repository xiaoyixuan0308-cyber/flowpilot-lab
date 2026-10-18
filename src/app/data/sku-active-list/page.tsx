import type { Column } from "@/components/data-table";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedActiveSkuRows } from "@/server/repositories";

type Row = {
  id: string;
  dealer_channel_code: string | null;
  dealer_channel_name: string | null;
  category_code: string;
  category_name: string | null;
  sku: string;
  year: string;
  month: string;
};

const columns: Column<Row>[] = [
  { key: "dealer_channel_code", header: "渠道编码" },
  { key: "dealer_channel_name", header: "渠道名称" },
  { key: "category_code", header: "产品分类编码" },
  { key: "category_name", header: "产品分类名称" },
  { key: "sku", header: "SKU" },
  { key: "year", header: "年" },
  { key: "month", header: "月" },
];

export default async function SkuActiveListPage() {
  const rows = await listLoadedActiveSkuRows();
  const data: Row[] = rows.map((r) => ({
    id: r.id,
    dealer_channel_code: r.dealer_channel_code,
    dealer_channel_name: r.dealer_channel_name,
    category_code: r.category_code,
    category_name: r.category_name,
    sku: r.sku,
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
  const latestChannelCount = Array.from(
    new Set(latestRows.map((row) => row.dealer_channel_code ?? ""))
  ).filter(Boolean).length;
  const latestCategoryCount = Array.from(new Set(latestRows.map((row) => row.category_code))).length;

  return (
    <DataPageLayout
      title="SKU范围关系表"
      description="过程范围表。当前根据 T2 采购中的 year/month + 渠道 + 产品分类 + SKU 关系实时派生，不再视为人工维护的基础输入表。"
      statsItems={[
        { label: "最近年份", value: latestYear ?? "-" },
        { label: "最近月份", value: latestMonth ?? "-" },
        { label: "最近窗口渠道数", value: latestChannelCount },
        { label: "最近窗口产品分类数", value: latestCategoryCount },
      ]}
      table={{
        title: "SKU范围关系表",
        columns,
        data,
        searchKey: "sku",
        searchPlaceholder: "搜索SKU...",
        filters: [
          {
            key: "dealer_channel_code",
            label: "经销商",
            placeholder: "全部经销商",
            optionLabelKey: "dealer_channel_name",
          },
          {
            key: "category_code",
            label: "产品分类",
            placeholder: "全部产品分类",
            optionLabelKey: "category_name",
          },
          { key: "year", label: "年", placeholder: "全部年份", options: yearOptions },
          { key: "month", label: "月", placeholder: "全部月份", options: monthOptions },
        ],
        exportTable: "ods_sku_active_list",
      }}
    />
  );
}
