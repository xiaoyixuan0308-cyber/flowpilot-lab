"use client";

import { useCallback, useEffect, useState } from "react";
import { PageIntro } from "@/components/page-intro";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import { SectionCard } from "@/components/section-card";
import { ChartCard } from "@/components/charts/chart-card";
import { LineChart } from "@/components/charts/line-chart";
import type { LineChartSeries } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import type { BarChartSeries } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import type { DonutChartSegment } from "@/components/charts/donut-chart";
import { DataTable } from "@/components/data-table";
import type { Column } from "@/components/data-table";
import { RefreshCw } from "lucide-react";

/* ---------- types ---------- */

interface OdsTrendData {
  periods: string[];
  series: Record<string, number[]>;
  seriesLabels?: Record<string, string>;
}

interface PipelineRow {
  upn: string;
  pl5Code: string;
  dealerlpcode: string;
  p: number;
  q: number;
  r: number;
  s: number;
}

interface WeeklyPipelineRow {
  upn: string;
  pl5Code: string;
  lpCode: string;
  ad: number;
  sa: number;
  ra: number;
  rra: number;
}

interface ErrorData {
  errorRate: { total: number; errors: number; rate: number };
  distribution: { message: string; count: number }[];
  anomalyUpns: {
    dealerlpcode: string;
    upn: string;
    pl5_code: string;
    error_message: string;
    s_tolerance_replenish: number;
    t_adjusted_dioh: number;
  }[];
  diohWarnings: {
    dealerlpcode: string;
    upn: string;
    pl5_code: string;
    current_dioh: number;
    t_adjusted_dioh: number;
  }[];
}

interface SummaryData {
  monthlyStatusCounts: { SUCCESS: number; PARTIAL: number; FAILED: number; total: number };
  avgDioh: number | null;
  avgAdjustedDioh: number | null;
}

interface PatternGapPoint {
  period: string;
  weekPatternAmount: number;
  actualAmount: number;
  suggestedAmountTotal: number;
  weekPatternGapAmount: number;
  weekPatternGapPct: number | null;
  finalAmountTotal: number;
  finalPatternGapAmount: number;
  currency: string;
}

interface PatternGapData {
  granularity: "week" | "month";
  data: PatternGapPoint[];
  latest: PatternGapPoint | null;
  summary: {
    periods: number;
    weekPatternAmount: number;
    finalAmountTotal: number;
    finalPatternGapAmount: number;
  };
}

interface Props {
  periodMonths: string[];
  calendarDates: string[];
  latestPeriodMonth: string | null;
  latestCalendarDate: string | null;
}

/* ---------- helpers ---------- */

function topNSeries(series: Record<string, number[]>, n: number) {
  const totals = Object.entries(series).map(([key, vals]) => ({
    key,
    total: vals.reduce((a, b) => a + b, 0),
  }));
  totals.sort((a, b) => b.total - a.total);
  return new Set(totals.slice(0, n).map((t) => t.key));
}

const dashboardRequestCache = new Map<string, Promise<unknown>>();

async function fetchDashboardJson(url: string, refresh = false) {
  if (refresh) dashboardRequestCache.delete(url);
  const cached = dashboardRequestCache.get(url);
  if (cached) return cached;

  const request = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    })
    .catch((error) => {
      dashboardRequestCache.delete(url);
      throw error;
    });
  dashboardRequestCache.set(url, request);
  return request;
}

/* ---------- chart column indices ---------- */

const PIPELINE_BAR_SERIES: BarChartSeries[] = [
  { key: "p", name: "P 理论补货" },
  { key: "q", name: "Q 实际理论" },
  { key: "r", name: "R 基础补货" },
  { key: "s", name: "S 容差补货" },
];

const WEEKLY_PIPELINE_BAR_SERIES: BarChartSeries[] = [
  { key: "ad", name: "AD 建议量" },
  { key: "sa", name: "SA 系统调整" },
  { key: "ra", name: "RA 缺口补差" },
  { key: "rra", name: "RRA 最终量" },
];

