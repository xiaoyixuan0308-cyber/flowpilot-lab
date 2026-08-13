import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { acquireCalculationLock } from "@/server/repositories/calculation-lock.repository";

const NUMERIC_INTEGER_DIGITS = 20;
const NUMERIC_SCALE = 10;
const NUMERIC_ABS_LIMIT = new Decimal(10).pow(NUMERIC_INTEGER_DIGITS);

export interface WeeklyFinalQtyChange {
  resultId: string;
  manualFinalQty: string | number | null;
}

export interface WeeklyFinalAdjustmentWarning {
  code:
    | "BUNDLE_MISMATCH"
    | "BH_LIMIT"
    | "BI_LIMIT"
    | "BL_LIMIT"
    | "SHARED_INVENTORY"
    | "AMOUNT_GAP";
  message: string;
  resultId?: string;
  upn?: string;
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseNumeric30Scale10(value: string | number) {
  if (typeof value === "string" && value.trim() === "") {
    throw new Error("人工最终数量不能为空字符串");
  }

  let parsed: Decimal;
  try {
    parsed = new Decimal(value);
  } catch {
    throw new Error(`人工最终数量不是合法数值：${String(value)}`);
  }

  if (!parsed.isFinite()) {
    throw new Error(`人工最终数量必须是有限数值：${String(value)}`);
  }

  if (parsed.isNegative()) {
    throw new Error("人工最终数量不能为负数");
  }

  if (!parsed.isInteger()) {
    throw new Error("人工最终数量必须为整数");
  }

  const normalized = parsed.toDecimalPlaces(NUMERIC_SCALE, Decimal.ROUND_HALF_UP);
  if (normalized.abs().gte(NUMERIC_ABS_LIMIT)) {
    throw new Error("人工最终数量超出 numeric(30,10) 可写入范围");
  }

  return normalized.toFixed(NUMERIC_SCALE);
}

function multiplyNumeric(left: Decimal.Value, right: Decimal.Value) {
  const normalized = new Decimal(left)
    .times(right)
    .toDecimalPlaces(NUMERIC_SCALE, Decimal.ROUND_HALF_UP);
  if (!normalized.isFinite() || normalized.abs().gte(NUMERIC_ABS_LIMIT)) {
    throw new Error("人工调整后的最终金额超出 numeric(30,10) 可写入范围");
  }
  return normalized.toFixed(NUMERIC_SCALE);
}

function subtractNumeric(left: Decimal.Value, right: Decimal.Value) {
  return new Decimal(left)
    .minus(right)
    .toDecimalPlaces(NUMERIC_SCALE, Decimal.ROUND_HALF_UP)
    .toFixed(NUMERIC_SCALE);
}

function buildWarnings(
  rows: Array<{
    id: string;
    upn: string;
    manual_final_qty: Decimal | null;
    final_qty: Decimal | null;
    bundle_qty: Decimal | null;
    suggest_qty: Decimal | null;
    remaining_bsc_available_qty: Decimal | null;
    target_inventory_adjustable_qty: Decimal | null;
    monthly_remaining_adjustable_qty: Decimal | null;
    other_dealer_open_order_or_qty: Decimal | null;
    bsc_available_qty: Decimal | null;
  }>,
  finalPatternGapAmount: string | null,
) {
  const warnings: WeeklyFinalAdjustmentWarning[] = [];

  for (const row of rows) {
    if (row.manual_final_qty === null || row.final_qty === null) continue;

    const finalQty = new Decimal(row.final_qty.toString());
    const suggestQty = new Decimal(row.suggest_qty?.toString() ?? 0);
    const extraQty = Decimal.max(finalQty.minus(suggestQty), 0);

    if (row.bundle_qty && !row.bundle_qty.isZero()) {
      const bundleQty = new Decimal(row.bundle_qty.toString());
      if (!finalQty.mod(bundleQty).isZero()) {
        warnings.push({
          code: "BUNDLE_MISMATCH",
          resultId: row.id,
          upn: row.upn,
          message: `人工最终数量不是套包 ${bundleQty.toString()} 的整数倍。`,
        });
      }
    }

    const limits: Array<{
      code: "BH_LIMIT" | "BI_LIMIT" | "BL_LIMIT";
      value: Decimal | null;
      label: string;
    }> = [
      { code: "BH_LIMIT", value: row.remaining_bsc_available_qty, label: "BH" },
      { code: "BI_LIMIT", value: row.target_inventory_adjustable_qty, label: "BI" },
      { code: "BL_LIMIT", value: row.monthly_remaining_adjustable_qty, label: "BL" },
    ];

    for (const limit of limits) {
      if (limit.value !== null && extraQty.gt(limit.value.toString())) {
        warnings.push({
          code: limit.code,
          resultId: row.id,
          upn: row.upn,
          message: `人工增加量 ${extraQty.toString()} 超过 ${limit.label} ${limit.value.toString()}。`,
        });
      }
    }
  }

  const rowsByUpn = new Map<string, typeof rows>();
  for (const row of rows) {
    const group = rowsByUpn.get(row.upn) ?? [];
    group.push(row);
    rowsByUpn.set(row.upn, group);
  }

  for (const [upn, upnRows] of rowsByUpn) {
    if (!upnRows.some((row) => row.manual_final_qty !== null)) continue;
    if (upnRows.some((row) => row.final_qty === null)) continue;

    const finalQtyTotal = upnRows.reduce(
      (sum, row) => sum.plus(row.final_qty!.toString()),
      new Decimal(0),
    );
    const otherDealerOpenOrder = upnRows.find(
      (row) => row.other_dealer_open_order_or_qty !== null,
    )?.other_dealer_open_order_or_qty;
    const availableQty = upnRows.find(
      (row) => row.bsc_available_qty !== null,
    )?.bsc_available_qty;

    if (
      otherDealerOpenOrder != null &&
      availableQty != null &&
      finalQtyTotal.plus(otherDealerOpenOrder.toString()).gt(availableQty.toString())
    ) {
      warnings.push({
        code: "SHARED_INVENTORY",
        upn,
        message: `UPN 生效最终数量与非 LP OR 订单合计超过共享可用库存。`,
      });
    }
  }

  if (
    rows.some((row) => row.manual_final_qty !== null) &&
    finalPatternGapAmount !== null &&
    !new Decimal(finalPatternGapAmount).isZero()
  ) {
    warnings.push({
      code: "AMOUNT_GAP",
      message: `人工调整后批次最终差额为 ${finalPatternGapAmount}。`,
    });
  }

  return warnings;
}

export async function saveWeeklyFinalQtyAdjustments(input: {
  calendarDate: string;
  batchId: string;
  changes: WeeklyFinalQtyChange[];
}) {
  if (!input.calendarDate || !input.batchId || !Array.isArray(input.changes)) {
    throw new Error("缺少人工调整批次、日期或修改列表");
  }

  const duplicateIds = input.changes
    .map((change) => change.resultId)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    throw new Error(`同一结果行不能重复提交：${duplicateIds[0]}`);
  }

