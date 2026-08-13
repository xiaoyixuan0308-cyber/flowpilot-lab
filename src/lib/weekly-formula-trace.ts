import Decimal from "decimal.js";
import {
  WEEKLY_FORMULA_REGISTRY,
  type FormulaTrace,
  type WeeklyFormulaCode,
} from "@/lib/weekly-formula-registry";

export interface WeeklyFormulaBatchSource {
  current_week_pattern_pct: string | null;
  month_le_amount: string | null;
  actual_amount: string | null;
  week_pattern_amount: string | null;
  target_pending_amount: string | null;
  suggested_amount_total: string | null;
  week_pattern_gap_amount: string | null;
  week_pattern_gap_pct: string | null;
  overage_threshold_pct: string;
  shortfall_threshold_pct: string;
  system_default_final_amount_total: string | null;
  system_default_pattern_gap_amount: string | null;
  final_amount_total: string | null;
  final_pattern_gap_amount: string | null;
}

export interface WeeklyFormulaRowSource extends Record<string, string | null> {
  id: string;
  lp_code: string;
  pl5_code: string;
  upn: string;
}

interface RaTraceMeta {
  rank: number | null;
  remainingGapBefore: string | null;
  remainingBhBefore: string | null;
  remainingBlBefore: string | null;
  amountLimitedQty: string | null;
}

function decimal(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  try {
    return new Decimal(value);
  } catch {
    return null;
  }
}

export function displayFormulaValue(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = decimal(value);
  if (!parsed) return value;
  return parsed.toFixed(10).replace(/\.?0+$/, "");
}

function texNumber(value: string | null | undefined) {
  return displayFormulaValue(value) ?? String.raw`\varnothing`;
}

function resultForCode(
  code: WeeklyFormulaCode,
  row: WeeklyFormulaRowSource,
  batch: WeeklyFormulaBatchSource,
) {
  if (code === "BG") return row.bundle_qty ?? "1";

  const rowFieldByCode: Partial<Record<WeeklyFormulaCode, string>> = {
    H_ROW: "month_quota_qty",
    L: "month_delivered_qty",
    O: "o_month_delivered_total_qty",
    J: "week_quota_pattern_qty",
    JA: "week_target_pending_qty",
    JB: "week_target_pending_total_qty",
    YA: "bsc_inventory_qty",
    YB: "intransit_qty",
    YC: "safety_stock_qty",
    Y: "bsc_available_qty",
    R: "other_dealer_open_order_or_qty",
    Z: "inventory_status",
    AD: "suggest_qty",
    AM: "unit_price",
    AO: "suggest_amount",
    SA: "system_adjusted_suggest_qty",
    BB: "bb_upn_abc_class",
    BA: "constraint_types",
    H_UPN: "upn_month_cap_qty",
    BD: "adjustment_allowed_flag",
    BL: "monthly_remaining_adjustable_qty",
    BH: "remaining_bsc_available_qty",
    BE: "be_original_target_inventory_qty",
    BF: "bf_current_inventory_qty",
    BI: "target_inventory_adjustable_qty",
    BJ: "bj_t2_purchase_3m_avg_qty",
    BK: "post_suggest_dioh",
    RA: "gap_fill_qty",
    RB: "post_gap_fill_qty",
    BG: "bundle_qty",
    RRA_DEFAULT: "system_default_final_qty",
    RRA_MANUAL: "manual_final_qty",
    RRA: "final_qty",
    RRB: "final_amount",
  };
  const batchFieldByCode: Partial<Record<WeeklyFormulaCode, keyof WeeklyFormulaBatchSource>> = {
    CD: "current_week_pattern_pct",
    CE: "month_le_amount",
    CA: "actual_amount",
    CB: "week_pattern_amount",
    CR: "target_pending_amount",
    AQ: "suggested_amount_total",
    AR: "week_pattern_gap_amount",
    AS: "week_pattern_gap_pct",
    RRC: "final_amount_total",
    RD: "final_pattern_gap_amount",
  };

  const rowField = rowFieldByCode[code];
  if (rowField) return row[rowField];
  const batchField = batchFieldByCode[code];
  return batchField ? batch[batchField] : null;
}