/* ---------- anomaly table columns ---------- */

const ANOMALY_COLUMNS: Column<ErrorData["anomalyUpns"][number]>[] = [
  { key: "dealerlpcode", header: "LP编码" },
  { key: "upn", header: "SKU" },
  { key: "pl5_code", header: "产品分类" },
  { key: "error_message", header: "异常信息" },
  {
    key: "s_tolerance_replenish",
    header: "S 容差补货",
    render: (row) =>
      row.s_tolerance_replenish.toLocaleString(undefined, { maximumFractionDigits: 2 }),
  },
  {
    key: "t_adjusted_dioh",
    header: "调整后库存天数",
    render: (row) =>
      row.t_adjusted_dioh.toLocaleString(undefined, { maximumFractionDigits: 1 }),
  },
];

const 库存天数_COLUMNS: Column<ErrorData["diohWarnings"][number]>[] = [
  { key: "dealerlpcode", header: "LP编码" },
  { key: "pl5_code", header: "产品分类" },
  { key: "upn", header: "SKU" },
  {
    key: "t_adjusted_dioh",
    header: "调整后库存天数",
    render: (row) =>
      row.t_adjusted_dioh.toLocaleString(undefined, { maximumFractionDigits: 1 }),
  },
];

/* ---------- component ---------- */

