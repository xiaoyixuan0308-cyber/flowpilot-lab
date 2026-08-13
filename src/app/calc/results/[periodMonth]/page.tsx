import Link from "next/link";
import { DataTable } from "@/components/data-table";
import type { Column } from "@/components/data-table";
import { MetaBadgeRow } from "@/components/meta-badge-row";
import { PageFeedbackCard } from "@/components/page-feedback-card";
import { PageIntro } from "@/components/page-intro";
import { SectionCard } from "@/components/section-card";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import { translateCalcStatus } from "@/lib/calc-status";
import {
  getCalcBatchDetail,
  getCalcResultNameLookup,
  getCurrentCalculationCalendarDate,
} from "@/server/repositories";

interface BatchDetailPageProps {
  params: Promise<{ periodMonth: string }>;
  searchParams: Promise<{ bu?: string; lp?: string; pl5?: string; upn?: string }>;
}

type ResultRow = {
  sc_bu: string;
  lp_name: string;
  pl5_name: string;
  dealerlpcode: string;
  pl5_code: string;
  upn: string;
  e_t2_mix_portion: string;
  f_t2_purchase_3m_avg: string;
  g_t2_purchase_m0: string;
  h_t2_purchase_mtd: string;
  i_t2_purchase_mtg: string;
  j_opening_inventory: string;
  k_target_days: string;
  l_tolerance: string;
  i_star_pl5_mtg: string;
  j_star_pl5_inventory: string;
  x_after_allocate_days: string;
  m_original_target_inventory: string;
  n_new_target_inventory: string;
  o_final_target_inventory: string;
  p_theoretical_replenish: string;
  q_actual_theoretical: string;
  q_star_pl5_theoretical: string;
  w_mtg_allocate_qty: string;
  r_base_replenish: string;
  s_tolerance_replenish: string;
  t_adjusted_dioh: string;
  current_dioh: string;
  replenish_gap_to_30_qty: string;
  is_error: string;
  is_error_label: string;
  error_message: string;
};

const columns: Column<ResultRow>[] = [
  { key: "sc_bu", header: "业务单元" },
  { key: "lp_name", header: "LP名称" },
  { key: "pl5_name", header: "产品分类名称" },
  { key: "upn", header: "SKU" },
  { key: "e_t2_mix_portion", header: "E", className: "font-mono text-xs" },
  { key: "f_t2_purchase_3m_avg", header: "F", className: "font-mono text-xs" },
  { key: "g_t2_purchase_m0", header: "G", className: "font-mono text-xs" },
  { key: "h_t2_purchase_mtd", header: "H", className: "font-mono text-xs" },
  { key: "i_t2_purchase_mtg", header: "I", className: "font-mono text-xs" },
  { key: "j_opening_inventory", header: "J", className: "font-mono text-xs" },
  { key: "k_target_days", header: "K", className: "font-mono text-xs" },
  { key: "l_tolerance", header: "L" },
  { key: "j_star_pl5_inventory", header: "J*", className: "font-mono text-xs" },
  { key: "i_star_pl5_mtg", header: "I*", className: "font-mono text-xs" },
  { key: "x_after_allocate_days", header: "X", className: "bg-amber-50/70 font-mono text-xs" },
  { key: "m_original_target_inventory", header: "M", className: "font-mono text-xs" },
  { key: "n_new_target_inventory", header: "N", className: "font-mono text-xs" },
  { key: "o_final_target_inventory", header: "O", className: "bg-amber-50/70 font-mono text-xs" },
  { key: "p_theoretical_replenish", header: "P", className: "font-mono text-xs" },
  { key: "q_actual_theoretical", header: "Q", className: "font-mono text-xs" },
  { key: "q_star_pl5_theoretical", header: "Q*", className: "font-mono text-xs" },
  { key: "w_mtg_allocate_qty", header: "W", className: "font-mono text-xs" },
  { key: "r_base_replenish", header: "R", className: "bg-yellow-50 font-medium font-mono text-xs" },
  { key: "s_tolerance_replenish", header: "S", className: "bg-yellow-50 font-medium font-mono text-xs" },
  { key: "t_adjusted_dioh", header: "T", className: "bg-yellow-50 font-medium font-mono text-xs" },
  { key: "current_dioh", header: "当前库存天数", className: "font-mono text-xs" },
  { key: "replenish_gap_to_30_qty", header: "30天补货缺口", className: "font-mono text-xs" },
  { key: "is_error_label", header: "异常状态" },
  {
    key: "error_message",
    header: "异常说明",
    className: "max-w-[22rem] whitespace-normal break-words leading-5 text-sm",
  },
];

