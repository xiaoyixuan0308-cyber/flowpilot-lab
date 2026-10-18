import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedFcstT2CategoryRows } from "@/server/repositories";

type Row = { id: string; parent_dealer_channel_code: string | null; parent_dealer_channel_name: string | null; business_unit: string; category_code: string; category_name: string | null; fcst_qty: string; year: string; month: string };

const columns: Column<Row>[] = [
  { key: "parent_dealer_channel_code", header: "上级经销商" },
  { key: "parent_dealer_channel_name", header: "上级经销商名" },
  { key: "business_unit", header: "业务单元" },
  { key: "category_code", header: "产品分类编码" },
  { key: "category_name", header: "产品分类名称" },
  { key: "year", header: "年" },
  { key: "month", header: "月" },
  { key: "fcst_qty", header: "预测数量" },
];

export default async function FcstT2CategoryPage() {
  const rows = await listLoadedFcstT2CategoryRows();
  const data: Row[] = rows.map((r) => ({
    id: r.id, parent_dealer_channel_code: r.parent_dealer_channel_code, parent_dealer_channel_name: r.parent_dealer_channel_name, business_unit: r.business_unit,
    category_code: r.category_code, category_name: r.category_name,
    year: r.year, month: r.month, fcst_qty: r.fcst_qty.toString(),
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
      title="T2-产品分类预测表"
      description="输入基础表。提供 V，对应 T2-产品分类 层预测。"
      actions={<BaseTableActions table="fcstT2Category" />}
      statsItems={[
        { label: "最近年份", value: latestYear ?? "-" },
        { label: "最近月份", value: latestMonth ?? "-" },
        { label: "最近窗口记录数", value: latestRows.length },
        { label: "最近窗口产品分类数", value: latestCategoryCount },
      ]}
      table={{
        title: "T2-产品分类预测表",
        columns,
        data,
        searchKey: "category_code",
        searchPlaceholder: "搜索产品分类...",
        filters: [
          {
            key: "parent_dealer_channel_code",
            label: "经销商",
            placeholder: "全部经销商",
            optionLabelKey: "parent_dealer_channel_name",
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
        exportTable: "ods_fcst_t2_category_monthly",
        exportParams: {},
      }}
    />
  );
}
