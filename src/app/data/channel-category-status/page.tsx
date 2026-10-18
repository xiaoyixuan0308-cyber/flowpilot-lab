import type { Column } from "@/components/data-table";
import { listLoadedChannelCategoryStatusRows } from "@/server/repositories";
import { DataPageLayout } from "@/components/data-page-layout";

type Row = {
  period_month: string;
  business_unit: string;
  channel_code: string;
  channel_name: string | null;
  category_code: string;
  category_name: string | null;
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
  { key: "business_unit", header: "业务单元" },
  { key: "channel_code", header: "渠道编码" },
  { key: "channel_name", header: "渠道名称" },
  { key: "category_code", header: "产品分类编码" },
  { key: "category_name", header: "产品分类名称" },
  { key: "has_quota_label", header: "有配额" },
  { key: "has_history_label", header: "有历史" },
  { key: "quota_qty", header: "配额值" },
  { key: "history_qty_m6_m1", header: "M-6~M-1历史量" },
  { key: "status_note", header: "状态备注" },
  { key: "error_message", header: "异常说明", className: "max-w-[22rem] whitespace-normal break-words leading-5 text-sm" },
];

export default async function ChannelCategoryStatusPage() {
  const rows = await listLoadedChannelCategoryStatusRows();

  const data: Row[] = rows.map((r) => ({
    period_month: r.period_month?.toISOString().slice(0, 10) ?? "",
    business_unit: r.business_unit,
    channel_code: r.channel_code,
    channel_name: r.channel_name,
    category_code: r.category_code,
    category_name: r.category_name,
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
      title="渠道-产品分类状态表"
      description="过程数据表。当前根据 T2 / 配额 / 预测等基础表实时派生 渠道-产品分类 scope/status，不依赖先执行结果计算。"
      statsItems={[
        { label: "最近月份", value: latestPeriod ?? "-" },
        { label: "最近月份组合数", value: latestRows.length },
        { label: "最近月份有配额", value: latestQuotaCount },
        { label: "最近月份有历史", value: latestHistoryCount },
        { label: "最近月份异常", value: latestErrorCount },
      ]}
      table={{
        title: "渠道-产品分类状态表",
        columns,
        data,
        searchKey: "category_code",
        searchPlaceholder: "搜索产品分类...",
        exportTable: "list_channel_category_status_monthly",
        exportParams: {},
        filters: [
          {
            key: "period_month",
            label: "月份",
            placeholder: "全部月份",
            options: periodOptions,
          },
          {
            key: "channel_code",
            label: "经销商",
            placeholder: "全部经销商",
            optionLabelKey: "channel_name",
          },
          {
            key: "category_code",
            label: "产品分类",
            placeholder: "全部产品分类",
            optionLabelKey: "category_name",
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
