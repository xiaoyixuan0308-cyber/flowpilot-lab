import { PageFeedbackCard } from "@/components/page-feedback-card";
import { PageIntro } from "@/components/page-intro";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import { listAllLoadedFcstChannelCategoryRows } from "@/server/repositories";
import { ChannelCategoryMatrixClient, type ChannelCategoryMatrixRecord } from "./channel-category-matrix-client";

function toPeriodKey(year: string, month: string) {
  return `${year}-${month.padStart(2, "0")}`;
}

export default async function ChannelCategoryAllocatePage() {
  const rows = await listAllLoadedFcstChannelCategoryRows();
  const data: ChannelCategoryMatrixRecord[] = rows.map((row) => ({
    id: row.id,
    period: toPeriodKey(row.year, row.month),
    dealer_channel_code: row.dealer_channel_code,
    dealer_channel_name: row.dealer_channel_name,
    category_code: row.category_code,
    category_name: row.category_name,
    fcst_qty: row.fcst_qty.toString(),
  }));

  const periodOptions = Array.from(new Set(data.map((row) => row.period))).sort((a, b) =>
    b.localeCompare(a)
  );
  const latestPeriod = periodOptions[0] ?? "";
  const latestRows = latestPeriod ? data.filter((row) => row.period === latestPeriod) : [];
  const latestCategoryCount = Array.from(new Set(latestRows.map((row) => row.category_code))).length;
  const latestChannelCount = Array.from(new Set(latestRows.map((row) => row.dealer_channel_code))).length;
  const latestFilledCells = Array.from(
    new Set(latestRows.map((row) => `${row.category_code}::${row.dealer_channel_code}`))
  ).length;
  const latestMatrixCells = latestCategoryCount * latestChannelCount;
  const latestMissingCells = Math.max(0, latestMatrixCells - latestFilledCells);

  return (
    <div className="space-y-4">
      <PageIntro
        title="渠道-产品分类配额矩阵视图"
        description="根据 渠道-产品分类 配货预测表动态生成矩阵：横轴为 渠道，纵轴为 产品分类；有预测数据的单元格显示预测数量，空白组合表示该 渠道 未给对应 产品分类 配额。"
      />

      <SummaryStatsGrid
        items={[
          { label: "最新月份", value: latestPeriod || "-" },
          { label: "最新月份记录数", value: latestRows.length },
          { label: "最新月份渠道数", value: latestChannelCount },
          { label: "最新月份空白组合", value: latestMissingCells },
        ]}
      />

      {latestPeriod ? (
        <ChannelCategoryMatrixClient rows={data} periodOptions={periodOptions} initialPeriod={latestPeriod} />
      ) : (
        <PageFeedbackCard
          title="暂无渠道-产品分类预测数据"
          description="请先导入 渠道-产品分类 配货预测表，系统会基于该表生成 渠道 x 产品分类 矩阵。"
        />
      )}
    </div>
  );
}
