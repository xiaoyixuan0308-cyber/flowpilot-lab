import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedBscUpnIntransitRows } from "@/server/repositories";

type Row = {
  id: string;
  material: string;
  forecast_date: string;
  intransit_qty: string;
};

const columns: Column<Row>[] = [
  { key: "material", header: "SKU" },
  { key: "forecast_date", header: "预计到达日" },
  { key: "intransit_qty", header: "在途数量" },
];

export default async function BscUpnIntransitPage() {
  const rows = await listLoadedBscUpnIntransitRows();
  const data: Row[] = rows.map((row) => ({
    id: row.id,
    material: row.material,
    forecast_date: row.forecast_date ?? "",
    intransit_qty: row.intransit_qty,
  }));
  const dateOptions = Array.from(new Set(data.map((row) => row.forecast_date)))
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));
  const latestDate = dateOptions[0]?.value;
  const latestRows = latestDate ? data.filter((row) => row.forecast_date === latestDate) : [];
  const latestUpnCount = Array.from(new Set(latestRows.map((row) => row.material))).length;

  return (
    <DataPageLayout
      title="BSC在途库存"
      description="周拆分第一阶段输入表。维护 BSC 在途数量与 ETA，支撑在途库存节点。"
      actions={<BaseTableActions table="bscUpnIntransit" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "最近 ETA", value: latestDate ?? "-" },
        { label: "最近 ETA SKU 数", value: latestUpnCount },
      ]}
      statsColumns={3}
      table={{
        title: "BSC在途库存明细",
        columns,
        data,
        searchKey: "material",
        searchPlaceholder: "搜索物料/SKU...",
        filters: [
          { key: "forecast_date", label: "ETA", placeholder: "全部日期", options: dateOptions },
        ],
        exportTable: "ods_bsc_upn_intransit",
        exportParams: {},
      }}
    />
  );
}
