import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  acquireCalculationLock,
  getWeeklyUpnSplitSourceData,
  persistWeeklyUpnSplitArtifactsWithClient,
} from "@/server/repositories";
import { buildWeeklyBaseRows } from "./p1/build-weekly-base-rows";
import { attachCalendarContext } from "./p2/attach-calendar-context";
import { attachDeliveryOpenOrderMetrics } from "./p3/attach-delivery-open-order-metrics";
import { attachBscInventoryMetrics } from "./p4/attach-bsc-inventory-metrics";
import { attachWeekTargetMetrics } from "./p5/attach-week-target-metrics";
import { attachOrSuggestionMetrics } from "./p6/attach-or-suggestion-metrics";
import { attachAdjustmentCapMetrics } from "./p7/attach-adjustment-cap-metrics";
import { attachSuggestionAmountMetrics } from "./p7/attach-suggestion-amount-metrics";
import { buildAmountTargetSummary } from "./p8/build-amount-target-summary";
import { buildWeekPatternGapSummary } from "./p9/build-week-pattern-gap-summary";
import { attachSystemAdjustedQty } from "./p10/attach-system-adjusted-qty";
import { attachConstraintMetrics } from "./p11/attach-constraint-metrics";
import { attachGapFillMetrics } from "./p12/attach-gap-fill-metrics";
import { attachFinalMetrics } from "./p13/attach-final-metrics";
import { subtract10, sumCompleteNumbers } from "./weekly-upn-split.helpers";
import type {
  WeeklyAmountRow,
  WeeklyMonthQuotaStrategy,
  WeeklyMonthlySnapshotRow,
  WeeklyRunStrategy,
  WeeklyStrategyComparisonResponse,
  WeeklyUpnSplitResponse,
} from "./weekly-upn-split.types";

function validateScbuAmountRows(rows: WeeklyAmountRow[]) {
  for (const row of rows) {
    const key = `${row.periodWeek.toISOString().slice(0, 10)} / ${row.scBu}`;
    if (row.actualAmount !== null && row.actualAmount < 0) {
      throw new Error(`SCBU 预算 ${key} 的实际金额不能小于 0`);
    }
    if (row.monthTargetAmount < 0 || row.monthLimitAmount < 0) {
      throw new Error(`SCBU 预算 ${key} 的月目标和月上限不能小于 0`);
    }
    if (row.actualAmount !== null && row.actualAmount > row.monthTargetAmount) {
      throw new Error(`SCBU 预算 ${key} 的实际金额不能超过月目标`);
    }
    if (row.monthTargetAmount > row.monthLimitAmount) {
      throw new Error(`SCBU 预算 ${key} 的月目标不能超过月预算上限`);
    }
  }
}

function resolveMonthQuotaQty(row: WeeklyMonthlySnapshotRow, strategy: WeeklyMonthQuotaStrategy) {
  switch (strategy) {
    case "s_tolerance_replenish":
      return row.sToleranceReplenishQty;
    case "r_base_replenish":
      return row.rBaseReplenishQty;
    case "q_actual_theoretical":
      return row.qActualTheoreticalQty;
    case "fallback":
    default:
      return row.monthQuotaQty;
  }
}

function applyMonthQuotaStrategy(
  monthlyRows: WeeklyMonthlySnapshotRow[],
  strategy: WeeklyMonthQuotaStrategy
): WeeklyMonthlySnapshotRow[] {
  return monthlyRows.map((row) => ({
    ...row,
    monthQuotaQty: resolveMonthQuotaQty(row, strategy),
  }));
}

function normalizeStrategy(strategy?: WeeklyRunStrategy) {
  // 当前周拆分作为月拆分下游，默认先承接月拆分最终补货结果 S。
  // Q/R 都更像中间分析量；业务口径还没被最终拍死，这里先临时锁定为 S。
  return {
    monthQuotaStrategy: strategy?.monthQuotaStrategy ?? "s_tolerance_replenish",
  } as const;
}

type WeeklyRowDeltaInput = Pick<
  WeeklyUpnSplitResponse["rows"][number],
  | "lpCode"
  | "scBu"
  | "pl5Code"
  | "upn"
  | "adOrSuggestQty"
  | "aoOrSuggestAmount"
  | "saSystemAdjustedQty"
  | "raGapFillQty"
  | "rraFinalQty"
  | "rrbFinalAmount"
>;

function subtractNullable10(left: number | null, right: number | null) {
  if (left === null && right === null) return 0;
  if (left === null || right === null) return null;
  return subtract10(left, right);
}

