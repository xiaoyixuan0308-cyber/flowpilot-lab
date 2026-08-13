import { FormulaMetric } from "@/components/formula/formula-metric";
import { MetaBadgeRow } from "@/components/meta-badge-row";
import { PageFeedbackCard } from "@/components/page-feedback-card";
import { PageIntro } from "@/components/page-intro";
import { WeeklyFinalAdjustmentTable } from "@/components/weekly-process/weekly-final-adjustment-table";
import {
  WeeklyStageTable,
  type WeeklyStageTableRow,
} from "@/components/weekly-process/weekly-stage-table";
import { WeeklyStageNavigation } from "@/components/weekly-process/weekly-stage-navigation";
import {
  buildWeeklyBatchFormulaTrace,
  buildWeeklyRowFormulaTraces,
  type WeeklyFormulaBatchSource,
  type WeeklyFormulaRowSource,
} from "@/lib/weekly-formula-trace";
import { WEEKLY_FORMULA_REGISTRY, type WeeklyFormulaCode } from "@/lib/weekly-formula-registry";
import { getWeeklyStageDefinition, type WeeklyStageSlug } from "@/lib/weekly-stage-registry";
import { getWeeklyCalcBatchDetail } from "@/server/repositories";

interface WeeklyStagePageProps {
  params: Promise<{ calendarDate: string; stage: string }>;
  searchParams: Promise<{ bu?: string; lp?: string; pl5?: string; upn?: string }>;
}

function serializeValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function serializeRow(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, serializeValue(value)]),
  ) as WeeklyFormulaRowSource;
}

const BATCH_TRACE_CODES = new Set<WeeklyFormulaCode>([
  "CD", "CE", "CA", "CB", "CR", "AQ", "AR", "AS", "RRC", "RD",
]);

export default async function WeeklyStagePage({ params, searchParams }: WeeklyStagePageProps) {
  const { calendarDate, stage: stageSlug } = await params;
  const filters = await searchParams;
  const stage = getWeeklyStageDefinition(stageSlug);
  const batch = await getWeeklyCalcBatchDetail(calendarDate);

  if (!stage || !batch) {
    return (
      <div className="space-y-6">
        <PageIntro title="周拆分计算" description={`${calendarDate} 的分阶段计算核验。`} />
        <PageFeedbackCard title={!stage ? "未知计算阶段。" : "未找到周拆分结果。"} />
      </div>
    );
  }

  const serializedRows = batch.results.map((row) => serializeRow(row as unknown as Record<string, unknown>));
  const sourceByBu = new Map(batch.bu_summaries.map((summary) => [summary.sc_bu, {
    current_week_pattern_pct: serializeValue(summary.current_week_pattern_pct),
    month_le_amount: serializeValue(summary.month_target_amount),
    actual_amount: serializeValue(summary.actual_amount),
    week_pattern_amount: serializeValue(summary.week_pattern_amount),
    target_pending_amount: serializeValue(summary.target_pending_amount),
    suggested_amount_total: serializeValue(summary.suggested_amount_total),
    week_pattern_gap_amount: serializeValue(summary.week_pattern_gap_amount),
    week_pattern_gap_pct: serializeValue(summary.week_pattern_gap_pct),
    overage_threshold_pct: String(summary.overage_threshold_pct),
    shortfall_threshold_pct: String(summary.shortfall_threshold_pct),
    system_default_final_amount_total: serializeValue(summary.system_default_final_amount_total),
    system_default_pattern_gap_amount: serializeValue(summary.system_default_pattern_gap_amount),
    final_amount_total: serializeValue(summary.final_amount_total),
    final_pattern_gap_amount: serializeValue(summary.final_pattern_gap_amount),
  } satisfies WeeklyFormulaBatchSource]));
  const tracedRows = batch.bu_summaries.flatMap((summary) => {
    const rows = serializedRows.filter((row) => row.sc_bu === summary.sc_bu);
    return buildWeeklyRowFormulaTraces(rows, sourceByBu.get(summary.sc_bu)!) as WeeklyStageTableRow[];
  });
  const query = new URLSearchParams();
  if (filters.bu) query.set("bu", filters.bu);
  if (filters.lp) query.set("lp", filters.lp);
  if (filters.pl5) query.set("pl5", filters.pl5);
  if (filters.upn) query.set("upn", filters.upn);
  const batchMetrics = batch.bu_summaries.flatMap((summary) => {
    const rows = serializedRows.filter((row) => row.sc_bu === summary.sc_bu);
    const source = sourceByBu.get(summary.sc_bu)!;
    return stage.batchMetrics
      .filter((code) => BATCH_TRACE_CODES.has(code))
      .map((code) => ({
        scBu: summary.sc_bu,
        trace: buildWeeklyBatchFormulaTrace(
          code as Parameters<typeof buildWeeklyBatchFormulaTrace>[0],
          rows,
          source,
        ),
      }));
  });

  return (
    <div className="space-y-6">
      <PageIntro
        title={stage.title}
        description={`${calendarDate} 周拆分正式结果。`}
        breadcrumbs={[
          { label: "周拆分计算", href: `/calc/weekly-process/${calendarDate}${query.toString() ? `?${query}` : ""}` },
          { label: stage.title },
        ]}
      />
      <WeeklyStageNavigation
        calendarDate={calendarDate}
        currentSlug={stage.slug as WeeklyStageSlug}
        query={query.toString()}
        compact
      />
      <MetaBadgeRow
        items={[
          { label: "粒度", value: stage.granularity, variant: "outline" },
          { label: "业务单元数", value: batch.bu_summaries.length, variant: "secondary" },
          { label: "金额与阈值口径", value: "按业务单元独立", variant: "secondary" },
        ]}
      />
      {batchMetrics.length > 0 && stage.slug !== "final-adjustment" && (
        <div className="grid gap-4 border-y py-4 md:grid-cols-2 xl:grid-cols-4">
          {batchMetrics.map(({ scBu, trace }) => (
            <FormulaMetric
              key={`${scBu}-${trace.code}`}
              trace={trace}
              label={`${scBu} ${WEEKLY_FORMULA_REGISTRY[trace.code].name}`}
            />
          ))}
        </div>
      )}
      {stage.slug === "final-adjustment" && tracedRows.length === 0 ? (
        <PageFeedbackCard title="当前周批次没有结果行。" />
      ) : stage.slug === "final-adjustment" ? (
        <WeeklyFinalAdjustmentTable
          calendarDate={calendarDate}
          batchId={batch.id}
          buSummaries={batch.bu_summaries.map((summary) => ({
            scBu: summary.sc_bu,
            targetPendingAmount: serializeValue(summary.target_pending_amount),
            systemDefaultFinalAmountTotal: serializeValue(summary.system_default_final_amount_total),
            systemDefaultPatternGapAmount: serializeValue(summary.system_default_pattern_gap_amount),
          }))}
          rows={tracedRows as Parameters<typeof WeeklyFinalAdjustmentTable>[0]["rows"]}
          initialFilters={filters}
        />
      ) : (
        <WeeklyStageTable
          calendarDate={calendarDate}
          title={stage.title}
          fields={[...stage.fields]}
          rows={tracedRows}
          initialFilters={filters}
        />
      )}
    </div>
  );
}