function buildRaTraceMeta(
  rows: WeeklyFormulaRowSource[],
  batch: WeeklyFormulaBatchSource,
) {
  const metas = new Map<string, RaTraceMeta>();
  const gapPct = decimal(batch.week_pattern_gap_pct);
  const threshold = decimal(batch.shortfall_threshold_pct);
  const gapAmount = decimal(batch.week_pattern_gap_amount);
  const shouldFill = gapPct !== null && threshold !== null && gapPct.gt(threshold) && gapAmount !== null;
  if (!shouldFill) return metas;

  const candidates = rows
    .filter((row) => {
      const bk = decimal(row.post_suggest_dioh);
      const bh = decimal(row.remaining_bsc_available_qty);
      const bi = decimal(row.target_inventory_adjustable_qty);
      const bl = decimal(row.monthly_remaining_adjustable_qty);
      const am = decimal(row.unit_price);
      return row.adjustment_allowed_flag === "Y" && bk !== null && bh?.gt(0) && bi?.gt(0) && bl?.gt(0) && am?.gt(0);
    })
    .sort((left, right) => {
      const bk = decimal(left.post_suggest_dioh)!.comparedTo(decimal(right.post_suggest_dioh)!);
      if (bk !== 0) return bk;
      return ["lp_code", "pl5_code", "upn"].reduce((comparison, key) => {
        if (comparison !== 0) return comparison;
        return String(left[key]).localeCompare(String(right[key]));
      }, 0);
    });

  let remainingGap = gapAmount!;
  const consumedByUpn = new Map<string, Decimal>();
  candidates.forEach((row, index) => {
    const consumed = consumedByUpn.get(row.upn) ?? new Decimal(0);
    const bh = Decimal.max(decimal(row.remaining_bsc_available_qty)!.minus(consumed), 0);
    const bl = Decimal.max(decimal(row.monthly_remaining_adjustable_qty)!.minus(consumed), 0);
    const amountLimited = remainingGap
      .div(decimal(row.unit_price)!)
      .toDecimalPlaces(10, Decimal.ROUND_DOWN);
    metas.set(row.id, {
      rank: index + 1,
      remainingGapBefore: remainingGap.toFixed(10),
      remainingBhBefore: bh.toFixed(10),
      remainingBlBefore: bl.toFixed(10),
      amountLimitedQty: amountLimited.toFixed(10),
    });
    const ra = decimal(row.gap_fill_qty) ?? new Decimal(0);
    remainingGap = Decimal.max(remainingGap.minus(ra.times(decimal(row.unit_price)!)), 0);
    consumedByUpn.set(row.upn, consumed.plus(ra));
  });
  return metas;
}

