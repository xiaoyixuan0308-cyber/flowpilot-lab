import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedT2PurchaseRows } from "@/server/repositories";

type Row = { id: string; parentdealerlpcode: string | null; parentdealerlpname: string | null; sc_bu: string; upn: string; pl5_code: string; pl5_name: string | null; qty: string; year: string; month: string };

const columns: Column<Row>[] = [
  { key: "parentdealerlpcode", header: "经销商编码" },
  { key: "parentdealerlpname", header: "经销商名称" },
  { key: "sc_bu", header: "SC_BU" },
  { key: "upn", header: "SKU" },
  { key: "pl5_code", header: "产品分类编码" },
  { key: "pl5_name", header: "产品分类名称" },
  { key: "qty", header: "采购数量" },
  { key: "year", header: "年" },
  { key: "month", header: "月" },
];

export default async function T2PurchasePage() {
  const rows = await listLoadedT2PurchaseRows();
  const data: Row[] = rows.map((r) => ({
    id: r.id, parentdealerlpcode: r.parentdealerlpcode, parentdealerlpname: r.parentdealerlpname, sc_bu: r.sc_bu,
    upn: r.upn, pl5_code: r.pl5_code, pl5_name: r.pl5_name,
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
  const latestUpnCount = Array.from(new Set(latestRows.map((row) => row.upn))).length;

  return (
    <DataPageLayout
      title="T2采购历史表"
      description="输入基础表。提供 H/T/U，并参与 E 的历史聚合。"
      actions={<BaseTableActions table="t2Purchase" />}
      statsItems={[
        { label: "最近年份", value: latestYear ?? "-" },
        { label: "最近月份", value: latestMonth ?? "-" },
        { label: "最近窗口记录数", value: latestRows.length },
        { label: "最近窗口SKU数", value: latestUpnCount },
      ]}
      table={{
        title: "T2采购历史表",
        columns,
        data,
        searchKey: "upn",
        searchPlaceholder: "搜索SKU...",
        filters: [
          {
            key: "parentdealerlpcode",
            label: "经销商",
            placeholder: "全部经销商",
            optionLabelKey: "parentdealerlpname",
          },
          {
            key: "pl5_code",
            label: "产品分类",
            placeholder: "全部产品分类",
            optionLabelKey: "pl5_name",
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
