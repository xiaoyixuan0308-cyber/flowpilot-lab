import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedDealerSkuOpenOrderRows } from "@/server/repositories";

type Row = {
  id: string;
  customer: string;
  business_unit: string;
  dealer_type: string;
  material: string;
  dctp: string;
  open_qty: string;
};

const columns: Column<Row>[] = [
  { key: "customer", header: "客户编码" },
  { key: "business_unit", header: "业务单元" },
  { key: "dealer_type", header: "经销商类型" },
  { key: "material", header: "SKU" },
  { key: "dctp", header: "订单类型" },
  { key: "open_qty", header: "未清数量" },
];

export default async function DealerSkuOpenOrderPage() {
  const rows = await listLoadedDealerSkuOpenOrderRows();
  const data: Row[] = rows.map((row) => ({
    id: row.id,
    customer: row.customer ?? "",
    business_unit: row.business_unit,
    dealer_type: row.dealer_type ?? "",
    material: row.material ?? "",
    dctp: row.dctp ?? "",
    open_qty: row.open_qty,
  }));
  const dctpOptions = Array.from(new Set(data.map((row) => row.dctp)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));
  const dealerTypeOptions = Array.from(new Set(data.map((row) => row.dealer_type)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));
  const customerCount = Array.from(new Set(data.map((row) => row.customer))).filter(Boolean).length;
  const skuCount = Array.from(new Set(data.map((row) => row.material))).filter(Boolean).length;

  return (
    <DataPageLayout
      title="经销商未清订单"
      description="周拆分第一阶段输入表。保留 OR / 非 OR 等订单类型，支撑 Open Order 相关节点。"
      actions={<BaseTableActions table="dealerSkuOpenOrder" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "客户数", value: customerCount },
        { label: "SKU数", value: skuCount },
        { label: "订单类型数", value: dctpOptions.length },
      ]}
      table={{
        title: "经销商未清订单明细",
        columns,
        data,
        searchKey: "material",
        searchPlaceholder: "搜索物料/SKU...",
        filters: [
          { key: "dealer_type", label: "经销商类型", placeholder: "全部类型", options: dealerTypeOptions },
          { key: "dctp", label: "订单类型", placeholder: "全部类型", options: dctpOptions },
        ],
        exportTable: "ods_dealer_sku_open_order",
        exportParams: {},
      }}
    />
  );
}
