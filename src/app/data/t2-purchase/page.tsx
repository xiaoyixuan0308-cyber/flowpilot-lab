import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedT2PurchaseRows } from "@/server/repositories";

type Row = { id: string; parent_dealer_channel_code: string | null; parent_dealer_channel_name: string | null; business_unit: string; sku: string; category_code: string; category_name: string | null; qty: string; year: string; month: string };

const columns: Column<Row>[] = [
  { key: "parent_dealer_channel_code", header: "经销商编码" },
  { key: "parent_dealer_channel_name", header: "经销商名称" },
  { key: "business_unit", header: "业务单元" },
  { key: "sku", header: "SKU" },
  { key: "category_code", header: "产品分类编码" },
  { key: "category_name", header: "产品分类名称" },
  { key: "qty", header: "采购数量" },
  { key: "year", header: "年" },
  { key: "month", header: "月" },
];

export default async function T2PurchasePage() {
  const rows = await listLoadedT2PurchaseRows();
  const data: Row[] = rows.map((r) => ({
    id: r.id, parent_dealer_channel_code: r.parent_dealer_channel_code, parent_dealer_channel_name: r.parent_dealer_channel_name, business_unit: r.business_unit,
    sku: r.sku, category_code: r.category_code, category_name: r.category_name,
    qty: r.qty.toString(), year: r.year, month: r.month,
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
  const latestSkuCount = Array.from(new Set(latestRows.map((row) => row.sku))).length;

  return (
    <DataPageLayout
      title="T2采购历史表"
      description="输入基础表。提供 H/T/U，并参与 E 的历史聚合。"
      actions={<BaseTableActions table="t2Purchase" />}
      statsItems={[
        { label: "最近年份", value: latestYear ?? "-" },
        { label: "最近月份", value: latestMonth ?? "-" },
        { label: "最近窗口记录数", value: latestRows.length },
        { label: "最近窗口SKU数", value: latestSkuCount },
      ]}
      table={{
        title: "T2采购历史表",
        columns,
        data,
        searchKey: "sku",
        searchPlaceholder: "搜索SKU...",
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
        exportTable: "ods_t2_purchase_monthly",
        exportParams: {},
      }}
    />
  );
}