  const normalizedChanges = input.changes.map((change) => {
    if (!change.resultId) throw new Error("人工调整缺少结果行 ID");
    return {
      resultId: change.resultId,
      manualFinalQty:
        change.manualFinalQty === null
          ? null
          : parseNumeric30Scale10(change.manualFinalQty),
    };
  });

  return prisma.$transaction(
    async (tx) => {
      await acquireCalculationLock(tx, "weekly-upn-split", input.calendarDate);

      const batch = await tx.calc_weekly_upn_split_batch.findUnique({
        where: { id: input.batchId },
        include: { results: true, bu_summaries: true },
      });
      if (!batch || formatDate(batch.calendar_date) !== input.calendarDate) {
        throw new Error("指定周批次不存在或与计算基准日不一致");
      }

      const rowById = new Map(batch.results.map((row) => [row.id, row]));
      for (const change of normalizedChanges) {
        if (!rowById.has(change.resultId)) {
          throw new Error(`结果行不属于指定周批次：${change.resultId}`);
        }
      }

      for (const change of normalizedChanges) {
        const row = rowById.get(change.resultId)!;
        const effectiveFinalQty =
          change.manualFinalQty ?? row.system_default_final_qty?.toString() ?? null;
        const finalAmount =
          effectiveFinalQty === null || row.unit_price === null
            ? null
            : multiplyNumeric(effectiveFinalQty, row.unit_price.toString());

        await tx.calc_weekly_upn_split_result.update({
          where: { id: row.id },
          data: {
            manual_final_qty: change.manualFinalQty,
            final_qty: effectiveFinalQty,
            final_amount: finalAmount,
          },
        });
      }

      const refreshedRows = await tx.calc_weekly_upn_split_result.findMany({
        where: { batch_id: batch.id },
        orderBy: [{ sc_bu: "asc" }, { lp_code: "asc" }, { pl5_code: "asc" }, { upn: "asc" }],
      });
      const updatedBuSummaries = [];
      for (const summary of batch.bu_summaries) {
        const buRows = refreshedRows.filter((row) => row.sc_bu === summary.sc_bu);
        const allAmountsKnown = buRows.every((row) => row.final_amount !== null);
        const finalAmountTotal = allAmountsKnown
          ? buRows.reduce(
              (sum, row) => sum.plus(row.final_amount!.toString()),
              new Decimal(0),
            ).toDecimalPlaces(NUMERIC_SCALE, Decimal.ROUND_HALF_UP).toFixed(NUMERIC_SCALE)
          : null;
        const finalPatternGapAmount = summary.target_pending_amount === null || finalAmountTotal === null
          ? null
          : subtractNumeric(summary.target_pending_amount.toString(), finalAmountTotal);
        updatedBuSummaries.push(await tx.calc_weekly_upn_split_bu_summary.update({
          where: { id: summary.id },
          data: { final_amount_total: finalAmountTotal, final_pattern_gap_amount: finalPatternGapAmount },
        }));
      }
      const allBuAmountsKnown = updatedBuSummaries.every((row) => row.final_amount_total !== null);
      const finalAmountTotal = allBuAmountsKnown
        ? updatedBuSummaries.reduce(
            (sum, row) => sum.plus(row.final_amount_total!.toString()),
            new Decimal(0),
          ).toDecimalPlaces(NUMERIC_SCALE, Decimal.ROUND_HALF_UP).toFixed(NUMERIC_SCALE)
        : null;
      const allBuGapsKnown = updatedBuSummaries.every((row) => row.final_pattern_gap_amount !== null);
      const finalPatternGapAmount = allBuGapsKnown
        ? updatedBuSummaries.reduce(
            (sum, row) => sum.plus(row.final_pattern_gap_amount!.toString()),
            new Decimal(0),
          ).toDecimalPlaces(NUMERIC_SCALE, Decimal.ROUND_HALF_UP).toFixed(NUMERIC_SCALE)
        : null;

      const updatedBatch = await tx.calc_weekly_upn_split_batch.update({
        where: { id: batch.id },
        data: {
          final_amount_total: finalAmountTotal,
          final_pattern_gap_amount: finalPatternGapAmount,
        },
      });

      return {
        batch: {
          id: updatedBatch.id,
          calendarDate: formatDate(updatedBatch.calendar_date),
          systemDefaultFinalAmountTotal:
            updatedBatch.system_default_final_amount_total?.toString() ?? null,
          systemDefaultPatternGapAmount:
            updatedBatch.system_default_pattern_gap_amount?.toString() ?? null,
          finalAmountTotal: updatedBatch.final_amount_total?.toString() ?? null,
          finalPatternGapAmount: updatedBatch.final_pattern_gap_amount?.toString() ?? null,
        },
        rows: refreshedRows.map((row) => ({
          id: row.id,
          manualFinalQty: row.manual_final_qty?.toString() ?? null,
          finalQty: row.final_qty?.toString() ?? null,
          finalAmount: row.final_amount?.toString() ?? null,
        })),
        buSummaries: updatedBuSummaries.map((summary) => ({
          scBu: summary.sc_bu,
          finalAmountTotal: summary.final_amount_total?.toString() ?? null,
          finalPatternGapAmount: summary.final_pattern_gap_amount?.toString() ?? null,
        })),
        warnings: buildWarnings(
          refreshedRows,
          updatedBatch.final_pattern_gap_amount?.toString() ?? null,
        ),
      };
    },
    { maxWait: 10_000, timeout: 120_000 },
  );
}
