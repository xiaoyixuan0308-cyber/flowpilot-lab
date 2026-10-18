import type { Column } from "@/components/data-table";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedChannelCategoryScopeRows } from "@/server/repositories";

type Row = {
  period_month: string;
  business_unit: string;
  channel_code: string;
  channel_name: string | null;
  category_code: string;
  category_name: string | null;
  scope_source: string;
};

const columns: Column<Row>[] = [
  { key: "period_month", header: "月份" },
  { key: "business_unit", header: "业务单元" },
  { key: "channel_code", header: "渠道编码" },
  { key: "channel_name", header: "渠道名称" },
  { key: "category_code", header: "产品分类编码" },
  { key: "category_name", header: "产品分类名称" },
  { key: "scope_source", header: "范围来源", className: "max-w-[26rem] whitespace-normal break-words leading-5 text-sm" },
];

export default async function ChannelCategoryScopePage() {
  const rows = await listLoadedChannelCategoryScopeRows();
  const data: Row[] = rows.map((row) => ({
    period_month: row.period_month.toISOString().slice(0, 10),
    business_unit: row.business_unit,
    channel_code: row.channel_code,
    channel_name: row.channel_name,
    category_code: row.category_code,
    category_name: row.category_name,
    scope_source: row.scope_source,
  }));

  const periodOptions = Array.from(new Set(data.map((row) => row.period_month)))
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ label: value, value }));

  return (
    <DataPageLayout
      title="渠道-产品分类范围表"
      description="过程数据表。展示当前月下 渠道 × 产品分类 组合是由哪些基础输入共同补齐出来的。"
      statsItems={[
        { label: "当前记录数", value: data.length },
        { label: "月份数", value: periodOptions.length },
      ]}
      statsColumns={2}
      table={{
        title: "渠道-产品分类范围表",
        columns,
        data,
        searchKey: "category_code",
        searchPlaceholder: "搜索产品分类...",
        filters: [
          { key: "period_month", label: "月份", placeholder: "全部月份", sort: "desc" },
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
        ],
      }}
    />
  );
}
