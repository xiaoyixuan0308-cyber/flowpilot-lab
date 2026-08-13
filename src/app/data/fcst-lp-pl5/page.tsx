import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedFcstLpPl5Rows } from "@/server/repositories";

type Row = { id: string; dealerlpcode: string; dealerlpname: string | null; sc_bu: string; pl5_code: string; pl5_name: string | null; fcst_qty: string; year: string; month: string };

const columns: Column<Row>[] = [
  { key: "dealerlpcode", header: "LP编码" },
  { key: "dealerlpname", header: "LP名称" },
  { key: "sc_bu", header: "SC_BU" },
  { key: "pl5_code", header: "产品分类编码" },
  { key: "pl5_name", header: "产品分类名称" },
  { key: "year", header: "年" },
  { key: "month", header: "月" },
  { key: "fcst_qty", header: "预测数量" },
];

export default async function FcstLpPl5Page() {
  const rows = await listLoadedFcstLpPl5Rows();
  const data: Row[] = rows.map((r) => ({
    id: r.id, dealerlpcode: r.dealerlpcode, dealerlpname: r.dealerlpname, sc_bu: r.sc_bu,
    pl5_code: r.pl5_code, pl5_name: r.pl5_name,
    fcst_qty: r.fcst_qty.toString(), year: r.year, month: r.month,
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
  const latestPl5Count = Array.from(new Set(latestRows.map((row) => row.pl5_code))).length;

  return (
    <DataPageLayout
      title="LP-产品分类配货预测表"
      description="输入基础表。提供 W，对应 LP-产品分类 层配货预测。"
      actions={<BaseTableActions table="fcstLpPl5" />}
      statsItems={[
        { label: "最近年份", value: latestYear ?? "-" },
        { label: "最近月份", value: latestMonth ?? "-" },
        { label: "最近窗口记录数", value: latestRows.length },
        { label: "最近窗口产品分类数", value: latestPl5Count },
      ]}
      table={{
        title: "LP-产品分类配货预测表",
        columns,
        data,
        searchKey: "pl5_code",
        searchPlaceholder: "搜索产品分类...",
        filters: [
          {
            key: "dealerlpcode",
            label: "经销商",
            placeholder: "全部经销商",
            optionLabelKey: "dealerlpname",
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
        exportTable: "ods_fcst_lp_pl5_monthly",
        exportParams: {},
      }}
    />
  );
}
