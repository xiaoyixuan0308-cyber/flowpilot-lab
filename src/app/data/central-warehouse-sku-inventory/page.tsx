import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedCentralWarehouseSkuInventoryRows } from "@/server/repositories";

type Row = {
  id: string;
  material: string;
  sloc: string;
  unrestricted_qty: string;
};

const columns: Column<Row>[] = [
  { key: "material", header: "SKU" },
  { key: "sloc", header: "库位" },
  { key: "unrestricted_qty", header: "非限制库存" },
];

export default async function CentralWarehouseSkuInventoryPage() {
  const rows = await listLoadedCentralWarehouseSkuInventoryRows();
  const data: Row[] = rows.map((row) => ({
    id: row.id,
    material: row.material,
    sloc: row.sloc ?? "",
    unrestricted_qty: row.unrestricted_qty,
  }));
  const slocOptions = Array.from(new Set(data.map((row) => row.sloc)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));
  const skuCount = Array.from(new Set(data.map((row) => row.material))).length;

  return (
    <DataPageLayout
      title="中央仓库存"
      description="周拆分第一阶段输入表。维护 中央仓 非限制库存，支撑 中央仓 库存节点。"
      actions={<BaseTableActions table="centralWarehouseSkuInventory" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "SKU数", value: skuCount },
        { label: "库位数", value: slocOptions.length },
      ]}
      statsColumns={3}
      table={{
        title: "中央仓库存明细",
        columns,
        data,
        searchKey: "material",
        searchPlaceholder: "搜索物料/SKU...",
        filters: [
          { key: "sloc", label: "库位", placeholder: "全部库位", options: slocOptions },
        ],
        exportTable: "ods_central_warehouse_sku_inventory",
        exportParams: {},
      }}
    />
  );
}
