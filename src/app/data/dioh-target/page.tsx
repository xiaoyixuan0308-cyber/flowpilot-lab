import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedDiohTargetRows } from "@/server/repositories";

type Row = { id: string; dealerlpcode: string; dealerlpname: string | null; upn: string; abc_class: string | null; dioh_days: string; tolerance: string };

const columns: Column<Row>[] = [
  { key: "dealerlpcode", header: "LP编码" },
  { key: "dealerlpname", header: "LP名称" },
  { key: "upn", header: "SKU" },
  { key: "abc_class", header: "ABC分类" },
  { key: "tolerance", header: "可调剂" },
  { key: "dioh_days", header: "目标库存天数【K】" },
];

export default async function DiohTargetPage() {
  const rows = await listLoadedDiohTargetRows();
  const data: Row[] = rows.map((r) => ({
    id: r.id, dealerlpcode: r.dealerlpcode, dealerlpname: r.dealerlpname,
    upn: r.upn, abc_class: r.abc_class,
    tolerance: r.abc_class === "A" ? "是" : "否",
    dioh_days: r.dioh_days.toString(),
  }));
  const abcOptions = Array.from(new Set(data.map((row) => row.abc_class ?? "")))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));
  const toleranceOptions = [
    { label: "是", value: "是" },
    { label: "否", value: "否" },
  ];
  const abcACount = data.filter((row) => row.abc_class === "A").length;
  const toleranceYesCount = data.filter((row) => row.tolerance === "是").length;
  const avgDioh = data.length === 0
    ? 0
    : Math.round((data.reduce((sum, row) => sum + Number(row.dioh_days || "0"), 0) / data.length) * 100) / 100;

  return (
    <DataPageLayout
      title="库存天数规则表"
      description="输入基础表。定义目标天数与容差规则，对应 K/L。"
      actions={<BaseTableActions table="diohTarget" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "ABC=A 数", value: abcACount },
        { label: "可调剂数", value: toleranceYesCount },
        { label: "平均库存天数", value: avgDioh },
      ]}
      table={{
        title: "库存天数规则表",
        columns,
        data,
        searchKey: "upn",
        searchPlaceholder: "搜索SKU...",
        filters: [
          {
            key: "dealerlpcode",
            label: "经销商",
            placeholder: "全部经销商",
            optionLabelKey: "dealerlpname",
          },
          { key: "abc_class", label: "ABC", placeholder: "全部ABC", options: abcOptions },
          { key: "tolerance", label: "可调剂", placeholder: "全部", options: toleranceOptions },
        ],
        exportTable: "ods_dioh_dealer_upn",
        exportParams: {},
      }}
    />
  );
}
