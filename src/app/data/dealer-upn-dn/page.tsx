import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedDealerUpnDnRows } from "@/server/repositories";

type Row = {
  id: string;
  created_on: string;
  sold_to_pt: string;
  sc_bu: string;
  dealer_type: string;
  material: string;
  delivery_qty: string;
};

const columns: Column<Row>[] = [
  { key: "created_on", header: "发货日期" },
  { key: "sold_to_pt", header: "客户编码" },
  { key: "sc_bu", header: "业务单元" },
  { key: "dealer_type", header: "经销商类型" },
  { key: "material", header: "SKU" },
  { key: "delivery_qty", header: "发货数量" },
];

export default async function DealerUpnDnPage() {
  const rows = await listLoadedDealerUpnDnRows();
  const data: Row[] = rows.map((row) => ({
    id: row.id,
    created_on: row.created_on ?? "",
    sold_to_pt: row.sold_to_pt ?? "",
    sc_bu: row.sc_bu,
    dealer_type: row.dealer_type,
    material: row.material ?? "",
    delivery_qty: row.delivery_qty,
  }));
  const dateOptions = Array.from(new Set(data.map((row) => row.created_on)))
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));
  const latestDate = dateOptions[0]?.value;
  const latestRows = latestDate ? data.filter((row) => row.created_on === latestDate) : [];
  const latestCustomerCount = Array.from(new Set(latestRows.map((row) => row.sold_to_pt))).filter(Boolean).length;
  const latestUpnCount = Array.from(new Set(latestRows.map((row) => row.material))).filter(Boolean).length;

  return (
    <DataPageLayout
      title="经销商发货记录"
      description="周拆分第一阶段输入表。用于维护 FOMS 发货数量，支撑已出货相关节点。"
      actions={<BaseTableActions table="dealerUpnDn" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "最近发货日", value: latestDate ?? "-" },
        { label: "最近窗口客户数", value: latestCustomerCount },
        { label: "最近窗口SKU数", value: latestUpnCount },
      ]}
      table={{
        title: "经销商发货记录明细",
        columns,
        data,
        searchKey: "material",
        searchPlaceholder: "搜索物料/SKU...",
        filters: [
          { key: "created_on", label: "发货日", placeholder: "全部日期", options: dateOptions },
        ],
        exportTable: "ods_dealer_upn_dn",
        exportParams: {},
      }}
    />
  );
}