function buildTrace(
  code: WeeklyFormulaCode,
  row: WeeklyFormulaRowSource,
  batch: WeeklyFormulaBatchSource,
  raMeta?: RaTraceMeta,
): FormulaTrace {
  const definition = WEEKLY_FORMULA_REGISTRY[code];
  const result = resultForCode(code, row, batch);
  const v = (field: string) => texNumber(row[field]);
  const b = (field: keyof WeeklyFormulaBatchSource) => texNumber(batch[field]);
  let substituted = `${code}=${texNumber(result)}`;
  let branch = "直接取值";

  switch (code) {
    case "H_ROW": substituted = String.raw`H_{row}=${v("month_quota_qty")}`; break;
    case "CD": substituted = String.raw`CD=${b("current_week_pattern_pct")}`; break;
    case "L": substituted = String.raw`L=${v("month_delivered_qty")}`; break;
    case "O": substituted = String.raw`O=${v("o_month_delivered_total_qty")}`; break;
    case "J": substituted = String.raw`${v("month_quota_qty")}\times${b("current_week_pattern_pct")}=${texNumber(result)}`; branch = "按H_row和CD计算"; break;
    case "JA":
      substituted = String.raw`\max(${v("week_quota_pattern_qty")}-${v("month_delivered_qty")},0)=${texNumber(result)}`;
      branch = decimal(row.week_quota_pattern_qty)?.gt(decimal(row.month_delivered_qty) ?? 0) ? "J-L>0，取J-L" : "J-L<=0，取0";
      break;
    case "JB": substituted = String.raw`\sum_{LP}JA=${v("week_target_pending_total_qty")}`; branch = "同UPN汇总"; break;
    case "YA": substituted = String.raw`YA=${v("bsc_inventory_qty")}`; break;
    case "YB": substituted = String.raw`YB=${v("intransit_qty")}`; break;
    case "YC": substituted = String.raw`YC=${v("safety_stock_qty")}`; break;
    case "Y":
      substituted = String.raw`\max(${v("bsc_inventory_qty")}+${v("intransit_qty")}-${v("safety_stock_qty")},0)=${texNumber(result)}`;
      branch = decimal(row.bsc_available_qty)?.isZero() ? "非负保护后为0" : "库存差为正";
      break;
    case "R": {
      const s = decimal(row.s_open_order_or_total_qty);
      const r = decimal(row.other_dealer_open_order_or_qty);
      const lpTotal = s && r ? s.minus(r).toFixed(10) : null;
      substituted = String.raw`${v("s_open_order_or_total_qty")}-${texNumber(lpTotal)}=${texNumber(result)}`;
      branch = "扣除Dealer Type=LP的OR订单";
      break;
    }
    case "Z":
      if (result === null) {
        substituted = String.raw`Z=\varnothing`;
        branch = "JB、R或Y依赖未知";
      } else {
        substituted = String.raw`${v("week_target_pending_total_qty")}+${v("other_dealer_open_order_or_qty")}\mathrel{${row.inventory_status === "STOP" ? ">" : "\\le"}}${v("bsc_available_qty")}`;
        branch = row.inventory_status === "STOP" ? "库存不足，STOP" : "库存足够，OK";
      }
      break;
    case "AD":
      if (result === null || row.inventory_status === null) {
        substituted = String.raw`AD=\varnothing`;
        branch = "Z或数量依赖未知";
      } else if (row.inventory_status === "OK") {
        substituted = String.raw`AD=JA=${v("week_target_pending_qty")}`;
        branch = "Z=OK";
      } else if ((decimal(row.bsc_available_qty)?.minus(decimal(row.other_dealer_open_order_or_qty) ?? 0).gt(0))) {
        substituted = String.raw`\frac{${v("week_target_pending_qty")}}{${v("week_target_pending_total_qty")}}\times(${v("bsc_available_qty")}-${v("other_dealer_open_order_or_qty")})=${texNumber(result)}`;
        branch = "Z=STOP且Y-R>0，按比例分配";
      } else {
        substituted = String.raw`AD=0`;
        branch = "Z=STOP且Y-R<=0或JB<=0";
      }
      break;
    case "AM": substituted = String.raw`AM=${v("unit_price")}`; break;
    case "AO": substituted = String.raw`${v("suggest_qty")}\times${v("unit_price")}=${texNumber(result)}`; branch = "按AD和AM计算"; break;
    case "CE": substituted = String.raw`CE=${b("month_le_amount")}`; break;
    case "CA": substituted = String.raw`CA=${b("actual_amount")}`; break;
    case "CB": substituted = String.raw`${b("month_le_amount")}\times${b("current_week_pattern_pct")}=${b("week_pattern_amount")}`; branch = "按CE和CD计算"; break;
    case "CR": substituted = String.raw`${b("week_pattern_amount")}-${b("actual_amount")}=${b("target_pending_amount")}`; branch = "按CB和CA计算"; break;
    case "AQ": substituted = String.raw`\sum AO=${b("suggested_amount_total")}`; branch = "全部正式结果行汇总"; break;
    case "AR": substituted = String.raw`${b("target_pending_amount")}-${b("suggested_amount_total")}=${b("week_pattern_gap_amount")}`; branch = "按CR和AQ计算"; break;
    case "AS":
      if (result === null) {
        substituted = String.raw`AS=\varnothing`;
        branch = decimal(batch.month_le_amount)?.isZero() ? "CE=0，比例不适用" : "AR或CE依赖未知";
      } else {
        substituted = String.raw`\frac{${b("week_pattern_gap_amount")}}{${b("month_le_amount")}}=${b("week_pattern_gap_pct")}`;
        branch = "按AR和CE计算";
      }
      break;
    case "SA": {
      const cr = decimal(batch.target_pending_amount);
      const aq = decimal(batch.suggested_amount_total);
      const as = decimal(batch.week_pattern_gap_pct);
      const threshold = decimal(batch.overage_threshold_pct);
      if (result === null) {
        substituted = String.raw`SA=\varnothing`;
        branch = "AD、CR或AQ依赖未知";
      } else if (cr?.lte(0) || aq?.lte(0)) {
        substituted = String.raw`SA=0`;
        branch = "CR<=0或AQ<=0";
      } else if (as !== null && threshold !== null && as.lt(threshold.negated())) {
        substituted = String.raw`\frac{${b("target_pending_amount")}}{${b("suggested_amount_total")}}\times${v("suggest_qty")}=${texNumber(result)}`;
        branch = "AS小于负向超额阈值，等比缩减";
      } else {
        substituted = String.raw`SA=AD=${v("suggest_qty")}`;
        branch = "未触发超额缩减";
      }
      break;
    }
    case "H_UPN": substituted = String.raw`\sum H_{row}=${v("upn_month_cap_qty")}`; branch = "同UPN汇总"; break;
    case "BB": substituted = String.raw`BB=\mathrm{ABCClass}`; break;
    case "BA": substituted = String.raw`BA=\mathrm{ConstraintTypes}`; branch = row.constraint_types ?? "无约束"; break;
    case "BD":
      substituted = String.raw`BD=${row.adjustment_allowed_flag === "Y" ? "Y" : row.adjustment_allowed_flag === "N" ? "N" : "\\varnothing"}`;
      branch = row.constraint_types?.includes("周不能超")
        ? "周不能超优先，禁止补差"
        : row.constraint_types?.includes("月不能超")
          ? row.adjustment_allowed_flag === "Y"
            ? "月上限仍有余额"
            : row.adjustment_allowed_flag === "N"
              ? "月上限已满"
              : "月配额或JB依赖未知"
          : row.adjustment_allowed_flag === "Y"
            ? "无显式约束，允许补差"
            : "无显式约束结果异常";
      break;
    case "BL":
      if (row.adjustment_allowed_flag === null) {
        substituted = String.raw`BL=\varnothing`;
        branch = "BD或上限依赖未知";
      } else if (row.constraint_types?.includes("月不能超")) {
        substituted = String.raw`${v("upn_month_cap_qty")}-${v("o_month_delivered_total_qty")}-${v("week_target_pending_total_qty")}=${texNumber(result)}`;
        branch = row.adjustment_allowed_flag === "Y" ? "按月剩余额度限制" : "月额度已满，取0";
      } else if (row.adjustment_allowed_flag === "Y") {
        substituted = String.raw`BL=Y=${v("bsc_available_qty")}`;
        branch = "无月约束，使用可发库存";
      } else {
        substituted = String.raw`BL=0`;
        branch = "禁止补差";
      }
      break;
    case "BH": substituted = String.raw`\max(${v("bsc_available_qty")}-${v("other_dealer_open_order_or_qty")}-\sum AD,0)=${texNumber(result)}`; branch = "同UPN共享上限"; break;
    case "BE": substituted = String.raw`BE=${v("be_original_target_inventory_qty")}`; break;
    case "BF": substituted = String.raw`BF=J_{monthly}=${v("bf_current_inventory_qty")}`; break;
    case "BI": substituted = String.raw`\max(${v("be_original_target_inventory_qty")}-${v("bf_current_inventory_qty")}-${v("suggest_qty")},0)=${texNumber(result)}`; branch = "按BE、BF和AD计算并做非负保护"; break;
    case "BJ": substituted = String.raw`BJ=${v("bj_t2_purchase_3m_avg_qty")}`; break;
    case "BK":
      if (result === null) {
        substituted = String.raw`BK=\varnothing`;
        branch = "BJ<=0或AD、BF、BJ依赖未知，不参与排序";
      } else {
        substituted = String.raw`\frac{${v("suggest_qty")}+${v("bf_current_inventory_qty")}}{${v("bj_t2_purchase_3m_avg_qty")}}\times30=${texNumber(result)}`;
        branch = "用于BK升序排序";
      }
      break;
    case "RA":
      if (result === null) {
        substituted = String.raw`RA=\varnothing`;
        branch = row.suggest_qty === null
          ? "AD依赖未知"
          : batch.week_pattern_gap_amount === null
            ? "AR依赖未知"
            : "补差资格或上限依赖未知";
      } else if (raMeta) {
        substituted = String.raw`\min(${texNumber(raMeta.remainingBhBefore)},${v("target_inventory_adjustable_qty")},${texNumber(raMeta.remainingBlBefore)},${texNumber(raMeta.amountLimitedQty)})=${texNumber(result)}`;
        branch = `BK升序第${raMeta.rank}位；进入本行前剩余金额${displayFormulaValue(raMeta.remainingGapBefore)}`;
      } else {
        substituted = String.raw`RA=${texNumber(result)}`;
        branch = decimal(batch.week_pattern_gap_pct)?.gt(decimal(batch.shortfall_threshold_pct) ?? 0)
          ? "未取得补差资格或上限为0"
          : "AS未超过缺口补差阈值";
      }
      break;
    case "RB": substituted = String.raw`${v("suggest_qty")}+${v("gap_fill_qty")}=${texNumber(result)}`; branch = "按AD和RA计算"; break;
    case "BG": substituted = String.raw`BG=${texNumber(result)}`; branch = "使用有效套包量"; break;
    case "RRA_DEFAULT": {
      const as = decimal(batch.week_pattern_gap_pct);
      const overage = decimal(batch.overage_threshold_pct);
      const shortfall = decimal(batch.shortfall_threshold_pct);
      const cr = decimal(batch.target_pending_amount);
      const aq = decimal(batch.suggested_amount_total);
      const sourceField = cr?.lte(0) || aq?.lte(0) || (as !== null && overage !== null && as.lt(overage.negated()))
        ? "system_adjusted_suggest_qty"
        : as !== null && shortfall !== null && as.gt(shortfall)
          ? "post_gap_fill_qty"
          : "suggest_qty";
      if (result === null) {
        substituted = String.raw`RRA_{\mathrm{default}}=\varnothing`;
        branch = "AR或分支数量依赖未知";
      } else {
        const bundleQty = row.bundle_qty ?? "1";
        substituted = String.raw`\left\lfloor\frac{${v(sourceField)}}{${texNumber(bundleQty)}}\right\rfloor\times${texNumber(bundleQty)}=${texNumber(result)}`;
        branch = sourceField === "system_adjusted_suggest_qty" ? "超额分支取SA" : sourceField === "post_gap_fill_qty" ? "缺口分支取RB" : "容差内分支取AD";
      }
      break;
    }
    case "RRA_MANUAL": substituted = String.raw`RRA_{\mathrm{manual}}=${v("manual_final_qty")}`; branch = result === null ? "未人工调整" : "已保存人工值"; break;
    case "RRA": substituted = row.manual_final_qty !== null ? String.raw`RRA=RRA_{\mathrm{manual}}=${v("manual_final_qty")}` : String.raw`RRA=RRA_{\mathrm{default}}=${v("system_default_final_qty")}`; branch = row.manual_final_qty !== null ? "人工值优先" : "使用系统默认值"; break;
    case "RRB": substituted = String.raw`${v("final_qty")}\times${v("unit_price")}=${texNumber(result)}`; branch = "按RRA和AM计算"; break;
    case "RRC": substituted = String.raw`\sum RRB=${b("final_amount_total")}`; branch = "全部正式结果行汇总"; break;
    case "RD": substituted = String.raw`${b("target_pending_amount")}-${b("final_amount_total")}=${b("final_pattern_gap_amount")}`; branch = "按CR和RRC计算"; break;
  }

  return {
    code,
    result: displayFormulaValue(result),
    symbolic: definition.symbolic,
    substituted,
    branch,
    granularity: definition.granularity,
  };
}

export function buildWeeklyRowFormulaTraces(
  rows: WeeklyFormulaRowSource[],
  batch: WeeklyFormulaBatchSource,
) {
  const raMetaById = buildRaTraceMeta(rows, batch);
  return rows.map((row) => ({
    ...row,
    traces: Object.fromEntries(
      (Object.keys(WEEKLY_FORMULA_REGISTRY) as WeeklyFormulaCode[]).map((code) => [
        code,
        buildTrace(code, row, batch, raMetaById.get(row.id)),
      ]),
    ) as Record<WeeklyFormulaCode, FormulaTrace>,
  }));
}

export function buildWeeklyBatchFormulaTrace(
  code: Extract<WeeklyFormulaCode, "CD" | "CE" | "CA" | "CB" | "CR" | "AQ" | "AR" | "AS" | "RRC" | "RD">,
  rows: WeeklyFormulaRowSource[],
  batch: WeeklyFormulaBatchSource,
) {
  const fallbackRow = rows[0] ?? ({ id: "", lp_code: "", pl5_code: "", upn: "" } as WeeklyFormulaRowSource);
  return buildTrace(code, fallbackRow, batch);
}
