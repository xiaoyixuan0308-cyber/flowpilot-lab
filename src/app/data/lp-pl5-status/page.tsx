import type { Column } from "@/components/data-table";
import { listLoadedLpPl5StatusRows } from "@/server/repositories";
import { DataPageLayout } from "@/components/data-page-layout";

type Row = {
  period_month: string;
  sc_bu: string;
  lp_code: string;
  lp_name: string | null;
  pl5_code: string;
  pl5_name: string | null;
  has_quota: string;
  has_quota_label: string;
  has_history: string;
  has_history_label: string;
  quota_qty: string;
  history_qty_m6_m1: string;
  status_note: string;
  error_message: string;
  has_error: string;
  has_error_label: string;
};

const columns: Column<Row>[] = [
  { key: "period_month", header: "月份" },
  { key: "sc_bu", header: "业务单元" },
  { key: "lp_code", header: "LP编码" },
  { key: "lp_name", header: "LP名称" },
  { key: "pl5_code", header: "产品分类编码" },
  { key: "pl5_name", header: "产品分类名称" },
  { key: "has_quota_label", header: "有配额" },
  { key: "has_history_label", header: "有历史" },
  { key: "quota_qty", header: "配额值" },
  { key: "history_qty_m6_m1", header: "M-6~M-1历史量" },
  { key: "status_note", header: "状态备注" },
  { key: "error_message", header: "异常说明", className: "max-w-[22rem] whitespace-normal break-words leading-5 text-sm" },
];

export default async function LpPl5StatusPage() {
  const rows = await listLoadedLpPl5StatusRows();

  const data: Row[] = rows.map((r) => ({
    period_month: r.period_month?.toISOString().slice(0, 10) ?? "",
    sc_bu: r.sc_bu,
    lp_code: r.lp_code,
    lp_name: r.lp_name,
    pl5_code: r.pl5_code,
    pl5_name: r.pl5_name,
    has_quota: r.has_quota ? "Y" : "N",
    has_quota_label: r.has_quota ? "有" : "无",
    has_history: r.has_history ? "Y" : "N",
    has_history_label: r.has_history ? "有" : "无",
    quota_qty: r.quota_qty?.toString() ?? "",
    history_qty_m6_m1: r.history_qty_m6_m1?.toString() ?? "",
    status_note: r.status_note ?? "",
    error_message: r.error_message ?? "",
    has_error: r.error_message ? "Y" : "N",
    has_error_label: r.error_message ? "异常" : "正常",
  }));
  const periodOptions = Array.from(new Set(data.map((row) => row.period_month)))
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));
  const latestPeriod = periodOptions[0]?.value;
  const latestRows = latestPeriod ? data.filter((row) => row.period_month === latestPeriod) : [];
  const latestQuotaCount = latestRows.filter((row) => row.has_quota === "Y").length;
  const latestHistoryCount = latestRows.filter((row) => row.has_history === "Y").length;
  const yesNoOptions = [
    { label: "有", value: "Y" },
    { label: "无", value: "N" },
  ];
  const errorStateOptions = [
    { label: "正常", value: "N" },
    { label: "异常", value: "Y" },
  ];
  const latestErrorCount = latestRows.filter((row) => row.has_error === "Y").length;

  return (
    <DataPageLayout
      title="LP-产品分类状态表"
      description="过程数据表。当前根据 T2 / 配额 / 预测等基础表实时派生 LP-产品分类 scope/status，不依赖先执行结果计算。"
      statsItems={[
        { label: "最近月份", value: latestPeriod ?? "-" },
        { label: "最近月份组合数", value: latestRows.length },
        { label: "最近月份有配额", value: latestQuotaCount },
        { label: "最近月份有历史", value: latestHistoryCount },
        { label: "最近月份异常", value: latestErrorCount },
      ]}
      table={{
        title: "LP-产品分类状态表",
        columns,
        data,
        searchKey: "pl5_code",
        searchPlaceholder: "搜索产品分类...",
        exportTable: "list_lp_pl5_status_monthly",
        exportParams: {},
        filters: [
          {
            key: "period_month",
            label: "月份",
            placeholder: "全部月份",
            options: periodOptions,
          },
          {
            key: "lp_code",
            label: "经销商",
            placeholder: "全部经销商",
            optionLabelKey: "lp_name",
          },
          {
            key: "pl5_code",
            label: "产品分类",
            placeholder: "全部产品分类",
            optionLabelKey: "pl5_name",
          },
          {
            key: "has_quota",
            label: "配额",
            placeholder: "全部配额",
            options: yesNoOptions,
          },
          {
            key: "has_history",
            label: "历史",
            placeholder: "全部历史",
            options: yesNoOptions,
          },
          {
            key: "has_error",
            label: "异常状态",
            placeholder: "全部结果",
            options: errorStateOptions,
          },
          {
            key: "error_message",
            label: "异常说明",
            placeholder: "全部异常说明",
            sort: "asc",
          },
        ],
      }}
    />
  );
}
