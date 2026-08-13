"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BaseTableActions } from "@/components/base-table-actions";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import { PageIntro } from "@/components/page-intro";
import { PageFeedbackCard } from "@/components/page-feedback-card";
import { PageLoadingCard } from "@/components/page-loading-card";
import { SectionCard } from "@/components/section-card";
import { MetaBadgeRow } from "@/components/meta-badge-row";
import { translateCalcStatus } from "@/lib/calc-status";
import { type CalcBatchTableRow, summarizeCalcBatchRows } from "@/lib/calc-batch-view";
import {
  type WeeklyCalcBatchTableRow,
  summarizeWeeklyCalcBatchRows,
} from "@/lib/weekly-calc-batch-view";

interface MonthlyCalcResponse {
  success: boolean;
  periodMonth: string;
  totalUpns: number;
  errorUpns: number;
  scopeCounts?: {
    lpPl5Scope: number;
    lpPl5Status: number;
    pl5UpnScope: number;
    lpPl5UpnStatus: number;
  };
}

interface WeeklyCalcResponse {
  success: boolean;
  periodMonth: string;
  calendarDate: string;
  strategy?: {
    monthQuotaStrategy: string;
  };
  summary: {
    totalRows: number;
    totalUpns: number;
    currentWeekPatternPct: number;
    monthLeAmount: number | null;
    actualAmount: number | null;
    weekPatternAmount: number | null;
    targetPendingAmount: number | null;
    suggestedAmountTotal: number | null;
    weekPatternGapAmount: number | null;
    weekPatternGapPct: number | null;
    overageThresholdPct: number;
    shortfallThresholdPct: number;
  };
  buSummaries: WeeklyBuSummary[];
}

interface WeeklyBuSummary {
  scBu: string;
  currentWeekPatternPct: number;
  monthLeAmount: number | null;
  actualAmount: number | null;
  weekPatternAmount: number | null;
  targetPendingAmount: number | null;
  suggestedAmountTotal: number | null;
  weekPatternGapAmount: number | null;
  weekPatternGapPct: number | null;
  overageThresholdPct: number;
  shortfallThresholdPct: number;
}

interface CalculationContext {
  calendarDate: string;
  periodMonth: string;
  monthStartDate: string;
  weekStartDate: string;
  weekEndDate: string;
  overageThresholdPct: number;
  shortfallThresholdPct: number;
  businessUnits: string[];
  buThresholds: Array<{
    scBu: string;
    overageThresholdPct: number;
    shortfallThresholdPct: number;
  }>;
}

interface UnifiedCalcResponse {
  success: boolean;
  calendarDate: string;
  periodMonth: string;
  context: CalculationContext;
  monthly: MonthlyCalcResponse;
  weekly: WeeklyCalcResponse;
}

type MonthlyCalcResult = MonthlyCalcResponse & {
  calculatedAt: string;
};

interface ResultSnapshotPageClientProps {
  initialMonthlyHistoryRows: CalcBatchTableRow[];
  initialWeeklyHistoryRows: WeeklyCalcBatchTableRow[];
  initialCalendarDate: string;
}

interface CalculationInputIssue {
  source: string;
  field: string;
  key: string;
  message: string;
}

const POC_PERIOD_MONTH = "2026-07-01";

function formatMetric(value: number | null) {
  if (value === null) return "-";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(4).replace(/\.?0+$/, "");
}

function formatPercentage(value: number | null) {
  return value === null ? "-" : `${formatMetric(value * 100)}%`;
}

