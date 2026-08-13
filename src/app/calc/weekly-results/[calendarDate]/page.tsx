import Link from "next/link";
import { DataTable, type Column } from "@/components/data-table";
import { MetaBadgeRow } from "@/components/meta-badge-row";
import { PageFeedbackCard } from "@/components/page-feedback-card";
import { PageIntro } from "@/components/page-intro";
import { SectionCard } from "@/components/section-card";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import { translateCalcStatus } from "@/lib/calc-status";
import { getCalcResultNameLookup, getWeeklyCalcBatchDetail } from "@/server/repositories";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { multiply10 } from "@/server/services/calc/calculation-decimal";

interface WeeklyBatchDetailPageProps {
  params: Promise<{ calendarDate: string }>;
  searchParams: Promise<{ currency?: string; bu?: string; lp?: string; pl5?: string; upn?: string }>;
}

type WeeklyResultRow = {
  sc_bu: string;
  lp_code: string;
  lp_name: string;
  pl5_code: string;
  pl5_name: string;
  upn: string;
  month_quota_qty: string;
  current_week_pattern_pct: string;
  aa_month_delivered_suggestion_pct: string;
  ab_current_inventory_days: string;
  bb_upn_abc_class: string;
  be_original_target_inventory_qty: string;
  bf_current_inventory_qty: string;
  bj_t2_purchase_3m_avg_qty: string;
  cc_prev_week_pattern_pct: string;
  g_week_quota_pattern_total_qty: string;
  month_le_amount: string;
  actual_amount: string;
  week_pattern_amount: string;
  target_pending_amount: string;
  month_delivered_qty: string;
  n_other_dealer_month_delivered_qty: string;
  o_month_delivered_total_qty: string;
  open_order_or_qty: string;
  other_dealer_open_order_or_qty: string;
  s_open_order_or_total_qty: string;
  t_open_order_non_or_qty: string;
  v_other_dealer_open_order_non_or_qty: string;
  w_open_order_non_or_total_qty: string;
  x_open_order_total_qty: string;
  bsc_inventory_qty: string;
  intransit_qty: string;
  safety_stock_qty: string;
  bsc_available_qty: string;
  week_quota_pattern_qty: string;
  week_target_pending_qty: string;
  week_target_pending_total_qty: string;
  inventory_status: string;
  suggest_qty: string;
  remaining_bsc_available_qty: string;
  target_inventory_adjustable_qty: string;
  post_suggest_dioh: string;
  unit_price: string;
  suggest_amount: string;
  system_adjusted_suggest_qty: string;
  upn_month_cap_qty: string;
  constraint_types: string;
  adjustment_allowed_flag: string;
  monthly_remaining_adjustable_qty: string;
  bundle_qty: string;
  gap_fill_qty: string;
  post_gap_fill_qty: string;
  system_default_final_qty: string;
  manual_final_qty: string;
  final_qty: string;
  final_amount: string;
  final_amount_total: string;
  final_pattern_gap_amount: string;
  suggested_amount_total: string;
  week_pattern_gap_amount: string;
  week_pattern_gap_pct: string;
  overage_threshold_pct: string;
  shortfall_threshold_pct: string;
  system_default_final_amount_total: string;
  system_default_pattern_gap_amount: string;
};

