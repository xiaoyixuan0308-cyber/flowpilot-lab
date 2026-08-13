import { DataTable, type Column } from "@/components/data-table";
import { PageIntro } from "@/components/page-intro";
import { SectionCard } from "@/components/section-card";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import {
  getCurrentUsdToCnyRate,
  listUsdToCnyRateHistory,
} from "@/server/services/currency/exchange-rate.service";
import { ExchangeRateForm } from "./exchange-rate-form";

type RateRow = Record<string, unknown> & {
  effective_at: string;
  direction: string;
  rate: string;
  status: string;
  source_system: string;
};

const columns: Column<RateRow>[] = [
  { key: "effective_at", header: "生效时间" },
  { key: "direction", header: "汇率方向" },
  { key: "rate", header: "汇率" },
  { key: "status", header: "状态" },
  { key: "source_system", header: "来源" },
];

const UTC_PLUS_8_OFFSET_MS = 8 * 60 * 60 * 1000;

function formatDateTimeUtc8(date: Date) {
  return new Date(date.getTime() + UTC_PLUS_8_OFFSET_MS)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
}

export default async function ExchangeRatePage() {
  const [current, history] = await Promise.all([
    getCurrentUsdToCnyRate(),
    listUsdToCnyRateHistory(),
  ]);
  const rows: RateRow[] = history.map((row) => ({
    effective_at: formatDateTimeUtc8(row.effective_at),
    direction: "1 USD = 汇率值 CNY",
    rate: Number(row.rate).toFixed(10).replace(/\.?0+$/, ""),
    status: row.is_active ? "当前" : "历史",
    source_system: row.source_system,
  }));

  return (
    <div className="space-y-6">
      <PageIntro title="USD/CNY 汇率" description="维护人民币输入和展示使用的汇率。系统内部金额始终以 USD 计算。" />
      <SummaryStatsGrid
        columns={3}
        items={[
          { label: "统一计算币种", value: "USD" },
          { label: "当前汇率方向", value: "1 USD = 汇率值 CNY" },
          { label: "当前汇率", value: current.rate },
        ]}
      />
      <SectionCard title="修改当前汇率" description="保存会新增汇率版本，不会改写历史导入和历史计算结果。">
        <ExchangeRateForm initialRate={current.rate} />
      </SectionCard>
      <DataTable<RateRow> title="汇率历史" columns={columns} data={rows} />
    </div>
  );
}