function toDisplayTime(date: Date) {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function buildMonthlyHistoryRow(
  data: MonthlyCalcResponse,
  calculatedAt: string,
): CalcBatchTableRow {
  return {
    id: data.periodMonth,
    baseline_month: data.periodMonth,
    detail_href: `/calc/results/${data.periodMonth}`,
    trace_href: `/calc/trace/${data.periodMonth}`,
    period_month: data.periodMonth,
    status: data.errorUpns > 0 ? "PARTIAL" : "SUCCESS",
    total_upns: String(data.totalUpns),
    error_upns: String(data.errorUpns),
    calculated_at: calculatedAt,
  };
}

function ThresholdByBuTable({ rows }: { rows: CalculationContext["buThresholds"] }) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-[36rem] w-full text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th className="px-3 py-2 text-left font-medium">业务单元</th>
            <th className="px-3 py-2 text-right font-medium">超额缩减阈值</th>
            <th className="px-3 py-2 text-right font-medium">缺口补差阈值</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.scBu} className="border-t">
              <td className="px-3 py-2 font-medium">{row.scBu}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPercentage(row.overageThresholdPct)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPercentage(row.shortfallThresholdPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeeklyBuSummaryTable({ rows }: { rows: WeeklyBuSummary[] }) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-[78rem] w-full text-sm">
        <thead className="bg-muted/60">
          <tr>
            {[
              "业务单元",
              "CD",
              "CE (USD)",
              "CA (USD)",
              "CB (USD)",
              "CR (USD)",
              "AQ (USD)",
              "AR (USD)",
              "AS",
              "超额阈值",
              "补差阈值",
            ].map((label, index) => (
              <th key={label} className={`px-3 py-2 font-medium ${index === 0 ? "text-left" : "text-right"}`}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.scBu} className="border-t">
              <td className="px-3 py-2 font-medium">{row.scBu}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPercentage(row.currentWeekPatternPct)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatMetric(row.monthLeAmount)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatMetric(row.actualAmount)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatMetric(row.weekPatternAmount)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatMetric(row.targetPendingAmount)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatMetric(row.suggestedAmountTotal)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatMetric(row.weekPatternGapAmount)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPercentage(row.weekPatternGapPct)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPercentage(row.overageThresholdPct)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPercentage(row.shortfallThresholdPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultSnapshotPageClient({
  initialMonthlyHistoryRows,
  initialWeeklyHistoryRows,
  initialCalendarDate,
}: ResultSnapshotPageClientProps) {
  const router = useRouter();
  const [periodMonth, setPeriodMonth] = useState(POC_PERIOD_MONTH);
  const [calendarDate, setCalendarDate] = useState(initialCalendarDate);
  const [dateSaveError, setDateSaveError] = useState<string | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [unifiedLoading, setUnifiedLoading] = useState(false);
  const [calculationMode, setCalculationMode] = useState<"monthly" | "unified" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputIssues, setInputIssues] = useState<CalculationInputIssue[]>([]);
  const [monthlyResult, setMonthlyResult] = useState<MonthlyCalcResult | null>(null);
  const [result, setResult] = useState<UnifiedCalcResponse | null>(null);
  const [monthlyHistoryRows, setMonthlyHistoryRows] =
    useState<CalcBatchTableRow[]>(initialMonthlyHistoryRows);
  const [weeklyHistoryRows, setWeeklyHistoryRows] =
    useState<WeeklyCalcBatchTableRow[]>(initialWeeklyHistoryRows);
  const [isResetting, setIsResetting] = useState(false);
  const [contextPreview, setContextPreview] = useState<CalculationContext | null>(null);
  const activeContextPreview = contextPreview?.calendarDate === calendarDate ? contextPreview : null;

  const selectedPeriodMonth = useMemo(() => {
    if (activeContextPreview) {
      return activeContextPreview.periodMonth;
    }

    return weeklyHistoryRows.find((row) => row.calendar_date === calendarDate)?.period_month ?? null;
  }, [activeContextPreview, calendarDate, weeklyHistoryRows]);
  const activePeriodMonth = selectedPeriodMonth ?? periodMonth;

  const monthlyOverview = useMemo(
    () => summarizeCalcBatchRows(
      activePeriodMonth
        ? monthlyHistoryRows.filter((row) => row.period_month === activePeriodMonth)
        : [],
    ),
    [activePeriodMonth, monthlyHistoryRows],
  );
  const weeklyOverview = useMemo(
    () => summarizeWeeklyCalcBatchRows(
      weeklyHistoryRows.filter((row) => row.calendar_date === calendarDate),
    ),
    [calendarDate, weeklyHistoryRows],
  );
  const loading = monthlyLoading || unifiedLoading;

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) {
      return;
    }

    const controller = new AbortController();
    fetch("/api/calc/runtime-setting", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarDate }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "保存计算基准日失败");
        }
        setDateSaveError(null);
      })
      .catch((saveError) => {
        if (saveError instanceof DOMException && saveError.name === "AbortError") return;
        setDateSaveError(saveError instanceof Error ? saveError.message : "保存计算基准日失败");
      });

    return () => controller.abort();
  }, [calendarDate]);

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) {
      return;
    }

    const controller = new AbortController();
    fetch(`/api/calc/context?calendarDate=${encodeURIComponent(calendarDate)}`, {
      signal: controller.signal,
    })
      .then(async (response) => (response.ok ? (response.json() as Promise<CalculationContext>) : null))
      .then((context) => setContextPreview(context))
      .catch((previewError) => {
        if (previewError instanceof DOMException && previewError.name === "AbortError") return;
        setContextPreview(null);
      });

    return () => controller.abort();
  }, [calendarDate]);

  async function handleMonthlyRecalculate() {
    setMonthlyLoading(true);
    setCalculationMode("monthly");
    setError(null);
    setInputIssues([]);
    setMonthlyResult(null);
    setResult(null);

    try {
      const response = await fetch("/api/calc/upn-split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodMonth }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string; issues?: CalculationInputIssue[] };
        setInputIssues(err.issues ?? []);
        throw new Error(err.error || "月拆分计算失败");
      }

      const data: MonthlyCalcResponse = await response.json();
      const calculatedAt = toDisplayTime(new Date());

      setMonthlyResult({ ...data, calculatedAt });
      setMonthlyHistoryRows((prev) => [
        buildMonthlyHistoryRow(data, calculatedAt),
        ...prev.filter((row) => row.period_month !== data.periodMonth),
      ]);
      router.refresh();
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "月拆分计算失败");
    } finally {
      setMonthlyLoading(false);
    }
  }

  async function handleUnifiedRecalculate() {
    setUnifiedLoading(true);
    setCalculationMode("unified");
    setError(null);
    setInputIssues([]);
    setMonthlyResult(null);
    setResult(null);

    try {
      const response = await fetch("/api/calc/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarDate }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string; issues?: CalculationInputIssue[] };
        setInputIssues(err.issues ?? []);
        throw new Error(err.error || "统一计算失败");
      }

      const data: UnifiedCalcResponse = await response.json();
      const calculatedAt = toDisplayTime(new Date());

      setResult(data);
      setMonthlyHistoryRows((prev) => [
        buildMonthlyHistoryRow(data.monthly, calculatedAt),
        ...prev.filter((row) => row.period_month !== data.periodMonth),
      ]);
      setWeeklyHistoryRows((prev) => [
        {
          baseline_date: data.calendarDate,
          detail_href: `/calc/weekly-results/${data.calendarDate}`,
          period_month: data.periodMonth,
          calendar_date: data.calendarDate,
          status: "SUCCESS",
          total_rows: String(data.weekly.summary.totalRows),
          total_upns: String(data.weekly.summary.totalUpns),
          month_le_amount: formatMetric(data.weekly.summary.monthLeAmount),
          week_pattern_gap_pct:
            data.weekly.summary.weekPatternGapPct === null
              ? ""
              : String(data.weekly.summary.weekPatternGapPct),
          overage_threshold_pct: String(data.weekly.summary.overageThresholdPct),
          shortfall_threshold_pct: String(data.weekly.summary.shortfallThresholdPct),
          calculation_currency: "USD",
          usd_to_cny_rate: "",
          calculated_at: calculatedAt,
        },
        ...prev.filter((row) => row.calendar_date !== data.calendarDate),
      ]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "统一计算失败");
    } finally {
      setUnifiedLoading(false);
    }
  }

  async function handleResetTestData() {
    if (!window.confirm("确认清空月拆分与周拆分测试数据吗？该操作不会清理异常字典和结构表。")) {
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      const response = await fetch("/api/data/reset-test-data", {
        method: "POST",
      });
      const payload = (await response.json()) as { success?: boolean; message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "清空测试数据失败");
      }

      setMonthlyHistoryRows([]);
      setWeeklyHistoryRows([]);
      setMonthlyResult(null);
      setResult(null);
      setError(payload.message ?? null);
      router.refresh();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "清空测试数据失败");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="结果生成"
        description="月拆分和周拆分可以分开生成；只维护月拆分基础表时，可以先单独生成月拆分结果。"
      />

      <SectionCard
        title="整包维护"
        description="没有表单 CRUD 时，推荐直接使用统一整包模板维护月拆分和周拆分输入数据。整包中包含当前所有受支持的月、周输入表。"
        action={<BaseTableActions />}
        contentClassName="space-y-4"
      >
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>1. 下载统一整包模板，维护月拆分和周拆分所需的全部输入表。</p>
          <p>2. 使用“导入统一整包”一次性覆盖当前测试数据。</p>
          <p>3. 如需从零开始回归测试，可先清空测试数据，再导入整包。</p>
        </div>
      </SectionCard>

      <SectionCard
        title="月拆分计算"
        description="只重算指定业务月的月拆分结果，不依赖周历表和周拆分输入表。"
        contentClassName="space-y-4"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full max-w-xs">
            <label className="mb-1 block text-sm font-medium">业务月份</label>
            <Input
              type="text"
              value={periodMonth}
              onValueChange={setPeriodMonth}
              placeholder="YYYY-MM-DD"
            />
          </div>
          <Button onClick={handleMonthlyRecalculate} disabled={loading}>
            {monthlyLoading ? "月拆分计算中..." : "只生成月拆分结果"}
          </Button>
          <Link href="/calc/results">
            <Button variant="outline">查看月拆分结果</Button>
          </Link>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>1. 只需要维护月拆分输入表时，使用这个入口。</p>
          <p>2. 该入口不会读取周历表、周拆分输入表，也不会生成周拆分结果。</p>
          <p>3. 业务月份按月初日期输入，例如 2026-06-01。</p>
        </div>
      </SectionCard>

      <SectionCard
        title="统一计算"
        description="月拆分和周拆分数据都准备完成后，使用该入口按“先月后周”的顺序生成整套正式结果。"
        contentClassName="space-y-4"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full max-w-xs">
            <label className="mb-1 block text-sm font-medium">计算基准日</label>
            <Input
              type="date"
              value={calendarDate}
              onValueChange={setCalendarDate}
            />
            {dateSaveError ? (
              <p className="mt-1 text-xs text-destructive">{dateSaveError}</p>
            ) : null}
          </div>
          <Button
            onClick={handleUnifiedRecalculate}
            disabled={loading || !/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)}
          >
            {unifiedLoading ? "统一计算中..." : "生成月拆分 + 周拆分结果"}
          </Button>
          <Link href="/calc/results">
            <Button variant="outline">查看月拆分结果</Button>
          </Link>
          <Link href="/calc/weekly-results">
            <Button variant="outline">查看周拆分结果</Button>
          </Link>
        </div>

        {activeContextPreview ? (
          <div className="space-y-3">
            <SummaryStatsGrid
              items={[
                { label: "归属业务月", value: activeContextPreview.periodMonth },
                {
                  label: "归属业务周",
                  value: `${activeContextPreview.weekStartDate} 至 ${activeContextPreview.weekEndDate}`,
                },
                { label: "业务单元数", value: activeContextPreview.businessUnits.length },
              ]}
              columns={3}
            />
            <ThresholdByBuTable rows={activeContextPreview.buThresholds} />
          </div>
        ) : null}

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>1. 先维护月拆分输入页和周拆分输入页中的基础数据。</p>
          <p>2. 输入一个计算基准日，系统会根据周历表自动反查归属业务月和业务周。</p>
          <p>3. 点击一次“开始计算”，系统会串行执行“先月后周”的统一重算。</p>
        </div>
      </SectionCard>

      <SectionCard title="当前结果概览" description="当前正式结果的最新入口都集中在这里。">
        <SummaryStatsGrid
          items={[
            { label: "月拆分已生成月份数", value: monthlyOverview.totalBaselines },
            { label: "月拆分最新月份", value: monthlyOverview.latestPeriod ?? "-" },
            { label: "月拆分最近月份记录数", value: monthlyOverview.latestPeriodRows },
            { label: "周拆分已生成基准日数", value: weeklyOverview.totalBaselines },
            { label: "周拆分最新基准日", value: weeklyOverview.latestBatch?.calendar_date ?? "-" },
            { label: "周拆分成功基准日数", value: weeklyOverview.successBaselines },
          ]}
          columns={3}
        />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="当前月拆分结果"
          description="当前正式月拆分结果入口。"
          action={
            monthlyOverview.latestBatch ? (
              <div className="flex items-center gap-4 text-sm">
                <Link
                  href={monthlyOverview.latestBatch.detail_href}
                  className="whitespace-nowrap text-primary underline"
                >
                  打开结果页
                </Link>
                <Link
                  href={monthlyOverview.latestBatch.trace_href}
                  className="whitespace-nowrap text-primary underline"
                >
                  打开过程追踪
                </Link>
              </div>
            ) : undefined
          }
          contentClassName="space-y-4"
        >
          {monthlyOverview.latestBatch ? (
            <>
              <MetaBadgeRow
                items={[
                  { label: "最新月份", value: monthlyOverview.latestBatch.period_month, variant: "secondary" },
                  {
                    label: "状态",
                    value: translateCalcStatus(String(monthlyOverview.latestBatch.status ?? "")),
                    variant: "outline",
                  },
                ]}
              />
              <SummaryStatsGrid
                items={[
                  { label: "结果行数", value: monthlyOverview.latestBatch.total_upns },
                  { label: "异常行数", value: monthlyOverview.latestBatch.error_upns },
                  { label: "最后计算时间", value: monthlyOverview.latestBatch.calculated_at },
                ]}
                columns={3}
              />
            </>
          ) : (
            <PageFeedbackCard title="暂无月拆分结果" description="先执行一次月拆分计算或统一计算。" />
          )}
        </SectionCard>

        <SectionCard
          title="当前周拆分结果"
          description="当前正式周拆分结果入口。"
          action={
            weeklyOverview.latestBatch ? (
              <Link
                href={weeklyOverview.latestBatch.detail_href}
                className="whitespace-nowrap text-sm text-primary underline"
              >
                打开结果页
              </Link>
            ) : undefined
          }
          contentClassName="space-y-4"
        >
          {weeklyOverview.latestBatch ? (
            <>
              <MetaBadgeRow
                items={[
                  { label: "最新基准日", value: weeklyOverview.latestBatch.calendar_date, variant: "secondary" },
                  { label: "计算币种", value: weeklyOverview.latestBatch.calculation_currency || "USD", variant: "secondary" },
                  {
                    label: "状态",
                    value: translateCalcStatus(String(weeklyOverview.latestBatch.status ?? "")),
                    variant: "outline",
                  },
                ]}
              />
              <SummaryStatsGrid
                items={[
                  { label: "结果行数", value: weeklyOverview.latestBatch.total_rows },
                  { label: "SKU数", value: weeklyOverview.latestBatch.total_upns },
                  { label: "最后计算时间", value: weeklyOverview.latestBatch.calculated_at },
                ]}
                columns={3}
              />
            </>
          ) : (
            <PageFeedbackCard title="暂无周拆分结果" description="先在周拆分基础表准备完成后执行一次统一计算。" />
          )}
        </SectionCard>
      </div>

      {error ? (
        <PageFeedbackCard
          title={error.includes("已清空") ? error : `计算失败: ${error}`}
          description={
            error.includes("已清空")
              ? "当前月拆分与周拆分测试数据已被清理，可以重新导入整包或单表继续测试。"
              : calculationMode === "monthly"
                ? "请先确认月拆分输入表已经准备完成；单独跑月拆分时不需要周历表和周拆分输入表。"
                : "请先确认周历表、月拆分输入表和周拆分输入表都已经准备完成；只跑月拆分时请使用上方的月拆分计算入口。"
          }
          variant={error.includes("已清空") ? "default" : "destructive"}
        >
          {inputIssues.length > 0 ? (
            <div className="mt-4 max-h-72 overflow-auto rounded border bg-background text-left">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">来源</th>
                    <th className="px-3 py-2 text-left">字段</th>
                    <th className="px-3 py-2 text-left">定位键</th>
                    <th className="px-3 py-2 text-left">问题</th>
                  </tr>
                </thead>
                <tbody>
                  {inputIssues.map((issue, index) => (
                    <tr key={`${issue.source}-${issue.field}-${issue.key}-${index}`} className="border-t">
                      <td className="px-3 py-2">{issue.source}</td>
                      <td className="px-3 py-2 font-mono text-xs">{issue.field}</td>
                      <td className="px-3 py-2 font-mono text-xs">{issue.key}</td>
                      <td className="px-3 py-2">{issue.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </PageFeedbackCard>
      ) : null}

      {loading ? <PageLoadingCard /> : null}

      {monthlyResult ? (
        <SectionCard
          title="本次月拆分计算完成"
          description="月拆分结果已生成，周拆分结果不会在该入口中更新。"
          action={
            <div className="flex items-center gap-4 text-sm">
              <Link
                href={`/calc/results/${monthlyResult.periodMonth}`}
                className="whitespace-nowrap text-primary underline"
              >
                打开月拆分结果
              </Link>
              <Link
                href={`/calc/trace/${monthlyResult.periodMonth}`}
                className="whitespace-nowrap text-primary underline"
              >
                打开月拆分追踪
              </Link>
            </div>
          }
          contentClassName="space-y-4"
        >
          <MetaBadgeRow
            items={[
              { label: "业务月份", value: monthlyResult.periodMonth, variant: "secondary" },
              {
                label: "状态",
                value: translateCalcStatus(monthlyResult.errorUpns > 0 ? "PARTIAL" : "SUCCESS"),
                variant: "outline",
              },
              { label: "生成时间", value: monthlyResult.calculatedAt },
            ]}
          />
          <SummaryStatsGrid
            items={[
              { label: "月拆分结果行数", value: monthlyResult.totalUpns },
              { label: "月拆分异常行数", value: monthlyResult.errorUpns },
              { label: "LP-产品分类范围行数", value: monthlyResult.scopeCounts?.lpPl5Scope ?? "-" },
              { label: "LP-产品分类-SKU状态行数", value: monthlyResult.scopeCounts?.lpPl5UpnStatus ?? "-" },
            ]}
            columns={4}
          />
        </SectionCard>
      ) : null}

      {result ? (
        <SectionCard
          title="本次计算完成"
          description="统一计算已完成，你可以直接进入月拆分结果页和周拆分结果页继续核对。"
          action={
            <div className="flex items-center gap-4 text-sm">
              <Link
                href={`/calc/results/${result.periodMonth}`}
                className="whitespace-nowrap text-primary underline"
              >
                打开月拆分结果
              </Link>
              <Link
                href={`/calc/trace/${result.periodMonth}`}
                className="whitespace-nowrap text-primary underline"
              >
                打开月拆分追踪
              </Link>
              <Link
                href={`/calc/weekly-results/${result.calendarDate}`}
                className="whitespace-nowrap text-primary underline"
              >
                打开周拆分结果
              </Link>
            </div>
          }
          contentClassName="space-y-4"
        >
          <MetaBadgeRow
            items={[
              { label: "计算基准日", value: result.calendarDate, variant: "outline" },
              { label: "归属业务月", value: result.periodMonth, variant: "secondary" },
              { label: "业务周开始日", value: result.context.weekStartDate },
              { label: "业务周结束日", value: result.context.weekEndDate },
            ]}
          />
          <SummaryStatsGrid
            items={[
              { label: "月拆分结果行数", value: result.monthly.totalUpns },
              { label: "月拆分异常行数", value: result.monthly.errorUpns },
              { label: "周拆分结果行数", value: result.weekly.summary.totalRows },
              { label: "周拆分SKU数", value: result.weekly.summary.totalUpns },
              { label: "全部BU月目标合计(CE) USD", value: formatMetric(result.weekly.summary.monthLeAmount) },
              { label: "全部BU累计目标合计(CB) USD", value: formatMetric(result.weekly.summary.weekPatternAmount) },
              { label: "全部BU建议差额合计(AR) USD", value: formatMetric(result.weekly.summary.weekPatternGapAmount) },
            ]}
            columns={4}
          />
          <WeeklyBuSummaryTable rows={result.weekly.buSummaries} />
        </SectionCard>
      ) : null}
    </div>
  );
}
