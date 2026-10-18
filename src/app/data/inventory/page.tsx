import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedInventoryRows } from "@/server/repositories";

type Row = { id: string; dealer_channel_code: string; dealer_channel_name: string | null; sku: string; qty: string; year: string; month: string };

const columns: Column<Row>[] = [
  { key: "dealer_channel_code", header: "渠道编码" },
  { key: "dealer_channel_name", header: "渠道名称" },
  { key: "sku", header: "SKU" },
  { key: "qty", header: "库存数量" },
  { key: "year", header: "年" },
  { key: "month", header: "月" },
];

export default async function InventoryPage() {
  const rows = await listLoadedInventoryRows();
  const data: Row[] = rows.map((r) => ({
    id: r.id, dealer_channel_code: r.dealer_channel_code, dealer_channel_name: r.dealer_channel_name,
    sku: r.sku, qty: r.qty.toString(), year: r.year, month: r.month,
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
      title="库存基础表"
      description="输入基础表。提供库存值，对应 J。"
      actions={<BaseTableActions table="inventory" />}
      statsItems={[
        { label: "最近年份", value: latestYear ?? "-" },
        { label: "最近月份", value: latestMonth ?? "-" },
        { label: "最近窗口记录数", value: latestRows.length },
        { label: "最近窗口SKU数", value: latestSkuCount },
      ]}
      table={{
        title: "库存基础表",
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
          { key: "year", label: "年", placeholder: "全部年份", options: yearOptions },
          { key: "month", label: "月", placeholder: "全部月份", options: monthOptions },
        ],
        exportTable: "ods_inventory_dealer_sku",
        exportParams: {},
      }}
    />
  );
}
