import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedSkuSafetyStockRows } from "@/server/repositories";

type Row = {
  id: string;
  sku: string;
  safety_stock_qty: string;
};

const columns: Column<Row>[] = [
  { key: "sku", header: "SKU" },
  { key: "safety_stock_qty", header: "安全库存数量" },
];

export default async function SkuSafetyStockPage() {
  const rows = await listLoadedSkuSafetyStockRows();
  const data: Row[] = rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    safety_stock_qty: row.safety_stock_qty,
  }));

  return (
    <DataPageLayout
      title="安全库存"
      description="周拆分第一阶段输入表。维护手工安全库存数量。"
      actions={<BaseTableActions table="skuSafetyStock" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "SKU数", value: Array.from(new Set(data.map((row) => row.sku))).length },
      ]}
      statsColumns={2}
      table={{
        title: "安全库存明细",
        columns,
        data,
        searchKey: "sku",
        searchPlaceholder: "搜索SKU...",
        exportTable: "ods_sku_safety_stock_manual",
        exportParams: {},
      }}
    />
  );
}