export function buildWeeklyRowDelta(
  baseRows: WeeklyRowDeltaInput[],
  compareRows: WeeklyRowDeltaInput[]
) {
  const buildRowKey = (row: WeeklyRowDeltaInput) =>
    `${row.scBu}||${row.lpCode}||${row.pl5Code}||${row.upn}`;
  const compareByRowKey = new Map(compareRows.map((row) => [buildRowKey(row), row]));

  return baseRows
    .map((baseRow) => {
      const compareRow = compareByRowKey.get(buildRowKey(baseRow));
      if (!compareRow) return null;

      const adDelta = subtractNullable10(compareRow.adOrSuggestQty, baseRow.adOrSuggestQty);
      const aoDelta = subtractNullable10(compareRow.aoOrSuggestAmount, baseRow.aoOrSuggestAmount);
      const saDelta = subtractNullable10(compareRow.saSystemAdjustedQty, baseRow.saSystemAdjustedQty);
      const raDelta = subtractNullable10(compareRow.raGapFillQty, baseRow.raGapFillQty);
      const rraDelta = subtractNullable10(compareRow.rraFinalQty, baseRow.rraFinalQty);
      const rrbDelta = subtractNullable10(compareRow.rrbFinalAmount, baseRow.rrbFinalAmount);

      if (
        adDelta === 0 &&
        aoDelta === 0 &&
        saDelta === 0 &&
        raDelta === 0 &&
        rraDelta === 0 &&
        rrbDelta === 0
      ) return null;

      return {
        scBu: baseRow.scBu,
        lpCode: baseRow.lpCode,
        pl5Code: baseRow.pl5Code,
        upn: baseRow.upn,
        adDelta,
        aoDelta,
        saDelta,
        raDelta,
        rraDelta,
        rrbDelta,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .slice(0, 10);
}

function buildSummaryDelta(
  base: WeeklyUpnSplitResponse["summary"],
  compare: WeeklyUpnSplitResponse["summary"]
) {
  return {
    currentWeekPatternPctDelta: subtract10(compare.currentWeekPatternPct, base.currentWeekPatternPct),
    monthLeAmountDelta: subtractNullable10(compare.monthLeAmount, base.monthLeAmount),
    actualAmountDelta: subtractNullable10(compare.actualAmount, base.actualAmount),
    weekPatternAmountDelta: subtractNullable10(compare.weekPatternAmount, base.weekPatternAmount),
    targetPendingAmountDelta: subtractNullable10(compare.targetPendingAmount, base.targetPendingAmount),
    suggestedAmountTotalDelta: subtractNullable10(compare.suggestedAmountTotal, base.suggestedAmountTotal),
    weekPatternGapAmountDelta: subtractNullable10(compare.weekPatternGapAmount, base.weekPatternGapAmount),
    weekPatternGapPctDelta: subtractNullable10(compare.weekPatternGapPct, base.weekPatternGapPct),
    finalAmountTotalDelta: subtractNullable10(compare.finalAmountTotal, base.finalAmountTotal),
    finalPatternGapAmountDelta: subtractNullable10(
      compare.finalPatternGapAmount,
      base.finalPatternGapAmount
    ),
  };
}

async function runStrategyComparison(
  label: string,
  input: { calendarDate: string },
  strategy: WeeklyRunStrategy,
  baseline: WeeklyUpnSplitResponse
) {
  try {
    const result = await runWeeklyUpnSplitWithStrategy(input, strategy);
    return {
      label,
      status: "ok" as const,
      strategy: result.strategy!,
      summary: result.summary,
      summaryDelta: buildSummaryDelta(baseline.summary, result.summary),
      rowDeltaSample: buildWeeklyRowDelta(baseline.rows, result.rows),
    };
  } catch (error) {
    return {
      label,
      status: "error" as const,
      strategy,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runWeeklyUpnSplitWithStrategy(
  input: { calendarDate: string },
  strategy?: WeeklyRunStrategy,
  db: Prisma.TransactionClient = prisma
): Promise<WeeklyUpnSplitResponse> {
  const source = await getWeeklyUpnSplitSourceData(input, db);
  validateScbuAmountRows(source.amountRows);
  const resolvedStrategy = normalizeStrategy(strategy);
  const effectiveMonthlyRows = applyMonthQuotaStrategy(source.monthlyRows, resolvedStrategy.monthQuotaStrategy);

  const p1Rows = buildWeeklyBaseRows(effectiveMonthlyRows);
  const p2Rows = attachCalendarContext(p1Rows, source.calendars);
  const p3Rows = attachDeliveryOpenOrderMetrics(p2Rows, source.dnRows, source.openOrderRows);
  const p4Rows = attachBscInventoryMetrics(
    p3Rows,
    source.inventoryRows,
    source.intransitRows,
    source.safetyStockRows
  );
  const p5Rows = attachWeekTargetMetrics(p4Rows);
  const p6Rows = attachOrSuggestionMetrics(p5Rows);
  const p7Rows = attachAdjustmentCapMetrics(p6Rows);
  const p8Rows = attachSuggestionAmountMetrics(p7Rows, source.purchasePriceRows);
  const amountRowByBu = new Map(source.amountRows.map((row) => [row.scBu, row]));
  const thresholdByBu = new Map(source.amountThresholds.map((row) => [row.scBu, row]));
  const gapSummaryByBu = new Map(source.calendars.map((calendar) => {
    const amountSummary = buildAmountTargetSummary(calendar, amountRowByBu.get(calendar.scBu) ?? null);
    return [calendar.scBu, buildWeekPatternGapSummary(
      p8Rows.filter((row) => row.scBu === calendar.scBu),
      amountSummary,
    )] as const;
  }));
  const p10Rows = attachSystemAdjustedQty(p8Rows, new Map(
    [...gapSummaryByBu].map(([scBu, gapSummary]) => [scBu, {
      ...gapSummary,
      overageThresholdPct: thresholdByBu.get(scBu)!.overageThresholdPct,
    }]),
  ));
  const p11Rows = attachConstraintMetrics(p10Rows, source.constraintRules, source.diohRows);
  const p12Rows = attachGapFillMetrics(p11Rows, new Map(
    [...gapSummaryByBu].map(([scBu, gapSummary]) => [scBu, {
      weekPatternGapAmount: gapSummary.weekPatternGapAmount,
      weekPatternGapPct: gapSummary.weekPatternGapPct,
      shortfallThresholdPct: thresholdByBu.get(scBu)!.shortfallThresholdPct,
    }]),
  ));
  const finalResult = attachFinalMetrics(
    p12Rows,
    source.bundleRules,
    new Map([...gapSummaryByBu].map(([scBu, gapSummary]) => [scBu, {
      weekPatternGapAmount: gapSummary.weekPatternGapAmount,
      targetPendingAmount: gapSummary.targetPendingAmount,
    }])),
  );
  const finalByBu = new Map(finalResult.buFinalSummaries.map((row) => [row.scBu, row]));
  const buSummaries = [...gapSummaryByBu].map(([scBu, gapSummary]) => {
    const finalSummary = finalByBu.get(scBu)!;
    return {
      scBu,
      ...gapSummary,
      overageThresholdPct: thresholdByBu.get(scBu)!.overageThresholdPct,
      shortfallThresholdPct: thresholdByBu.get(scBu)!.shortfallThresholdPct,
      systemDefaultFinalAmountTotal: finalSummary.systemDefaultFinalAmountTotal,
      systemDefaultPatternGapAmount: finalSummary.systemDefaultPatternGapAmount,
      finalAmountTotal: finalSummary.finalAmountTotal,
      finalPatternGapAmount: finalSummary.finalPatternGapAmount,
    };
  });
  const firstBu = buSummaries[0];
  const sumBu = (selector: (row: typeof firstBu) => number | null) =>
    sumCompleteNumbers(buSummaries.map(selector));

  return {
    periodMonth: source.periodMonth,
    calendarDate: source.calendarDate,
    sourceBatchId: source.sourceBatchId,
    strategy: {
      monthQuotaStrategy: resolvedStrategy.monthQuotaStrategy,
    },
    assumptions: [
      "当前月建议量承接月拆分最终补货结果 s_tolerance_replenish。",
      "Pattern 当前正式只使用 current_week_pattern_pct（对应 drawio 的 CD），并按截至本周累计比例理解。",
      "BF 直接承接本次月拆分结果 J；二者是同一计算时点的 LP+UPN 实际库存。BE 映射为 m_original_target_inventory，BJ 映射为 f_t2_purchase_3m_avg。",
      "DN 的本月已发货当前按 created_on >= Calendar.month_start_date 且 <= calendarDate 统计，避免把未来日期发货计入当前周。",
      "Pattern 导入只接受 0..100 百分数，内部统一除以 100 后参与 J/CB 计算。",
      "BU周金额目标按 period_week + SC_BU 唯一；actual_amount 是可空 CA，month_target_amount 是 CE。",
      "CA / CE 按本周和 SC_BU 读取；CD 按 SC_BU 来自 Calendar；CB 不导入，只按 CE × CD 计算。",
      "当前 BU 的 CA 缺失时，仅该 BU 金额链传播空值，数量链和其他 BU 继续。",
      "AR 按 CR - AQ 计算；RA 仅在 AS 大于本批次缺口补差阈值时执行。",
      "AS 按 AR / CE 计算；CE 为 0 时 AS 返回空值。",
      "SA 在 CR 或 AQ 小于等于 0 时为 0；AS 小于当前 SCBU 的超额缩减阈值负值时按 CR × AD / AQ 等比缩减并四舍五入，否则保持 AD；不做残差配平。",
      "BA 汇总同月同 UPN 的周不能超/月不能超规则；周不能超优先。月不能超使用 H_upn=sum(S_row)、O_upn 和 JB_upn；BD=N 或无可调余额时 BL=0。",
      "RA 按 BK、LP、PL5、UPN 一次排序后单次扫描，动态扣减 UPN 级 BH/BL；BK 为空或单价不大于0的行不参与补差。",
      "RRA 在最终一步按有效 UPN 套包量向下取整，未配置记录时有效套包量为1；余数忽略且不重新执行 RA。",
    ],
    summary: {
      totalRows: p7Rows.length,
      totalUpns: new Set(p7Rows.map((row) => row.upn)).size,
      currentWeekPatternPct: firstBu?.currentWeekPatternPct ?? 0,
      monthLeAmount: sumBu((row) => row.monthLeAmount),
      actualAmount: sumBu((row) => row.actualAmount),
      weekPatternAmount: sumBu((row) => row.weekPatternAmount),
      targetPendingAmount: sumBu((row) => row.targetPendingAmount),
      suggestedAmountTotal: sumBu((row) => row.suggestedAmountTotal),
      weekPatternGapAmount: sumBu((row) => row.weekPatternGapAmount),
      weekPatternGapPct: buSummaries.length === 1 ? firstBu.weekPatternGapPct : null,
      overageThresholdPct: firstBu?.overageThresholdPct ?? 0.05,
      shortfallThresholdPct: firstBu?.shortfallThresholdPct ?? 0.05,
      systemDefaultFinalAmountTotal: sumBu((row) => row.systemDefaultFinalAmountTotal),
      systemDefaultPatternGapAmount: sumBu((row) => row.systemDefaultPatternGapAmount),
      finalAmountTotal: sumBu((row) => row.finalAmountTotal),
      finalPatternGapAmount: sumBu((row) => row.finalPatternGapAmount),
    },
    buSummaries,
    rows: finalResult.rows,
  };
}

export async function runWeeklyUpnSplit(input: {
  calendarDate: string;
}): Promise<WeeklyUpnSplitResponse> {
  return runWeeklyUpnSplitWithStrategy(input);
}

export async function runAndPersistWeeklyUpnSplitWithClient(
  db: Prisma.TransactionClient,
  input: { calendarDate: string }
) {
  await acquireCalculationLock(db, "weekly-upn-split", input.calendarDate);
  const result = await runWeeklyUpnSplitWithStrategy(input, undefined, db);
  await persistWeeklyUpnSplitArtifactsWithClient(db, result);
  return result;
}

export async function runAndPersistWeeklyUpnSplit(input: { calendarDate: string }) {
  return prisma.$transaction(
    (tx) => runAndPersistWeeklyUpnSplitWithClient(tx, input),
    { maxWait: 10_000, timeout: 120_000 }
  );
}

export async function compareWeeklyUpnSplitStrategies(input: {
  calendarDate: string;
}): Promise<WeeklyStrategyComparisonResponse> {
  const baseline = await runWeeklyUpnSplitWithStrategy(input, {
    monthQuotaStrategy: "s_tolerance_replenish",
  });

  const comparisons = await Promise.all([
    runStrategyComparison(
      "月建议量 = 基础补货量(R)",
      input,
      { monthQuotaStrategy: "r_base_replenish" },
      baseline
    ),
    runStrategyComparison(
      "月建议量 = 理论补货量(Q)",
      input,
      { monthQuotaStrategy: "q_actual_theoretical" },
      baseline
    ),
  ]);

  return {
    input,
    baseline: {
      strategy: baseline.strategy!,
      sourceBatchId: baseline.sourceBatchId,
      summary: baseline.summary,
    },
    comparisons,
  };
}
