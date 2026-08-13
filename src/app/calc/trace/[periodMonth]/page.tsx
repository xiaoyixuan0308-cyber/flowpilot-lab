import Link from "next/link";
import { DataTable } from "@/components/data-table";
import type { Column } from "@/components/data-table";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import { PageIntro } from "@/components/page-intro";
import { PageFeedbackCard } from "@/components/page-feedback-card";
import { SectionCard } from "@/components/section-card";
import { MetaBadgeRow } from "@/components/meta-badge-row";
import { translateCalcStatus } from "@/lib/calc-status";
import { getCalcBatchDetail, listLoadedCalcTraceRowsByPeriodMonth } from "@/server/repositories";

interface TraceBatchPageProps {
  params: Promise<{ periodMonth: string }>;
  searchParams: Promise<{ bu?: string; lp?: string; pl5?: string; upn?: string }>;
}

type TraceRow = {
  sc_bu: string;
  dealerlpcode: string;
  pl5_code: string;
  upn: string;
  h_t2_purchase_mtd: string;
  e_t2_mix_portion: string;
  t_pl5_purchase_m2: string;
  u_pl5_purchase_m1: string;
  v_pl5_purchase_m0_fcst: string;
  f_t2_purchase_3m_avg: string;
  g_t2_purchase_m0: string;
  j_opening_inventory: string;
  k_target_days: string;
  l_tolerance: string;
  i_t2_purchase_mtg: string;
  current_dioh: string;
  replenish_gap_to_30_qty: string;
  w_mtg_allocate_qty: string;
  j_star_pl5_inventory: string;
  i_star_pl5_mtg: string;
  x_after_allocate_days: string;
  m_original_target_inventory: string;
  n_new_target_inventory: string;
  o_final_target_inventory: string;
  p_theoretical_replenish: string;
  q_actual_theoretical: string;
  q_star_pl5_theoretical: string;
  r_base_replenish: string;
  s_tolerance_replenish: string;
  t_adjusted_dioh: string;
  is_error: string;
  is_error_label: string;
  error_message: string;
};

const columns: Column<TraceRow>[] = [
  { key: "sc_bu", header: "业务单元" },
  { key: "dealerlpcode", header: "LP" },
  { key: "pl5_code", header: "产品分类" },
  { key: "upn", header: "SKU" },
  { key: "h_t2_purchase_mtd", header: "H" },
  { key: "e_t2_mix_portion", header: "E" },
  { key: "t_pl5_purchase_m2", header: "T" },
  { key: "u_pl5_purchase_m1", header: "U" },
  { key: "v_pl5_purchase_m0_fcst", header: "V" },
  { key: "f_t2_purchase_3m_avg", header: "F" },
  { key: "g_t2_purchase_m0", header: "G" },
  { key: "j_opening_inventory", header: "J" },
  { key: "k_target_days", header: "K" },
  { key: "l_tolerance", header: "L" },
  { key: "i_t2_purchase_mtg", header: "I" },
  { key: "current_dioh", header: "当前库存天数" },
  { key: "replenish_gap_to_30_qty", header: "30天补货缺口" },
  { key: "w_mtg_allocate_qty", header: "W" },
  { key: "j_star_pl5_inventory", header: "J*" },
  { key: "i_star_pl5_mtg", header: "I*" },
  { key: "x_after_allocate_days", header: "X" },
  { key: "m_original_target_inventory", header: "M" },
  { key: "n_new_target_inventory", header: "N" },
  { key: "o_final_target_inventory", header: "O" },
  { key: "p_theoretical_replenish", header: "P" },
  { key: "q_actual_theoretical", header: "Q" },
  { key: "q_star_pl5_theoretical", header: "Q*" },
  { key: "r_base_replenish", header: "R", className: "bg-yellow-50 font-medium" },
  { key: "s_tolerance_replenish", header: "S", className: "bg-yellow-50 font-medium" },
  { key: "t_adjusted_dioh", header: "T", className: "bg-yellow-50 font-medium" },
  { key: "is_error_label", header: "异常状态" },
  {
    key: "error_message",
    header: "异常说明",
    className: "max-w-[22rem] whitespace-normal break-words leading-5 text-sm",
  },
];

