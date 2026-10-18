import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedFcstChannelCategoryRows } from "@/server/repositories";

type Row = { id: string; dealer_channel_code: string; dealer_channel_name: string | null; business_unit: string; category_code: string; category_name: string | null; fcst_qty: string; year: string; month: string };

const columns: Column<Row>[] = [
  { key: "dealer_channel_code", header: "渠道编码" },
  { key: "dealer_channel_name", header: "渠道名称" },
  { key: "business_unit", header: "业务单元" },
  { key: "category_code", header: "产品分类编码" },
  { key: "category_name", header: "产品分类名称" },
  { key: "year", header: "年" },
  { key: "month", header: "月" },
  { key: "fcst_qty", header: "预测数量" },
];

export default async function FcstChannelCategoryPage() {
  const rows = await listLoadedFcstChannelCategoryRows();
  const data: Row[] = rows.map((r) => ({
    id: r.id, dealer_channel_code: r.dealer_channel_code, dealer_channel_name: r.dealer_channel_name, business_unit: r.business_unit,
    category_code: r.category_code, category_name: r.category_name,
    fcst_qty: r.fcst_qty.toString(), year: r.year, month: r.month,
  }));
  const yearOptions = Array.from(new Set(data.map((row) => row.year)))
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));
  const monthOptions = Array.from(new Set(data.map((row) => row.month)))
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));
  const latestYear = yearOptions[0]?.value;
  const latestMonth = monthOptions[0]?.value;
  const latestRows =
    latestYear && latestMonth
      ? data.filter((row) => row.year === latestYear && row.month === latestMonth)
      : [];
  const latestCategoryCount = Array.from(new Set(latestRows.map((row) => row.category_code))).length;

  return (
    <DataPageLayout
      title="渠道-产品分类配货预测表"
      description="输入基础表。提供 W，对应 渠道-产品分类 层配货预测。"
      actions={<BaseTableActions table="fcstChannelCategory" />}
      statsItems={[
        { label: "最近年份", value: latestYear ?? "-" },
        { label: "最近月份", value: latestMonth ?? "-" },
        { label: "最近窗口记录数", value: latestRows.length },
        { label: "最近窗口产品分类数", value: latestCategoryCount },
      ]}
      table={{
        title: "渠道-产品分类配货预测表",
        columns,
        data,
        searchKey: "category_code",
        searchPlaceholder: "搜索产品分类...",
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
        exportTable: "ods_fcst_channel_category_monthly",
        exportParams: {},
      }}
    />
  );
}
