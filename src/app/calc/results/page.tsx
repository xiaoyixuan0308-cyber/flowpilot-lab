import { getCalcBatchSummary } from "@/server/repositories";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import type { Column } from "@/components/data-table";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import { PageIntro } from "@/components/page-intro";
import { PageFeedbackCard } from "@/components/page-feedback-card";
import { SectionCard } from "@/components/section-card";
import {
  buildCalcBatchTableRows,
  summarizeCalcBatchRows,
  type CalcBatchTableRow,
} from "@/lib/calc-batch-view";

const columns: Column<CalcBatchTableRow>[] = [
  { key: "calculated_at", header: "生成时间", hrefKey: "detail_href" },
  { key: "period_month", header: "月份" },
  { key: "status", header: "状态" },
  { key: "total_upns", header: "总结果行" },
  { key: "error_upns", header: "异常行" },
];

export default async function ResultsListPage() {
  const summary = await getCalcBatchSummary();
  const data = buildCalcBatchTableRows(summary.batches);
  const overview = summarizeCalcBatchRows(data);

  return (
    <div className="space-y-6">
      <PageIntro
        title="结果总览"
        description="查看历史结果快照版本，并进入对应的结果数据明细与过程追踪。"
      />

      <SectionCard
        title="最新结果"
        description="优先从这里进入最近一版结果明细，客户看数时通常直接从这里开始。"
        action={
          overview.latestBatch ? (
            <div className="flex items-center gap-4 text-sm">
              <Link
                href={overview.latestBatch.detail_href}
                className="text-primary underline whitespace-nowrap"
              >
                打开最新结果明细
              </Link>
              <Link
                href={overview.latestBatch.trace_href}
                className="text-primary underline whitespace-nowrap"
              >
                打开最新过程追踪
              </Link>
              <Link
                href={`/calc/explain/${overview.latestBatch.period_month}`}
                className="text-primary underline whitespace-nowrap"
              >
                打开最新计算流程
              </Link>
              <Link
                href="/calc/upn-split"
                className="text-primary underline whitespace-nowrap"
              >
                打开结果快照
              </Link>
            </div>
          ) : undefined
        }
        contentClassName="space-y-4"
      >
        {overview.latestBatch ? (
          <SummaryStatsGrid
            items={[
              { label: "生成时间", value: overview.latestBatch.calculated_at },
              { label: "月份", value: overview.latestBatch.period_month },
              { label: "状态", value: overview.latestBatch.status },
              { label: "总结果行", value: overview.latestBatch.total_upns },
              { label: "异常行", value: overview.latestBatch.error_upns },
            ]}
          />
        ) : (
          <PageFeedbackCard
            title="暂无结果批次"
            description={
              <>
                请前往
                <Link href="/calc/upn-split" className="text-primary underline mx-1">
                  结果快照
                </Link>
                页面先生成第一版结果数据。
              </>
            }
          />
        )}
      </SectionCard>

      <SectionCard
        title="历史结果版本"
        description="这里保留历史快照版本列表，方便对照不同月份或不同运行批次。"
        action={
          <a
            href="/api/data/export?table=calc_batch&scope=loaded"
            download
            className="text-sm text-primary underline whitespace-nowrap"
          >
            {`导出当前批次列表（${data.length}）`}
          </a>
        }
      >
        {data.length === 0 ? (
          <PageFeedbackCard
            title="暂无结果批次"
            description={
              <>
                请前往
                <Link href="/calc/upn-split" className="text-primary underline mx-1">
                  结果快照
                </Link>
                页面查看或生成快照版本
              </>
            }
          />
        ) : (
          <SummaryStatsGrid
            items={[
              { label: "批次数", value: overview.totalBatches },
              { label: "成功批次", value: overview.successBatches },
              { label: "部分异常批次", value: overview.partialBatches },
              { label: "最近月份批次", value: overview.latestPeriodRows },
            ]}
          />
        )}
      </SectionCard>

      <DataTable<CalcBatchTableRow>
        title="历史结果版本"
        columns={columns}
        data={data}
        searchKey="calculated_at"
        searchPlaceholder="搜索生成时间..."
        filters={[
          {
            key: "period_month",
            label: "月份",
            placeholder: "全部月份",
            options: overview.periods.map((value) => ({ label: value, value })),
          },
          {
            key: "status",
            label: "状态",
            placeholder: "全部状态",
            options: Array.from(new Set(data.map((row) => row.status)))
              .sort((a, b) => a.localeCompare(b))
              .map((value) => ({ label: value, value })),
          },
        ]}
        exportTable="calc_batch"
        exportParams={{}}
      />
    </div>
  );
}