export default async function TraceBatchPage({ params, searchParams }: TraceBatchPageProps) {
  const { periodMonth } = await params;
  const query = await searchParams;
  const [batch, traces] = await Promise.all([
    getCalcBatchDetail(periodMonth),
    listLoadedCalcTraceRowsByPeriodMonth(periodMonth),
  ]);

  if (!batch) {
    return (
      <div className="space-y-6">
        <PageIntro
          title="月拆分过程追踪"
          description={`${periodMonth} 的中间计算字段追踪明细`}
          breadcrumbs={[
            { label: "月拆分结果总览", href: "/calc/results" },
            { label: "过程追踪" },
          ]}
        />
        <PageFeedbackCard title="未找到结果" />
      </div>
    );
  }

  const data: TraceRow[] = traces.map((row) => ({
    sc_bu: row.sc_bu,
    dealerlpcode: row.dealerlpcode,
    pl5_code: row.pl5_code,
    upn: row.upn,
    h_t2_purchase_mtd: row.h_t2_purchase_mtd?.toString() ?? "",
    e_t2_mix_portion: row.e_t2_mix_portion?.toString() ?? "",
    t_pl5_purchase_m2: row.t_pl5_purchase_m2?.toString() ?? "",
    u_pl5_purchase_m1: row.u_pl5_purchase_m1?.toString() ?? "",
    v_pl5_purchase_m0_fcst: row.v_pl5_purchase_m0_fcst?.toString() ?? "",
    f_t2_purchase_3m_avg: row.f_t2_purchase_3m_avg?.toString() ?? "",
    g_t2_purchase_m0: row.g_t2_purchase_m0?.toString() ?? "",
    j_opening_inventory: row.j_opening_inventory?.toString() ?? "",
    k_target_days: row.k_target_days?.toString() ?? "",
    l_tolerance: row.l_tolerance === null ? "" : row.l_tolerance ? "Y" : "N",
    i_t2_purchase_mtg: row.i_t2_purchase_mtg?.toString() ?? "",
    current_dioh: row.current_dioh?.toString() ?? "",
    replenish_gap_to_30_qty: row.replenish_gap_to_30_qty?.toString() ?? "",
    w_mtg_allocate_qty: row.w_mtg_allocate_qty?.toString() ?? "",
    j_star_pl5_inventory: row.j_star_pl5_inventory?.toString() ?? "",
    i_star_pl5_mtg: row.i_star_pl5_mtg?.toString() ?? "",
    x_after_allocate_days: row.x_after_allocate_days?.toString() ?? "",
    m_original_target_inventory: row.m_original_target_inventory?.toString() ?? "",
    n_new_target_inventory: row.n_new_target_inventory?.toString() ?? "",
    o_final_target_inventory: row.o_final_target_inventory?.toString() ?? "",
    p_theoretical_replenish: row.p_theoretical_replenish?.toString() ?? "",
    q_actual_theoretical: row.q_actual_theoretical?.toString() ?? "",
    q_star_pl5_theoretical: row.q_star_pl5_theoretical?.toString() ?? "",
    r_base_replenish: row.r_base_replenish?.toString() ?? "",
    s_tolerance_replenish: row.s_tolerance_replenish?.toString() ?? "",
    t_adjusted_dioh: row.t_adjusted_dioh?.toString() ?? "",
    is_error: row.is_error ? "Y" : "N",
    is_error_label: row.is_error ? "异常" : "正常",
    error_message: row.error_message ?? "",
  }));

  const errorStateOptions = [
    { label: "正常", value: "N" },
    { label: "异常", value: "Y" },
  ];
  const traceCount = data.length;
  const uniqueUpnCount = Array.from(new Set(data.map((row) => row.upn))).length;
  const errorCount = data.filter((row) => row.is_error === "Y").length;
  const linkedQuery = new URLSearchParams();
  if (query.bu) linkedQuery.set("bu", query.bu);
  if (query.lp) linkedQuery.set("lp", query.lp);
  if (query.pl5) linkedQuery.set("pl5", query.pl5);
  if (query.upn) linkedQuery.set("upn", query.upn);
  const linkedQueryString = linkedQuery.toString();

  return (
    <div className="space-y-6">
      <PageIntro
        title="月拆分过程追踪"
        description={`${periodMonth} 的中间计算字段追踪明细，字段顺序按核对链路排列。`}
        breadcrumbs={[
          { label: "月拆分结果总览", href: "/calc/results" },
          { label: "结果明细", href: `/calc/results/${periodMonth}` },
          { label: "过程追踪" },
        ]}
      />

      <SectionCard
        title="过程追踪数据"
        action={
          <div className="flex items-center gap-4 text-sm">
            <Link href={`/calc/results/${periodMonth}${linkedQueryString ? `?${linkedQueryString}` : ""}`} className="whitespace-nowrap text-primary underline">
              返回结果明细
            </Link>
            <Link href={`/calc/explain/${periodMonth}`} className="text-primary underline whitespace-nowrap">
              计算流程展示
            </Link>
            <a
              href={`/api/data/export?table=calc_upn_split_trace&period_month=${periodMonth}&scope=filtered`}
              download
              className="whitespace-nowrap text-primary underline"
            >
              {`导出过程追踪数据（${traceCount}条）`}
            </a>
          </div>
        }
        contentClassName="space-y-4"
      >
        <MetaBadgeRow
          items={[
            { label: "状态", value: translateCalcStatus(batch.status), variant: "outline" },
            { label: "计算基准(月份)", value: batch.period_month.toISOString().slice(0, 10), variant: "secondary" },
            { label: "Trace行数", value: traceCount },
            ...(errorCount > 0 ? [{ label: "异常行", value: errorCount, variant: "destructive" as const }] : []),
          ]}
        />
        <SummaryStatsGrid
          items={[
            { label: "Trace行数", value: traceCount },
            { label: "SKU数", value: uniqueUpnCount },
            { label: "异常行数", value: errorCount },
          ]}
        />
      </SectionCard>

      <DataTable<TraceRow>
        title="过程追踪明细"
        columns={columns}
        data={data}
        exportTable="calc_upn_split_trace"
        exportParams={{ period_month: periodMonth }}
        dimensionFilters={{
          keys: { bu: "sc_bu", lp: "dealerlpcode", pl5: "pl5_code", upn: "upn" },
          initialValues: { bu: query.bu, lp: query.lp, pl5: query.pl5, upn: query.upn },
        }}
        filters={[
          {
            key: "pl5_code",
            label: "产品分类",
            placeholder: "全部产品分类",
            sort: "asc",
          },
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