const baseColumns: Column<WeeklyResultRow>[] = [
  { key: "sc_bu", header: "业务单元" },
  // { key: "lp_code", header: "LP Code" },
  { key: "lp_name", header: "LP名称" },
  // { key: "pl5_code", header: "产品分类 Code" },
  { key: "pl5_name", header: "产品分类名称" },
  { key: "upn", header: "SKU" },
  { key: "month_quota_qty", header: "月建议量(H_row)" },
  { key: "cc_prev_week_pattern_pct", header: "上周配比(CC)" },
  { key: "current_week_pattern_pct", header: "累计配比(CD)" },
  { key: "aa_month_delivered_suggestion_pct", header: "已发占比(AA)" },
  { key: "ab_current_inventory_days", header: "当前库存天数(AB)" },
  { key: "bb_upn_abc_class", header: "ABC类型(BB)" },
  { key: "be_original_target_inventory_qty", header: "目标期末库存(BE)" },
  { key: "bf_current_inventory_qty", header: "当前库存(BF)" },
  { key: "bj_t2_purchase_3m_avg_qty", header: "T2采购3月均量(BJ)" },
  { key: "month_le_amount", header: "月LE金额(CE)" },
  { key: "actual_amount", header: "累计实际金额(CA)" },
  { key: "week_pattern_amount", header: "累计目标金额(CB)" },
  { key: "target_pending_amount", header: "累计待发金额(CR)" },
  { key: "month_delivered_qty", header: "LP本月已发量(L)" },
  { key: "n_other_dealer_month_delivered_qty", header: "其他Dealer已发量(N)" },
  { key: "o_month_delivered_total_qty", header: "SKU已发总量(O)" },
  { key: "open_order_or_qty", header: "LP OR订单(P)" },
  { key: "other_dealer_open_order_or_qty", header: "非LP OR订单(R)" },
  { key: "s_open_order_or_total_qty", header: "OR订单总量(S)" },
  { key: "t_open_order_non_or_qty", header: "LP非OR订单(T)" },
  { key: "v_other_dealer_open_order_non_or_qty", header: "非LP非OR订单(V)" },
  { key: "w_open_order_non_or_total_qty", header: "非OR订单总量(W)" },
  { key: "x_open_order_total_qty", header: "订单总量(X)" },
  { key: "g_week_quota_pattern_total_qty", header: "累计目标总量(G)" },
  { key: "bsc_inventory_qty", header: "BSC库存(YA)" },
  { key: "intransit_qty", header: "在途量(YB)" },
  { key: "safety_stock_qty", header: "安全库存(YC)" },
  { key: "bsc_available_qty", header: "可用库存(Y)" },
  { key: "week_quota_pattern_qty", header: "累计目标量(J)" },
  { key: "week_target_pending_qty", header: "LP待发量(JA)" },
  { key: "week_target_pending_total_qty", header: "SKU待发总量(JB)" },
  { key: "inventory_status", header: "库存状态(Z)" },
  { key: "suggest_qty", header: "建议补货量(AD)" },
  { key: "remaining_bsc_available_qty", header: "剩余BSC库存(BH)" },
  { key: "target_inventory_adjustable_qty", header: "库存可调上限(BI)" },
  { key: "post_suggest_dioh", header: "补货后库存天数(BK)" },
  { key: "unit_price", header: "采购单价(AM)" },
  { key: "suggest_amount", header: "建议金额(AO)" },
  { key: "suggested_amount_total", header: "建议金额合计(AQ)" },
  { key: "week_pattern_gap_amount", header: "建议差额(AR)" },
  { key: "week_pattern_gap_pct", header: "建议差额占比(AS)" },
  { key: "overage_threshold_pct", header: "超额缩减阈值" },
  { key: "shortfall_threshold_pct", header: "缺口补差阈值" },
  { key: "system_adjusted_suggest_qty", header: "调整后数量(SA)" },
  { key: "upn_month_cap_qty", header: "SKU月上限(H_upn)" },
  { key: "constraint_types", header: "约束类型(BA)" },
  { key: "adjustment_allowed_flag", header: "允许调整(BD)" },
  { key: "monthly_remaining_adjustable_qty", header: "月剩余可调量(BL)" },
  { key: "bundle_qty", header: "套包数量" },
  { key: "gap_fill_qty", header: "补差量(RA)" },
  { key: "post_gap_fill_qty", header: "补差后数量(RB)" },
  { key: "system_default_final_qty", header: "系统默认RRA" },
  { key: "manual_final_qty", header: "人工RRA" },
  { key: "final_qty", header: "生效RRA" },
  { key: "final_amount", header: "最终金额(RRB)" },
  { key: "system_default_final_amount_total", header: "系统默认最终金额" },
  { key: "system_default_pattern_gap_amount", header: "系统默认差额" },
  { key: "final_amount_total", header: "最终金额合计(RRC)" },
  { key: "final_pattern_gap_amount", header: "最终差额(RD)" },
];

const MONEY_KEYS = new Set<string>([
  "month_le_amount",
  "actual_amount",
  "week_pattern_amount",
  "target_pending_amount",
  "unit_price",
  "suggest_amount",
  "suggested_amount_total",
  "week_pattern_gap_amount",
  "final_amount",
  "system_default_final_amount_total",
  "system_default_pattern_gap_amount",
  "final_amount_total",
  "final_pattern_gap_amount",
]);

function buildColumns(currency: "USD" | "CNY") {
  return baseColumns.map((column) =>
    MONEY_KEYS.has(column.key)
      ? { ...column, header: `${column.header} ${currency}` }
      : column,
  );
}

function formatMetric(value: unknown) {
  if (value === null || value === undefined) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(4).replace(/\.?0+$/, "");
}

