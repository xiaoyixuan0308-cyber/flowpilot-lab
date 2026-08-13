import { BaseTableActions } from "@/components/base-table-actions";
import { PageIntro } from "@/components/page-intro";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import { listLoadedWeeklyAmountThresholdRows } from "@/server/repositories";
import {
  WeeklyAmountThresholdManager,
  type WeeklyAmountThresholdManagerRow,
} from "./weekly-amount-threshold-manager";

export const dynamic = "force-dynamic";

function formatPercentageInput(value: string) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return value;
  return Number.isInteger(numberValue)
    ? String(numberValue)
    : numberValue.toFixed(4).replace(/\.?0+$/, "");
}

export default async function WeeklyAmountThresholdPage() {
  const rows = await listLoadedWeeklyAmountThresholdRows();
  const displayRows: WeeklyAmountThresholdManagerRow[] = rows.map((row) => ({
    ...row,
    overage_threshold_pct: formatPercentageInput(row.overage_threshold_pct),
    shortfall_threshold_pct: formatPercentageInput(row.shortfall_threshold_pct),
  }));

  return (
    <div className="space-y-4">
      <PageIntro
        title="周金额调整阈值"
        description="按业务单元维护超额缩减阈值和缺口补差阈值。没有对应业务单元记录时，两项均默认使用 5%。"
      />
      <BaseTableActions table="weeklyAmountThreshold" />
      <SummaryStatsGrid items={[{ label: "已配置 BU", value: rows.length }]} columns={4} />
      <WeeklyAmountThresholdManager rows={displayRows} />
    </div>
  );
}
