import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedBscUpnInventoryRows } from "@/server/repositories";

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

export default async function BscUpnInventoryPage() {
  const rows = await listLoadedBscUpnInventoryRows();
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
  const upnCount = Array.from(new Set(data.map((row) => row.material))).length;

  return (
    <DataPageLayout
      title="BSC库存"
      description="周拆分第一阶段输入表。维护 BSC 非限制库存，支撑 BSC 库存节点。"
      actions={<BaseTableActions table="bscUpnInventory" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "SKU数", value: upnCount },
        { label: "库位数", value: slocOptions.length },
      ]}
      statsColumns={3}
      table={{
        title: "BSC库存明细",
        columns,
        data,
        searchKey: "material",
        searchPlaceholder: "搜索物料/SKU...",
        filters: [
          { key: "sloc", label: "库位", placeholder: "全部库位", options: slocOptions },
        ],
        exportTable: "ods_bsc_upn_inventory",
        exportParams: {},
      }}
    />
  );
}
