import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildWeeklyCalcBatchTableRows,
  summarizeWeeklyCalcBatchRows,
} from "@/lib/weekly-calc-batch-view";
import type { WeeklyUpnSplitResponse } from "@/server/services/calc/weekly-upn-split";
import { acquireCalculationLock } from "./calculation-lock.repository";
import { getCurrentUsdToCnyRate } from "@/server/services/currency/exchange-rate.service";
import { getDbEnvConfig } from "@/server/constants/db-env";

const WEEKLY_CALC_TABLE_SCHEMA = getDbEnvConfig().schema;
const weeklyCalcTableExistenceCache = new Map<string, boolean>();

function toPeriodDate(value: string) {
  return new Date(`${value}T08:00:00+08:00`);
}

function toNullableDecimal(value: number | null | undefined) {
  return value === null || value === undefined ? null : value;
}

async function ensureWeeklyCalcTableExists(tableName: string) {
  if (weeklyCalcTableExistenceCache.has(tableName)) {
    return weeklyCalcTableExistenceCache.get(tableName)!;
  }

  const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = $1
          and table_name = $2
      ) as "exists"
    `,
    WEEKLY_CALC_TABLE_SCHEMA,
    tableName
  );

  const exists = rows[0]?.exists ?? false;
  weeklyCalcTableExistenceCache.set(tableName, exists);
  return exists;
}

async function createWeeklyCalcBatch(input: {
  periodMonth: string;
  calendarDate: string;
  sourceBatchId: string;
  strategy: NonNullable<WeeklyUpnSplitResponse["strategy"]>;
  summary: WeeklyUpnSplitResponse["summary"];
}, db: Prisma.TransactionClient) {
  const calculatedAt = new Date();
  const exchangeRate = await getCurrentUsdToCnyRate(db);

  return db.calc_weekly_upn_split_batch.create({
    data: {
      period_month: toPeriodDate(input.periodMonth),
      calendar_date: toPeriodDate(input.calendarDate),
      source_batch_id: input.sourceBatchId,
      month_quota_strategy: input.strategy.monthQuotaStrategy,
      pattern_strategy: "current_week_pattern_pct",
      status: "SUCCESS",
      total_rows: input.summary.totalRows,
      total_upns: input.summary.totalUpns,
      current_week_pattern_pct: toNullableDecimal(input.summary.currentWeekPatternPct),
      month_le_amount: toNullableDecimal(input.summary.monthLeAmount),
      actual_amount: toNullableDecimal(input.summary.actualAmount),
      week_pattern_amount: toNullableDecimal(input.summary.weekPatternAmount),
      target_pending_amount: toNullableDecimal(input.summary.targetPendingAmount),
      suggested_amount_total: toNullableDecimal(input.summary.suggestedAmountTotal),
      week_pattern_gap_amount: toNullableDecimal(input.summary.weekPatternGapAmount),
      week_pattern_gap_pct: toNullableDecimal(input.summary.weekPatternGapPct),
      overage_threshold_pct: toNullableDecimal(input.summary.overageThresholdPct)!,
      shortfall_threshold_pct: toNullableDecimal(input.summary.shortfallThresholdPct)!,
      system_default_final_amount_total: toNullableDecimal(input.summary.systemDefaultFinalAmountTotal),
      system_default_pattern_gap_amount: toNullableDecimal(input.summary.systemDefaultPatternGapAmount),
      final_amount_total: toNullableDecimal(input.summary.finalAmountTotal),
      final_pattern_gap_amount: toNullableDecimal(input.summary.finalPatternGapAmount),
      calculation_currency: "USD",
      usd_to_cny_rate: exchangeRate.rate,
      calculated_at: calculatedAt,
    },
  });
}

async function replaceWeeklyCalcResults(
  batchId: string,
  rows: WeeklyUpnSplitResponse["rows"],
  db: Prisma.TransactionClient
) {
  await db.calc_weekly_upn_split_result.deleteMany({
    where: { batch_id: batchId },
  });

  if (rows.length === 0) {
    return;
  }

  await db.calc_weekly_upn_split_result.createMany({
    data: rows.map((row) => ({
      batch_id: batchId,
      sc_bu: row.scBu,
      lp_code: row.lpCode,
      pl5_code: row.pl5Code,
      upn: row.upn,
      month_quota_qty: toNullableDecimal(row.monthQuotaQty),
      current_week_pattern_pct: toNullableDecimal(row.currentWeekPatternPct),
      aa_month_delivered_suggestion_pct: toNullableDecimal(row.aaMonthDeliveredSuggestionPct),
      ab_current_inventory_days: toNullableDecimal(row.currentInventoryDays),
      bb_upn_abc_class: row.bbUpnAbcClass,
      be_original_target_inventory_qty: toNullableDecimal(row.originalTargetInventoryQty),
      bf_current_inventory_qty: toNullableDecimal(row.currentInventoryQty),
      bj_t2_purchase_3m_avg_qty: toNullableDecimal(row.t2Purchase3mAvgQty),
      cc_prev_week_pattern_pct: toNullableDecimal(row.prevWeekPatternPct),
      g_week_quota_pattern_total_qty: toNullableDecimal(row.gWeekQuotaPatternTotalQty),
      month_delivered_qty: toNullableDecimal(row.lMonthDeliveredQty),
      n_other_dealer_month_delivered_qty: toNullableDecimal(row.nOtherDealerMonthDeliveredQty),
      o_month_delivered_total_qty: toNullableDecimal(row.oMonthDeliveredTotalQty),
      open_order_or_qty: toNullableDecimal(row.pOpenOrderOrQty),
      other_dealer_open_order_or_qty: toNullableDecimal(row.rOtherDealerOpenOrderOrQty),
      s_open_order_or_total_qty: toNullableDecimal(row.sOpenOrderOrTotalQty),
      t_open_order_non_or_qty: toNullableDecimal(row.tOpenOrderNonOrQty),
      v_other_dealer_open_order_non_or_qty: toNullableDecimal(row.vOtherDealerOpenOrderNonOrQty),
      w_open_order_non_or_total_qty: toNullableDecimal(row.wOpenOrderNonOrTotalQty),
      x_open_order_total_qty: toNullableDecimal(row.xOpenOrderTotalQty),
      bsc_inventory_qty: toNullableDecimal(row.yaBscInventoryQty),
      intransit_qty: toNullableDecimal(row.ybIntransitQty),
      safety_stock_qty: toNullableDecimal(row.ycSafetyStockQty),
      bsc_available_qty: toNullableDecimal(row.yBscAvailableQty),
      week_quota_pattern_qty: toNullableDecimal(row.jWeekQuotaPatternQty),
      week_target_pending_qty: toNullableDecimal(row.jaWeekTargetPendingQty),
      week_target_pending_total_qty: toNullableDecimal(row.jbWeekTargetPendingTotalQty),
      inventory_status: row.zInventoryStatus,
      suggest_qty: toNullableDecimal(row.adOrSuggestQty),
      remaining_bsc_available_qty: toNullableDecimal(row.bhRemainingBscAvailableQty),
      target_inventory_adjustable_qty: toNullableDecimal(row.biTargetInventoryAdjustableQty),
      post_suggest_dioh: toNullableDecimal(row.bkPostSuggestDioh),
      unit_price: toNullableDecimal(row.amUnitPrice),
      suggest_amount: toNullableDecimal(row.aoOrSuggestAmount),
      system_adjusted_suggest_qty: toNullableDecimal(row.saSystemAdjustedQty),
      upn_month_cap_qty: toNullableDecimal(row.hUpnMonthlyCapQty),
      constraint_types: row.baConstraintTypes,
      adjustment_allowed_flag: row.bdAdjustmentAllowedFlag,
      monthly_remaining_adjustable_qty: toNullableDecimal(row.blMonthlyRemainingAdjustableQty),
      bundle_qty: toNullableDecimal(row.bundleQty),
      gap_fill_qty: toNullableDecimal(row.raGapFillQty),
      post_gap_fill_qty: toNullableDecimal(row.rbPostGapFillQty),
      system_default_final_qty: toNullableDecimal(row.systemDefaultFinalQty),
      manual_final_qty: null,
      final_qty: toNullableDecimal(row.rraFinalQty),
      final_amount: toNullableDecimal(row.rrbFinalAmount),
    })),
  });
}

async function replaceWeeklyBuSummaries(
  batchId: string,
  summaries: WeeklyUpnSplitResponse["buSummaries"],
  db: Prisma.TransactionClient,
) {
  await db.calc_weekly_upn_split_bu_summary.deleteMany({ where: { batch_id: batchId } });
  if (summaries.length === 0) return;
  await db.calc_weekly_upn_split_bu_summary.createMany({
    data: summaries.map((summary) => ({
      batch_id: batchId,
      sc_bu: summary.scBu,
      current_week_pattern_pct: toNullableDecimal(summary.currentWeekPatternPct),
      month_target_amount: toNullableDecimal(summary.monthLeAmount),
      actual_amount: toNullableDecimal(summary.actualAmount),
      week_pattern_amount: toNullableDecimal(summary.weekPatternAmount),
      target_pending_amount: toNullableDecimal(summary.targetPendingAmount),
      suggested_amount_total: toNullableDecimal(summary.suggestedAmountTotal),
      week_pattern_gap_amount: toNullableDecimal(summary.weekPatternGapAmount),
      week_pattern_gap_pct: toNullableDecimal(summary.weekPatternGapPct),
      overage_threshold_pct: summary.overageThresholdPct,
      shortfall_threshold_pct: summary.shortfallThresholdPct,
      system_default_final_amount_total: toNullableDecimal(summary.systemDefaultFinalAmountTotal),
      system_default_pattern_gap_amount: toNullableDecimal(summary.systemDefaultPatternGapAmount),
      final_amount_total: toNullableDecimal(summary.finalAmountTotal),
      final_pattern_gap_amount: toNullableDecimal(summary.finalPatternGapAmount),
    })),
  });
}

export async function persistWeeklyUpnSplitArtifacts(
  result: WeeklyUpnSplitResponse
) {
  return prisma.$transaction(
    async (tx) => {
      await acquireCalculationLock(tx, "weekly-upn-split", result.calendarDate);
      return persistWeeklyUpnSplitArtifactsWithClient(tx, result);
    },
    { maxWait: 10_000, timeout: 120_000 }
  );
}

export async function persistWeeklyUpnSplitArtifactsWithClient(
  db: Prisma.TransactionClient,
  result: WeeklyUpnSplitResponse
) {
  await clearCurrentWeeklyCalculationOutputs(db);
  const batch = await createWeeklyCalcBatch(
    {
      periodMonth: result.periodMonth,
      calendarDate: result.calendarDate,
      sourceBatchId: result.sourceBatchId,
      strategy: result.strategy!,
      summary: result.summary,
    },
    db,
  );
  const exchangeRate = await getCurrentUsdToCnyRate(db);

  await db.calc_weekly_upn_split_batch.update({
    where: { id: batch.id },
    data: {
      period_month: toPeriodDate(result.periodMonth),
      calendar_date: toPeriodDate(result.calendarDate),
      source_batch_id: result.sourceBatchId,
      month_quota_strategy: result.strategy!.monthQuotaStrategy,
      pattern_strategy: "current_week_pattern_pct",
      status: "SUCCESS",
      total_rows: result.summary.totalRows,
      total_upns: result.summary.totalUpns,
      current_week_pattern_pct: toNullableDecimal(result.summary.currentWeekPatternPct),
      month_le_amount: toNullableDecimal(result.summary.monthLeAmount),
      actual_amount: toNullableDecimal(result.summary.actualAmount),
      week_pattern_amount: toNullableDecimal(result.summary.weekPatternAmount),
      target_pending_amount: toNullableDecimal(result.summary.targetPendingAmount),
      suggested_amount_total: toNullableDecimal(result.summary.suggestedAmountTotal),
      week_pattern_gap_amount: toNullableDecimal(result.summary.weekPatternGapAmount),
      week_pattern_gap_pct: toNullableDecimal(result.summary.weekPatternGapPct),
      overage_threshold_pct: toNullableDecimal(result.summary.overageThresholdPct)!,
      shortfall_threshold_pct: toNullableDecimal(result.summary.shortfallThresholdPct)!,
      system_default_final_amount_total: toNullableDecimal(result.summary.systemDefaultFinalAmountTotal),
      system_default_pattern_gap_amount: toNullableDecimal(result.summary.systemDefaultPatternGapAmount),
      final_amount_total: toNullableDecimal(result.summary.finalAmountTotal),
      final_pattern_gap_amount: toNullableDecimal(result.summary.finalPatternGapAmount),
      calculation_currency: "USD",
      usd_to_cny_rate: exchangeRate.rate,
      calculated_at: new Date(),
    },
  });

  await replaceWeeklyCalcResults(batch.id, result.rows, db);
  await replaceWeeklyBuSummaries(batch.id, result.buSummaries, db);
  return batch;
}

export async function listWeeklyCalcBatches() {
  if (!(await ensureWeeklyCalcTableExists("calc_weekly_upn_split_batch"))) {
    return [];
  }

  const current = await prisma.calc_weekly_upn_split_batch.findFirst({
    orderBy: [{ calculated_at: "desc" }, { created_at: "desc" }],
  });
  return current ? [current] : [];
}

export async function getWeeklyCalcBatchSummary() {
  const batches = await listWeeklyCalcBatches();
  const rows = buildWeeklyCalcBatchTableRows(batches);
  const overview = summarizeWeeklyCalcBatchRows(rows);

  return {
    batches,
    rows,
    overview,
  };
}

export async function getWeeklyCalcBatchDetail(batchId: string) {
  if (!(await ensureWeeklyCalcTableExists("calc_weekly_upn_split_batch"))) {
    return null;
  }

  const batch = await prisma.calc_weekly_upn_split_batch.findFirst({
    where: { calendar_date: toPeriodDate(batchId) },
  });

  if (!batch) return null;

  return prisma.calc_weekly_upn_split_batch.findUnique({
    where: { id: batch.id },
    include: {
      bu_summaries: { orderBy: { sc_bu: "asc" } },
      results: {
        orderBy: [{ sc_bu: "asc" }, { lp_code: "asc" }, { pl5_code: "asc" }, { upn: "asc" }],
      },
    },
  });
}

export async function clearCurrentWeeklyCalculationOutputs(db: Prisma.TransactionClient) {
  await db.calc_weekly_upn_split_batch.deleteMany({});
}