export function DashboardClient({
  periodMonths,
  calendarDates,
  latestPeriodMonth,
  latestCalendarDate,
}: Props) {
  const [periodMonth, setPeriodMonth] = useState(latestPeriodMonth ?? "");
  const [calendarDate, setCalendarDate] = useState(latestCalendarDate ?? "");
  const [timeSpan, setTimeSpan] = useState<"week" | "month">("week");

  /* data state */
  const [t2Data, setT2Data] = useState<OdsTrendData | null>(null);
  const [invData, setInvData] = useState<OdsTrendData | null>(null);
  const [fcstLpData, setFcstLpData] = useState<OdsTrendData | null>(null);
  const [fcstT2Data, setFcstT2Data] = useState<OdsTrendData | null>(null);
  const [buData, setBuData] = useState<OdsTrendData | null>(null);
  const [allocData, setAllocData] = useState<OdsTrendData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineRow[]>([]);
  const [weeklyPipeline, setWeeklyPipeline] = useState<WeeklyPipelineRow[]>([]);
  const [errors, setErrors] = useState<ErrorData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [patternGap, setPatternGap] = useState<PatternGapData | null>(null);
  const [dnData, setDnData] = useState<OdsTrendData | null>(null);
  const [openOrderData, setOpenOrderData] = useState<{ data: { name: string; value: number }[] } | null>(null);
  const [bscInvData, setBscInvData] = useState<{ data: { name: string; value: number }[] } | null>(null);
  const [bscTransitData, setBscTransitData] = useState<OdsTrendData | null>(null);
  const [safetyStockData, setSafetyStockData] = useState<{ data: { name: string; value: number }[] } | null>(null);
  const [priceData, setPriceData] = useState<{ data: { name: string; value: number }[] } | null>(null);
  const [calendarPatternData, setCalendarPatternData] = useState<OdsTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchAll = useCallback(async (refresh = false) => {
    setLoading(true);
    setLoadError(null);

    const safeFetch = (url: string) => fetchDashboardJson(url, refresh);

    try {
      const base = "/api/calc/viz";
      const results = await Promise.allSettled([
        safeFetch(`${base}/ods-trends?type=t2-purchase`),
        safeFetch(`${base}/ods-trends?type=inventory`),
        safeFetch(`${base}/ods-trends?type=fcst-lp-pl5`),
        safeFetch(`${base}/ods-trends?type=fcst-t2-pl5`),
        safeFetch(`${base}/ods-trends?type=bu-amount&time_span=${timeSpan}`),
        safeFetch(`${base}/ods-trends?type=allocation`),
        safeFetch(`${base}/summary`),
        safeFetch(`${base}/ods-trends?type=dealer-dn`),
        safeFetch(`${base}/ods-trends?type=dealer-open-order`),
        safeFetch(`${base}/ods-trends?type=bsc-inventory`),
        safeFetch(`${base}/ods-trends?type=bsc-intransit`),
        safeFetch(`${base}/ods-trends?type=safety-stock`),
        safeFetch(`${base}/ods-trends?type=purchase-price`),
        safeFetch(`${base}/ods-trends?type=calendar-pattern`),
        periodMonth
          ? safeFetch(`${base}/pipeline?period_month=${periodMonth}`)
          : Promise.resolve({ data: [] }),
        periodMonth
          ? safeFetch(`${base}/errors?period_month=${periodMonth}`)
          : Promise.resolve(null),
        calendarDate
          ? safeFetch(`${base}/weekly-pipeline?calendar_date=${calendarDate}`)
          : Promise.resolve({ data: [], buSummaries: [] }),
        safeFetch(
          `${base}/pattern-gap?time_span=${timeSpan}` +
            (periodMonth ? `&period_month=${periodMonth}` : ""),
        ),
      ]);

      const [t2, inv, fcstLp, fcstT2, bu, alloc, sum, dn, openOrd, bscInv, bscTrans, sfStock, price, calPattern, pipe, err, weekly, gap] = results;

      if (t2.status === "fulfilled") setT2Data(t2.value);
      if (inv.status === "fulfilled") setInvData(inv.value);
      if (fcstLp.status === "fulfilled") setFcstLpData(fcstLp.value);
      if (fcstT2.status === "fulfilled") setFcstT2Data(fcstT2.value);
      if (bu.status === "fulfilled") setBuData(bu.value);
      if (alloc.status === "fulfilled") setAllocData(alloc.value);
      if (sum.status === "fulfilled") setSummary(sum.value);
      if (dn.status === "fulfilled") setDnData(dn.value);
      if (openOrd.status === "fulfilled") setOpenOrderData(openOrd.value);
      if (bscInv.status === "fulfilled") setBscInvData(bscInv.value);
      if (bscTrans.status === "fulfilled") setBscTransitData(bscTrans.value);
      if (sfStock.status === "fulfilled") setSafetyStockData(sfStock.value);
      if (price.status === "fulfilled") setPriceData(price.value);
      if (calPattern.status === "fulfilled") setCalendarPatternData(calPattern.value);
      if (pipe.status === "fulfilled") setPipeline(pipe.value.data ?? []);
      if (err.status === "fulfilled" && err.value) setErrors(err.value);
      if (weekly.status === "fulfilled") setWeeklyPipeline(weekly.value.data ?? []);
      if (gap.status === "fulfilled") setPatternGap(gap.value);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [periodMonth, calendarDate, timeSpan]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAll]);

  /* ---------- build chart data ---------- */

  const buildLineData = (data: OdsTrendData | null, topN = 5) => {
    if (!data || data.periods.length === 0) return null;
    const top = topNSeries(data.series, topN);
    return data.periods.map((p, i) => {
      const point: Record<string, unknown> = { period: p };
      for (const [key, vals] of Object.entries(data.series)) {
        if (top.has(key)) point[key] = vals[i];
      }
      return point;
    });
  };

  const buildLineSeries = (data: OdsTrendData | null, topN = 5): LineChartSeries[] => {
    if (!data) return [];
    const top = topNSeries(data.series, topN);
    return Array.from(top).map((key) => ({
      key,
      name: data.seriesLabels?.[key] || key,
    }));
  };

  /* ---------- KPI cards ---------- */

  const kpiItems = [
    {
      label: "周配额总金额",
      value: patternGap?.latest
        ? `${patternGap.latest.weekPatternAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${patternGap.latest.currency}`
        : "-",
    },
    {
      label: "目标差额",
      value:
        patternGap?.latest?.weekPatternGapPct == null
          ? "-"
          : `${(patternGap.latest.weekPatternGapPct * 100).toFixed(2)}%`,
    },
    {
      label: "最终建议金额",
      value: patternGap?.latest
        ? patternGap.latest.finalAmountTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : "-",
    },
    { label: "错误率", value: errors ? `${errors.errorRate.rate}%` : "-" },
    { label: "调整后库存天数", value: summary?.avgAdjustedDioh ?? "-" },
  ];

  /* ---------- error donut ---------- */

  const errorDonutData: DonutChartSegment[] =
    errors?.distribution.map((d) => ({
      name: d.message.length > 20 ? d.message.slice(0, 20) + "..." : d.message,
      value: d.count,
    })) ?? [];

  const isAllEmpty =
    !loading &&
    !t2Data &&
    !invData &&
    !fcstLpData &&
    !fcstT2Data &&
    !buData &&
    !allocData &&
    pipeline.length === 0 &&
    weeklyPipeline.length === 0;

  return (
    <div className="space-y-6">
      <PageIntro
        title="数据可视化图表"
        description="覆盖 ODS 趋势、补货管线对比、异常检测与周配货全链路可视化。"
        breadcrumbs={[{ label: "计算", href: "/calc/upn-split" }, { label: "仪表板" }]}
      />

      {/* ---- filters ---- */}
      <SectionCard title="筛选条件">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">统计跨度</span>
            <div className="inline-flex h-9 overflow-hidden rounded-md border bg-background">
              {(["week", "month"] as const).map((span) => (
                <button
                  key={span}
                  type="button"
                  className={`px-4 text-sm transition-colors ${
                    timeSpan === span
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setTimeSpan(span)}
                >
                  {span === "week" ? "按周" : "按月"}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">月度</span>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
            >
              <option value="">-- 全部 --</option>
              {periodMonths.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">周度</span>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={calendarDate}
              onChange={(e) => setCalendarDate(e.target.value)}
            >
              <option value="">-- 全部 --</option>
              {calendarDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground hover:opacity-90"
            onClick={() => void fetchAll(true)}
            disabled={loading}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "加载中..." : "刷新"}
          </button>
        </div>
      </SectionCard>

      {/* ---- KPI ---- */}
      <SummaryStatsGrid items={kpiItems} columns={5} />

      {loadError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          加载失败：{loadError}
        </div>
      )}

      {!loading && isAllEmpty && (
        <div className="py-12 text-center text-muted-foreground">
          暂无数据，请先导入 ODS 数据并触发计算。
        </div>
      )}

      {!isAllEmpty && (
        <>
          {/* ======== 月拆分输入 ======== */}
          <SectionCard title="月度规划输入" description="月度补货规划相关的基础数据趋势">
            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard title="T2采购历史趋势" dim="产品分类" description="按月汇总采购量，Top 5" isLoading={loading} isEmpty={!t2Data}>
                {buildLineData(t2Data) && <LineChart data={buildLineData(t2Data)!} xKey="period" series={buildLineSeries(t2Data)} height={280} />}
              </ChartCard>
              <ChartCard title="库存变化趋势" dim="LP" description="按月汇总经销商库存量，Top 5" isLoading={loading} isEmpty={!invData}>
                {buildLineData(invData) && <LineChart data={buildLineData(invData)!} xKey="period" series={buildLineSeries(invData)} height={280} />}
              </ChartCard>
              <ChartCard title="LP-产品分类预测趋势" dim="产品分类" description="按月汇总预测数量，Top 5" isLoading={loading} isEmpty={!fcstLpData}>
                {buildLineData(fcstLpData) && <LineChart data={buildLineData(fcstLpData)!} xKey="period" series={buildLineSeries(fcstLpData)} height={280} />}
              </ChartCard>
              <ChartCard title="T2-产品分类预测趋势" dim="产品分类" description="按月汇总预测数量，Top 5" isLoading={loading} isEmpty={!fcstT2Data}>
                {buildLineData(fcstT2Data) && <LineChart data={buildLineData(fcstT2Data)!} xKey="period" series={buildLineSeries(fcstT2Data)} height={280} />}
              </ChartCard>
            </div>
          </SectionCard>

          {/* ======== 周拆分输入 ======== */}
          <SectionCard title="周度执行输入" description="周度配货执行相关的基础数据概览">
            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard title="周历与周配比" dim="BU" description="上周配比 vs 当前周配比趋势" isLoading={loading} isEmpty={!calendarPatternData}>
                {calendarPatternData && calendarPatternData.periods.length > 0 && (
                  <LineChart data={calendarPatternData.periods.map((p, i) => ({ period: p, prev_week: calendarPatternData.series.prev_week_pattern_pct?.[i] ?? 0, curr_week: calendarPatternData.series.current_week_pattern_pct?.[i] ?? 0 }))} xKey="period" series={[{ key: "prev_week", name: "上周配比", color: "#eb6834" }, { key: "curr_week", name: "当前周配比", color: "#2a78d6" }]} height={280} />
                )}
              </ChartCard>
              <ChartCard title="BU周金额趋势" dim="BU" description="累计实际金额 vs 月目标金额" isLoading={loading} isEmpty={!buData}>
                {buData && buData.periods.length > 0 && (
                  <LineChart data={buData.periods.map((p, i) => ({ period: p, actual_amount: buData.series.actual_amount?.[i] ?? 0, month_target_amount: buData.series.month_target_amount?.[i] ?? 0 }))} xKey="period" series={[{ key: "actual_amount", name: "实际金额", color: "#2a78d6" }, { key: "month_target_amount", name: "月目标金额", color: "#eb6834" }]} height={280} />
                )}
              </ChartCard>
              <ChartCard title="经销商发货记录" dim="SKU" description="按日期汇总发货量，Top 5" isLoading={loading} isEmpty={!dnData}>
                {buildLineData(dnData) && <LineChart data={buildLineData(dnData)!} xKey="period" series={buildLineSeries(dnData)} height={280} />}
              </ChartCard>
              <ChartCard title="经销商未清订单" dim="SKU" description="按SKU汇总未清订单量" isLoading={loading} isEmpty={!openOrderData || openOrderData.data.length === 0}>
                {openOrderData && openOrderData.data.length > 0 && <BarChart data={openOrderData.data.map((d) => ({ name: d.name, value: d.value }))} xKey="name" series={[{ key: "value", name: "未清订单量" }]} />}
              </ChartCard>
              <ChartCard title="BSC库存" dim="SKU" description="按SKU汇总BSC可用库存量" isLoading={loading} isEmpty={!bscInvData || bscInvData.data.length === 0}>
                {bscInvData && bscInvData.data.length > 0 && <BarChart data={bscInvData.data.map((d) => ({ name: d.name, value: d.value }))} xKey="name" series={[{ key: "value", name: "库存量" }]} />}
              </ChartCard>
              <ChartCard title="BSC在途库存" dim="SKU" description="按日期汇总在途库存量，Top 5" isLoading={loading} isEmpty={!bscTransitData}>
                {buildLineData(bscTransitData) && <LineChart data={buildLineData(bscTransitData)!} xKey="period" series={buildLineSeries(bscTransitData)} height={280} />}
              </ChartCard>
              <ChartCard title="安全库存" dim="SKU" description="按SKU安全库存量" isLoading={loading} isEmpty={!safetyStockData || safetyStockData.data.length === 0}>
                {safetyStockData && safetyStockData.data.length > 0 && <BarChart data={safetyStockData.data.map((d) => ({ name: d.name, value: d.value }))} xKey="name" series={[{ key: "value", name: "安全库存量" }]} />}
              </ChartCard>
              <ChartCard title="LP-SKU单价" dim="SKU" description="按SKU标准售价" isLoading={loading} isEmpty={!priceData || priceData.data.length === 0}>
                {priceData && priceData.data.length > 0 && <BarChart data={priceData.data.map((d) => ({ name: d.name, value: d.value }))} xKey="name" series={[{ key: "value", name: "单价" }]} />}
              </ChartCard>
            </div>
          </SectionCard>

          {/* ======== 结果 ======== */}
          <SectionCard title="结果" description="计算结果、补货管线与异常分析">
            <div className="space-y-6">
              <SectionCard title="月度补货管线" dim="产品" description="补货缺口、理论补货、基础补货与调剂补货的阶段数量对比，按最终调剂补货量降序">
                {pipeline.length > 0 && (
                  <BarChart data={pipeline.map((r) => ({ label: `${r.upn}\n${r.pl5Code}`, upn: r.upn, p: r.p, q: r.q, r: r.r, s: r.s }))} xKey="upn" series={PIPELINE_BAR_SERIES} height={350} minBarWidth={18} />
                )}
              </SectionCard>
              <SectionCard title="周配货管线" dim="产品" description="建议补货、缩减调整、金额补差与最终发货的阶段数量对比，按最终发货量降序">
                {weeklyPipeline.length > 0 && (
                  <BarChart data={weeklyPipeline.map((r) => ({ label: `${r.upn}\n${r.pl5Code}`, upn: r.upn, ad: r.ad, sa: r.sa, ra: r.ra, rra: r.rra }))} xKey="upn" series={WEEKLY_PIPELINE_BAR_SERIES} height={350} minBarWidth={18} />
                )}
              </SectionCard>
              <SectionCard
                title="目标差额查询与统计"
                description={`${timeSpan === "week" ? "按周" : "按月"}展示目标待发金额、建议金额与最终差额`}
              >
                {patternGap && patternGap.data.length > 0 ? (
                  <LineChart
                    data={patternGap.data.map((row) => ({
                      period: row.period,
                      target: row.weekPatternAmount,
                      suggested: row.suggestedAmountTotal,
                      finalGap: row.finalPatternGapAmount,
                    }))}
                    xKey="period"
                    series={[
                      { key: "target", name: "周配额目标金额", color: "#2a78d6" },
                      { key: "suggested", name: "建议金额", color: "#198754" },
                      { key: "finalGap", name: "最终目标差额", color: "#eb6834" },
                    ]}
                    height={320}
                  />
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                    暂无目标差额计算结果
                  </div>
                )}
              </SectionCard>
              <div className="grid gap-6 md:grid-cols-2">
                <ChartCard title="月度异常占比" description={errorDonutData.length === 0 ? "无异常" : undefined} isLoading={loading} isEmpty={false}>
                  {errorDonutData.length > 0 ? (
                    <DonutChart data={errorDonutData} height={280} centerLabel={String(errors?.errorRate.errors ?? 0)} />
                  ) : (
                    <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: 280 }}>无异常</div>
                  )}
                </ChartCard>
                <ChartCard title="周度异常占比" description="无异常" isLoading={loading} isEmpty={false}>
                  <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: 280 }}>无异常</div>
                </ChartCard>
              </div>
              {errors && errors.diohWarnings.length > 0 && (
                <SectionCard title="库存天数 < 30 告警 SKU" description="当前库存天数不足30天的SKU">
                  <DataTable title="库存天数告警SKU" data={errors.diohWarnings as unknown as Record<string, unknown>[]} columns={库存天数_COLUMNS as unknown as Column<Record<string, unknown>>[]} searchKey="upn" />
                </SectionCard>
              )}
              {errors && errors.anomalyUpns.length > 0 && (
                <SectionCard title="异常SKU明细" description="月度计算中被标记为异常的所有SKU行">
                  <DataTable title="异常SKU明细" data={errors.anomalyUpns as unknown as Record<string, unknown>[]} columns={ANOMALY_COLUMNS as unknown as Column<Record<string, unknown>>[]} searchKey="upn" />
                </SectionCard>
              )}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