function formatPercentage(value: unknown) {
  if (value === null || value === undefined) return "";
  return `${formatMetric(Number(value) * 100)}%`;
}

type WeeklyBuSummaryDisplayRow = {
  scBu: string;
  currentWeekPatternPct: string;
  monthTargetAmount: string;
  actualAmount: string;
  weekPatternAmount: string;
  targetPendingAmount: string;
  suggestedAmountTotal: string;
  weekPatternGapAmount: string;
  weekPatternGapPct: string;
  overageThresholdPct: string;
  shortfallThresholdPct: string;
  finalAmountTotal: string;
  finalPatternGapAmount: string;
};

function WeeklyBuSummaryTable({
  rows,
  currency,
}: {
  rows: WeeklyBuSummaryDisplayRow[];
  currency: "USD" | "CNY";
}) {
  const columns = [
    { key: "currentWeekPatternPct", label: "累计配比(CD)" },
    { key: "monthTargetAmount", label: `月目标(CE) ${currency}` },
    { key: "actualAmount", label: `累计实际(CA) ${currency}` },
    { key: "weekPatternAmount", label: `累计目标(CB) ${currency}` },
    { key: "targetPendingAmount", label: `累计待发(CR) ${currency}` },
    { key: "suggestedAmountTotal", label: `建议合计(AQ) ${currency}` },
    { key: "weekPatternGapAmount", label: `建议差额(AR) ${currency}` },
    { key: "weekPatternGapPct", label: "差额占比(AS)" },
    { key: "overageThresholdPct", label: "超额阈值" },
    { key: "shortfallThresholdPct", label: "补差阈值" },
    { key: "finalAmountTotal", label: `最终合计(RRC) ${currency}` },
    { key: "finalPatternGapAmount", label: `最终差额(RD) ${currency}` },
  ] as const;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">业务单元金额摘要</h3>
      <div className="max-w-full overflow-x-auto rounded-md border">
        <table className="w-full min-w-[96rem] whitespace-nowrap text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="sticky left-0 z-10 bg-muted px-3 py-2 text-left font-medium">业务单元</th>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2 text-right font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.scBu} className="group border-t hover:bg-muted/30">
                <td className="sticky left-0 z-10 bg-background px-3 py-2 font-medium group-hover:bg-muted/30">
                  {row.scBu}
                </td>
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-2 text-right tabular-nums">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function WeeklyBatchDetailPage({ params, searchParams }: WeeklyBatchDetailPageProps) {
  const { calendarDate } = await params;
  const query = await searchParams;
  const { currency: requestedCurrency } = query;
  const displayCurrency = requestedCurrency?.toUpperCase() === "CNY" ? "CNY" : "USD";
  const batch = await getWeeklyCalcBatchDetail(calendarDate);

  if (!batch) {
    return (
      <div className="space-y-6">
        <PageIntro title="周拆分结果明细" description={`${calendarDate} 的结果明细。`} />
        <PageFeedbackCard title="未找到结果。" />
      </div>
    );
  }

  const usdToCnyRate = Number(batch.usd_to_cny_rate);
  const formatAmount = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const amount = Number(value);
    return formatMetric(displayCurrency === "CNY" ? multiply10(amount, usdToCnyRate) : amount);
  };
  const columns = buildColumns(displayCurrency);
  const periodMonthKey = batch.period_month.toISOString().slice(0, 10);
  const { lpNameByCode, pl5NameByCode } = await getCalcResultNameLookup(periodMonthKey);
  const buSummaryRows: WeeklyBuSummaryDisplayRow[] = batch.bu_summaries.map((summary) => ({
    scBu: summary.sc_bu,
    currentWeekPatternPct: formatPercentage(summary.current_week_pattern_pct),
    monthTargetAmount: formatAmount(summary.month_target_amount),
    actualAmount: formatAmount(summary.actual_amount),
    weekPatternAmount: formatAmount(summary.week_pattern_amount),
    targetPendingAmount: formatAmount(summary.target_pending_amount),
    suggestedAmountTotal: formatAmount(summary.suggested_amount_total),
    weekPatternGapAmount: formatAmount(summary.week_pattern_gap_amount),
    weekPatternGapPct: formatPercentage(summary.week_pattern_gap_pct),
    overageThresholdPct: formatPercentage(summary.overage_threshold_pct),
    shortfallThresholdPct: formatPercentage(summary.shortfall_threshold_pct),
    finalAmountTotal: formatAmount(summary.final_amount_total),
    finalPatternGapAmount: formatAmount(summary.final_pattern_gap_amount),
  }));

  const summaryByBu = new Map(batch.bu_summaries.map((summary) => [summary.sc_bu, summary]));
  const data: WeeklyResultRow[] = batch.results.map((row) => {
    const summary = summaryByBu.get(row.sc_bu)!;
    return ({
    sc_bu: row.sc_bu,
    lp_code: row.lp_code,
    lp_name: lpNameByCode[row.lp_code] ?? row.lp_code,
    pl5_code: row.pl5_code,
    pl5_name: pl5NameByCode[row.pl5_code] ?? row.pl5_code,
    upn: row.upn,
    month_quota_qty: formatMetric(row.month_quota_qty),
    current_week_pattern_pct: formatPercentage(row.current_week_pattern_pct),
    cc_prev_week_pattern_pct: formatPercentage(row.cc_prev_week_pattern_pct),
    aa_month_delivered_suggestion_pct: formatPercentage(row.aa_month_delivered_suggestion_pct),
    ab_current_inventory_days: formatMetric(row.ab_current_inventory_days),
    bb_upn_abc_class: row.bb_upn_abc_class ?? "",
    be_original_target_inventory_qty: formatMetric(row.be_original_target_inventory_qty),
    bf_current_inventory_qty: formatMetric(row.bf_current_inventory_qty),
    bj_t2_purchase_3m_avg_qty: formatMetric(row.bj_t2_purchase_3m_avg_qty),
    g_week_quota_pattern_total_qty: formatMetric(row.g_week_quota_pattern_total_qty),
    month_le_amount: formatAmount(summary.month_target_amount),
    actual_amount: formatAmount(summary.actual_amount),
    week_pattern_amount: formatAmount(summary.week_pattern_amount),
    target_pending_amount: formatAmount(summary.target_pending_amount),
    month_delivered_qty: formatMetric(row.month_delivered_qty),
    n_other_dealer_month_delivered_qty: formatMetric(row.n_other_dealer_month_delivered_qty),
    o_month_delivered_total_qty: formatMetric(row.o_month_delivered_total_qty),
    open_order_or_qty: formatMetric(row.open_order_or_qty),
    other_dealer_open_order_or_qty: formatMetric(row.other_dealer_open_order_or_qty),
    s_open_order_or_total_qty: formatMetric(row.s_open_order_or_total_qty),
    t_open_order_non_or_qty: formatMetric(row.t_open_order_non_or_qty),
    v_other_dealer_open_order_non_or_qty: formatMetric(row.v_other_dealer_open_order_non_or_qty),
    w_open_order_non_or_total_qty: formatMetric(row.w_open_order_non_or_total_qty),
    x_open_order_total_qty: formatMetric(row.x_open_order_total_qty),
    bsc_inventory_qty: formatMetric(row.bsc_inventory_qty),
    intransit_qty: formatMetric(row.intransit_qty),
    safety_stock_qty: formatMetric(row.safety_stock_qty),
    bsc_available_qty: formatMetric(row.bsc_available_qty),
    week_quota_pattern_qty: formatMetric(row.week_quota_pattern_qty),
    week_target_pending_qty: formatMetric(row.week_target_pending_qty),
    week_target_pending_total_qty: formatMetric(row.week_target_pending_total_qty),
    inventory_status: row.inventory_status ?? "",
    suggest_qty: formatMetric(row.suggest_qty),
    remaining_bsc_available_qty: formatMetric(row.remaining_bsc_available_qty),
    target_inventory_adjustable_qty: formatMetric(row.target_inventory_adjustable_qty),
    post_suggest_dioh: formatMetric(row.post_suggest_dioh),
    unit_price: formatAmount(row.unit_price),
    suggest_amount: formatAmount(row.suggest_amount),
    suggested_amount_total: formatAmount(summary.suggested_amount_total),
    week_pattern_gap_amount: formatAmount(summary.week_pattern_gap_amount),
    week_pattern_gap_pct: formatPercentage(summary.week_pattern_gap_pct),
    overage_threshold_pct: formatPercentage(summary.overage_threshold_pct),
    shortfall_threshold_pct: formatPercentage(summary.shortfall_threshold_pct),
    system_adjusted_suggest_qty: formatMetric(row.system_adjusted_suggest_qty),
    upn_month_cap_qty: formatMetric(row.upn_month_cap_qty),
    constraint_types: row.constraint_types ?? "无约束",
    adjustment_allowed_flag: row.adjustment_allowed_flag ?? "N",
    monthly_remaining_adjustable_qty: formatMetric(row.monthly_remaining_adjustable_qty),
    bundle_qty: formatMetric(row.bundle_qty),
    gap_fill_qty: formatMetric(row.gap_fill_qty),
    post_gap_fill_qty: formatMetric(row.post_gap_fill_qty),
    system_default_final_qty: formatMetric(row.system_default_final_qty),
    manual_final_qty: formatMetric(row.manual_final_qty),
    final_qty: formatMetric(row.final_qty),
    final_amount: formatAmount(row.final_amount),
    system_default_final_amount_total: formatAmount(summary.system_default_final_amount_total),
    system_default_pattern_gap_amount: formatAmount(summary.system_default_pattern_gap_amount),
    final_amount_total: formatAmount(summary.final_amount_total),
    final_pattern_gap_amount: formatAmount(summary.final_pattern_gap_amount),
  });
  });
  const buildQuery = (currency: "USD" | "CNY") => {
    const params = new URLSearchParams({ currency });
    if (query.bu) params.set("bu", query.bu);
    if (query.lp) params.set("lp", query.lp);
    if (query.pl5) params.set("pl5", query.pl5);
    if (query.upn) params.set("upn", query.upn);
    return params.toString();
  };
  const linkedQuery = new URLSearchParams();
  if (query.bu) linkedQuery.set("bu", query.bu);
  if (query.lp) linkedQuery.set("lp", query.lp);
  if (query.pl5) linkedQuery.set("pl5", query.pl5);
  if (query.upn) linkedQuery.set("upn", query.upn);
  const linkedQueryString = linkedQuery.toString();

  return (
    <div className="space-y-6">
      <PageIntro
        title="周拆分结果明细"
        description={`${calendarDate} 的正式周拆分结果明细。`}
        breadcrumbs={[
          { label: "周拆分结果总览", href: "/calc/weekly-results" },
          { label: calendarDate },
        ]}
      />

      <SectionCard title="计算基准摘要" contentClassName="space-y-4">
        <div className="flex justify-end">
          <Link
            href={`/calc/results/${batch.period_month.toISOString().slice(0, 10)}${linkedQueryString ? `?${linkedQueryString}` : ""}`}
            className="text-sm text-primary underline"
          >
            查看同条件月结果
          </Link>
        </div>
        <MetaBadgeRow
          items={[
            { label: "状态", value: translateCalcStatus(batch.status), variant: "outline" },
            { label: "归属月份", value: batch.period_month.toISOString().slice(0, 10), variant: "secondary" },
            { label: "计算基准日", value: batch.calendar_date.toISOString().slice(0, 10), variant: "secondary" },
            { label: "计算币种", value: batch.calculation_currency, variant: "secondary" },
            { label: "批次汇率", value: `1 USD = ${formatMetric(batch.usd_to_cny_rate)} CNY`, variant: "outline" },
          ]}
        />
        <SummaryStatsGrid
          items={[
            { label: "结果行数", value: batch.total_rows },
            { label: "SKU数", value: batch.total_upns },
          ]}
          columns={2}
        />
        <WeeklyBuSummaryTable rows={buSummaryRows} currency={displayCurrency} />
      </SectionCard>

      <DataTable<WeeklyResultRow>
        title={`周拆分结果明细（${displayCurrency}）`}
        actions={
          <div className="inline-flex rounded-lg border border-border p-0.5">
            <Link
              href={`/calc/weekly-results/${calendarDate}?${buildQuery("USD")}`}
              className={cn(buttonVariants({ size: "sm", variant: displayCurrency === "USD" ? "secondary" : "ghost" }), "rounded-md")}
            >
              USD
            </Link>
            <Link
              href={`/calc/weekly-results/${calendarDate}?${buildQuery("CNY")}`}
              className={cn(buttonVariants({ size: "sm", variant: displayCurrency === "CNY" ? "secondary" : "ghost" }), "rounded-md")}
            >
              CNY
            </Link>
          </div>
        }
        columns={columns}
        data={data}
        dimensionFilters={{
          keys: { bu: "sc_bu", lp: "lp_code", pl5: "pl5_code", upn: "upn" },
          initialValues: { bu: query.bu, lp: query.lp, pl5: query.pl5, upn: query.upn },
        }}
        exportTable="calc_weekly_upn_split_result"
        exportParams={{ calendar_date: calendarDate }}
      />
    </div>
  );
}
