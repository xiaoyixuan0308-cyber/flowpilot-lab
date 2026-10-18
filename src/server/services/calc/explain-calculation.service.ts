import {
  getCalcBatchDetail,
  getCalcResultNameLookup,
  listLoadedCalcTraceRowsByPeriodMonth,
  type CalcTraceRowRecord,
} from "@/server/repositories";
import { CALC_EXPLAIN_STEPS, type ExplainMetricKey } from "./explain-formulas";

export interface ExplainFilters {
  channelCode?: string;
  categoryCode?: string;
  sku?: string;
  sourceKey?: string;
}

export interface ExplainStep {
  key: ExplainMetricKey;
  badge: string;
  title: string;
  source: string;
  sourceKey: string;
  formulaLatex: string;
  inputs: { key: string; label: string; value: string }[];
  actual: string;
  expected: string | null;
  diff: string | null;
  status: "ok" | "warn" | "info";
  note?: string;
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function safeDiv(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

function formatNumber(value: unknown) {
  if (value === null || value === undefined) return "";
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(4).replace(/\.?0+$/, "");
}

function formatBool(value: unknown) {
  if (value === null || value === undefined) return "";
  return value ? "Y" : "N";
}

function fieldLabel(key: string) {
  const labels: Record<string, string> = {
    e_t2_mix_portion: "产品历史采购占比",
    f_t2_purchase_3m_avg: "产品三期平均需求量",
    g_t2_purchase_m0: "产品当月采购预测量",
    h_t2_purchase_mtd: "当月已采购量",
    i_t2_purchase_mtg: "当月剩余采购需求",
    j_opening_inventory: "期初库存",
    k_target_days: "目标库存天数",
    l_tolerance: "是否允许调剂",
    t_category_purchase_m2: "前两个月产品分类采购量",
    u_category_purchase_m1: "上月产品分类采购量",
    v_category_purchase_m0_fcst: "当月产品分类预测量",
    current_dioh: "当前库存天数",
    w_mtg_allocate_qty: "计划配货量",
    j_star_category_inventory: "产品分类库存汇总",
    i_star_category_mtg: "产品分类剩余需求汇总",
    x_after_allocate_days: "配货后预计库存天数",
    m_original_target_inventory: "原目标期末库存",
    n_new_target_inventory: "动态目标期末库存",
    o_final_target_inventory: "最终目标库存",
    p_theoretical_replenish: "理论补货缺口",
    q_actual_theoretical: "理论补货量",
    q_star_category_theoretical: "产品分类理论补货汇总",
    r_base_replenish: "基础补货量",
    s_tolerance_replenish: "调剂后补货量",
    t_adjusted_dioh: "调整后库存天数",
    sum_r_base_by_channel_category: "当前渠道与产品分类基础补货汇总",
    sum_e_tolerance_y_by_channel_category: "可调剂产品历史占比汇总",
  };
  return labels[key] ?? key;
}

function getTraceValue(row: CalcTraceRowRecord, key: string, group: ExplainGroupMetrics) {
  if (key === "sum_r_base_by_channel_category") return formatNumber(group.rBaseTotal);
  if (key === "sum_e_tolerance_y_by_channel_category") return formatNumber(group.toleranceMixTotal);
  const value = row[key as keyof CalcTraceRowRecord];
  if (key === "l_tolerance") return formatBool(value);
  return formatNumber(value);
}

interface ExplainGroupMetrics {
  fStar: number;
  qStarTotal: number;
  rBaseTotal: number;
  toleranceMixTotal: number;
}

function groupKey(row: Pick<CalcTraceRowRecord, "dealer_channel_code" | "category_code">) {
  return `${row.dealer_channel_code}|${row.category_code}`;
}

function buildGroupMetrics(rows: CalcTraceRowRecord[]) {
  const groups = new Map<string, ExplainGroupMetrics>();
  for (const row of rows) {
    const key = groupKey(row);
    const current = groups.get(key) ?? { fStar: 0, qStarTotal: 0, rBaseTotal: 0, toleranceMixTotal: 0 };
    current.fStar += toNumber(row.f_t2_purchase_3m_avg);
    current.qStarTotal += toNumber(row.q_actual_theoretical);
    current.rBaseTotal += toNumber(row.r_base_replenish);
    if (row.l_tolerance) {
      current.toleranceMixTotal += toNumber(row.e_t2_mix_portion);
    }
    groups.set(key, current);
  }
  return groups;
}

function calculateExpected(row: CalcTraceRowRecord, key: ExplainMetricKey, group: ExplainGroupMetrics) {
  const e = toNumber(row.e_t2_mix_portion);
  const f = toNumber(row.f_t2_purchase_3m_avg);
  const g = toNumber(row.g_t2_purchase_m0);
  const h = toNumber(row.h_t2_purchase_mtd);
  const i = toNumber(row.i_t2_purchase_mtg);
  const j = toNumber(row.j_opening_inventory);
  const k = toNumber(row.k_target_days);
  const l = Boolean(row.l_tolerance);
  const t = toNumber(row.t_category_purchase_m2);
  const u = toNumber(row.u_category_purchase_m1);
  const v = toNumber(row.v_category_purchase_m0_fcst);
  const w = toNumber(row.w_mtg_allocate_qty);
  const jStar = toNumber(row.j_star_category_inventory);
  const iStar = toNumber(row.i_star_category_mtg);
  const x = toNumber(row.x_after_allocate_days);
  const m = toNumber(row.m_original_target_inventory);
  const n = toNumber(row.n_new_target_inventory);
  const o = toNumber(row.o_final_target_inventory);
  const p = toNumber(row.p_theoretical_replenish);
  const q = toNumber(row.q_actual_theoretical);
  const qStar = toNumber(row.q_star_category_theoretical);
  const r = toNumber(row.r_base_replenish);
  const s = toNumber(row.s_tolerance_replenish);

  switch (key) {
    case "f_t2_purchase_3m_avg":
      return e * ((t + u + v) / 3);
    case "g_t2_purchase_m0":
      return e * v;
    case "i_t2_purchase_mtg":
      return Math.max(g - h, 0);
    case "current_dioh":
      return safeDiv(j, g) * 30;
    case "x_after_allocate_days":
      return safeDiv(jStar + w - iStar, group.fStar) * 30;
    case "m_original_target_inventory":
      return (k / 30) * f;
    case "n_new_target_inventory":
      return (x / 30) * f;
    case "o_final_target_inventory":
      if (n <= m) return n;
      return l ? n : m;
    case "p_theoretical_replenish":
      return o + i - j;
    case "q_actual_theoretical":
      return Math.max(p, 0);
    case "q_star_category_theoretical":
      return group.qStarTotal;
    case "r_base_replenish":
      return qStar < w ? q : safeDiv(q, qStar) * w;
    case "s_tolerance_replenish": {
      if (!l) return r;
      const surplus = Math.max(w - group.rBaseTotal, 0);
      return r + surplus * safeDiv(e, group.toleranceMixTotal);
    }
    case "t_adjusted_dioh":
      return safeDiv(j + s - i, f) * 30;
    default:
      return null;
  }
}

function buildSteps(row: CalcTraceRowRecord, group: ExplainGroupMetrics): ExplainStep[] {
  return CALC_EXPLAIN_STEPS.map((definition) => {
    const actualNumber = toNumber(row[definition.key]);
    const expected = calculateExpected(row, definition.key, group);
    const roundedExpected = expected === null ? null : round4(expected);
    const diff = roundedExpected === null ? null : round4(actualNumber - roundedExpected);
    const status = diff === null ? "info" : Math.abs(diff) <= 0.01 ? "ok" : "warn";

    return {
      key: definition.key,
      badge: definition.badge,
      title: definition.title,
      source: definition.source,
      sourceKey: definition.sourceKey,
      formulaLatex: definition.formulaLatex,
      inputs: definition.inputs.map((inputKey) => ({
        key: inputKey,
        label: fieldLabel(inputKey),
        value: getTraceValue(row, inputKey, group),
      })),
      actual: formatNumber(row[definition.key]),
      expected: roundedExpected === null ? null : formatNumber(roundedExpected),
      diff: diff === null ? null : formatNumber(diff),
      status,
      note: definition.note,
    };
  });
}

function isPeriodMonth(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T08:00:00+08:00`).getTime());
}

export async function getCalculationExplainView(periodMonth: string, filters: ExplainFilters) {
  if (!isPeriodMonth(periodMonth)) {
    return null;
  }

  const [batch, traces] = await Promise.all([
    getCalcBatchDetail(periodMonth),
    listLoadedCalcTraceRowsByPeriodMonth(periodMonth),
  ]);

  if (!batch) {
    return null;
  }

  const baselineMonth = batch.period_month.toISOString().slice(0, 10);
  const { channelNameByCode, categoryNameByCode } = await getCalcResultNameLookup(baselineMonth);
  const groupMetrics = buildGroupMetrics(traces);

  const channelOptions = Array.from(new Set(traces.map((row) => row.dealer_channel_code)))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: channelNameByCode[value] ?? value, value }));
  const scopedByChannel = filters.channelCode
    ? traces.filter((row) => row.dealer_channel_code === filters.channelCode)
    : traces;
  const categoryOptions = Array.from(new Set(scopedByChannel.map((row) => row.category_code)))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: categoryNameByCode[value] ?? value, value }));
  const scopedByCategory = filters.categoryCode
    ? scopedByChannel.filter((row) => row.category_code === filters.categoryCode)
    : scopedByChannel;
  const skuOptions = Array.from(new Set(scopedByCategory.map((row) => row.sku)))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));

  const selectedRow =
    traces.find(
      (row) =>
        (!filters.channelCode || row.dealer_channel_code === filters.channelCode) &&
        (!filters.categoryCode || row.category_code === filters.categoryCode) &&
        (!filters.sku || row.sku === filters.sku)
    ) ?? traces[0] ?? null;

  const selectedGroup = selectedRow
    ? groupMetrics.get(groupKey(selectedRow)) ?? { fStar: 0, qStarTotal: 0, rBaseTotal: 0, toleranceMixTotal: 0 }
    : null;

  return {
    batch,
    periodMonth: baselineMonth,
    traces,
    selectedRow,
    selectedGroup,
    steps: selectedRow && selectedGroup ? buildSteps(selectedRow, selectedGroup) : [],
    options: {
      channel: channelOptions,
      category: categoryOptions,
      sku: skuOptions,
    },
    names: {
      channelNameByCode,
      categoryNameByCode,
    },
  };
}