function formatMetric(value: unknown) {
  if (value === null || value === undefined) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(4).replace(/\.?0+$/, "");
}

export default async function BatchDetailPage({ params, searchParams }: BatchDetailPageProps) {
  const { periodMonth } = await params;
  const query = await searchParams;
  const batch = await getCalcBatchDetail(periodMonth);

  if (!batch) {
    return (
      <div className="space-y-6">
        <PageIntro
          title="月拆分结果明细"
          description={`${periodMonth} 的正式结果明细`}
          breadcrumbs={[
            { label: "月拆分结果总览", href: "/calc/results" },
            { label: periodMonth },
          ]}
        />
        <PageFeedbackCard title="未找到结果" />
      </div>
    );
  }

  const baselineMonth = batch.period_month.toISOString().slice(0, 10);
  const currentCalendarDate = await getCurrentCalculationCalendarDate();
  const fullSnapshotExportHref = `/api/data/export?table=calc_upn_split_result&period_month=${baselineMonth}`;
  const { lpNameByCode, pl5NameByCode } = await getCalcResultNameLookup(baselineMonth);

  const data: ResultRow[] = batch.results.map((row) => ({
    sc_bu: row.sc_bu,
    lp_name: lpNameByCode[row.dealerlpcode] ?? row.dealerlpcode,
    pl5_name: pl5NameByCode[row.pl5_code] ?? row.pl5_code,
    dealerlpcode: row.dealerlpcode,
    pl5_code: row.pl5_code,
    upn: row.upn,
    e_t2_mix_portion: formatMetric(row.e_t2_mix_portion),
    f_t2_purchase_3m_avg: formatMetric(row.f_t2_purchase_3m_avg),
    g_t2_purchase_m0: formatMetric(row.g_t2_purchase_m0),
    h_t2_purchase_mtd: formatMetric(row.h_t2_purchase_mtd),
    i_t2_purchase_mtg: formatMetric(row.i_t2_purchase_mtg),
    j_opening_inventory: formatMetric(row.j_opening_inventory),
    k_target_days: formatMetric(row.k_target_days),
    l_tolerance: row.l_tolerance === null ? "" : row.l_tolerance ? "Y" : "N",
    i_star_pl5_mtg: formatMetric(row.i_star_pl5_mtg),
    j_star_pl5_inventory: formatMetric(row.j_star_pl5_inventory),
    x_after_allocate_days: formatMetric(row.x_after_allocate_days),
    m_original_target_inventory: formatMetric(row.m_original_target_inventory),
    n_new_target_inventory: formatMetric(row.n_new_target_inventory),
    o_final_target_inventory: formatMetric(row.o_final_target_inventory),
    p_theoretical_replenish: formatMetric(row.p_theoretical_replenish),
    q_actual_theoretical: formatMetric(row.q_actual_theoretical),
    q_star_pl5_theoretical: formatMetric(row.q_star_pl5_theoretical),
    w_mtg_allocate_qty: formatMetric(row.w_mtg_allocate_qty),
    r_base_replenish: formatMetric(row.r_base_replenish),
    s_tolerance_replenish: formatMetric(row.s_tolerance_replenish),
    t_adjusted_dioh: formatMetric(row.t_adjusted_dioh),
    current_dioh: formatMetric(row.current_dioh),
    replenish_gap_to_30_qty: formatMetric(row.replenish_gap_to_30_qty),
    is_error: row.is_error ? "Y" : "N",
    is_error_label: row.is_error ? "异常" : "正常",
    error_message: row.error_message ?? "",
  }));

  const uniquePl5Count = Array.from(new Set(data.map((row) => row.pl5_code))).length;
  const errorStateOptions = [
    { label: "正常", value: "N" },
    { label: "异常", value: "Y" },
  ];
  const errorCount = data.filter((row) => row.is_error === "Y").length;
  const maxReplenish = data.reduce((max, row) => {
    const value = Number(row.s_tolerance_replenish || "0");
    return value > max ? value : max;
  }, 0);
  const linkedQuery = new URLSearchParams();
  if (query.bu) linkedQuery.set("bu", query.bu);
  if (query.lp) linkedQuery.set("lp", query.lp);
  if (query.pl5) linkedQuery.set("pl5", query.pl5);
  if (query.upn) linkedQuery.set("upn", query.upn);
  const linkedQueryString = linkedQuery.toString();

  return (
    <div className="space-y-6">
      <PageIntro
        title="月拆分结果明细"
        description={`${baselineMonth} 的正式结果明细`}
        breadcrumbs={[
          { label: "月拆分结果总览", href: "/calc/results" },
          { label: baselineMonth },
        ]}
      />

      <SectionCard
        title="计算基准信息"
        action={
          <div className="flex items-center gap-4 text-sm">
            <Link
              href={`/calc/weekly-results/${currentCalendarDate}${linkedQueryString ? `?${linkedQueryString}` : ""}`}
              className="whitespace-nowrap text-primary underline"
            >
              查看同条件周结果
            </Link>
            <Link href={`/calc/trace/${baselineMonth}${linkedQueryString ? `?${linkedQueryString}` : ""}`} className="whitespace-nowrap text-primary underline">
              打开过程追踪
            </Link>
            <Link href={`/calc/explain/${baselineMonth}`} className="text-primary underline whitespace-nowrap">
              计算流程展示
            </Link>
            <a
              href={fullSnapshotExportHref}
              download
              className="whitespace-nowrap text-sm text-primary underline"
            >
              导出全量结果快照
            </a>
          </div>
        }
        contentClassName="space-y-4"
      >
        <MetaBadgeRow
          items={[
            { label: "状态", value: translateCalcStatus(batch.status), variant: "outline" },
            { label: "结果行数", value: batch.total_upns },
            { label: "计算基准(月份)", value: baselineMonth, variant: "secondary" },
            ...(batch.error_upns > 0
              ? [{ label: "异常行", value: batch.error_upns, variant: "destructive" as const }]
              : []),
          ]}
        />
        <SummaryStatsGrid
          items={[
            { label: "总结果行", value: batch.total_upns },
            { label: "异常行", value: batch.error_upns },
            {
              label: "最后计算时间",
              value: batch.calculated_at?.toISOString().replace("T", " ").slice(0, 19) ?? "",
            },
            { label: "内部记录ID", value: <span className="break-all font-mono text-sm">{batch.id}</span> },
          ]}
        />
        <SummaryStatsGrid
          columns={3}
          items={[
            { label: "涉及产品分类数", value: uniquePl5Count },
            { label: "最大S值", value: maxReplenish },
            { label: "异常行数", value: errorCount },
          ]}
        />
        <p className="text-sm text-muted-foreground">
          为了便于逐值核对，结果页直接展示 `J* / I* / X / M / N / O / P / Q / Q* / W / R / S / T`。
          如需继续查看 `T / U / V` 与中间链路，请进入“过程追踪”页。
        </p>
      </SectionCard>

      <DataTable<ResultRow>
        title="月拆分结果明细"
        columns={columns}
        data={data}
        exportTable="calc_upn_split_result"
        exportParams={{ period_month: baselineMonth }}
        exportHref={fullSnapshotExportHref}
        exportLabel="导出全量结果快照"
        dimensionFilters={{
          keys: { bu: "sc_bu", lp: "dealerlpcode", pl5: "pl5_code", upn: "upn" },
          labelKeys: { lp: "lp_name", pl5: "pl5_name" },
          initialValues: { bu: query.bu, lp: query.lp, pl5: query.pl5, upn: query.upn },
        }}
        filters={[
          {
            key: "is_error",
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
        ]}
      />
    </div>
  );
}
