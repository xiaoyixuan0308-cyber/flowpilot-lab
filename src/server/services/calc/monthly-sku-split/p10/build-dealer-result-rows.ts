import { add10, compareDecimal, max10, multiply10, subtract10 } from "../../calculation-decimal";
import { round10, safeDiv } from "../sku-split.helpers";
import { calcXAfterAllocationDays } from "../p4/calc-x-after-allocation-days";
import { calcTargetInventories } from "../p5/calc-target-inventories";
import { calcBaseReplenish, calcToleranceReplenish } from "../p9/calc-r-actual-replenish";
import { calcAdjustedDioh } from "./calc-s-adjusted-dioh";
import type { SkuSplitResult, SkuSplitTraceRow } from "../sku-split.types";
import { toDealerCategoryKey } from "../p1/p1-key-utils";
import type { DealerQContext } from "../p3/dealer-calc-context";
import { getSkuSplitErrorDefinition } from "@/server/constants/sku-split-error-catalog";

export function calcReplenishGapTo30Qty(
  m0Qty: number,
  openingInventoryQty: number,
  currentDioh: number,
) {
  if (compareDecimal(m0Qty, 0) <= 0) return null;
  return compareDecimal(currentDioh, 30) < 0
    ? max10(subtract10(m0Qty, openingInventoryQty), 0)
    : 0;
}

export function hasCategoryAllocationMismatch(totalFinalReplenish: number, targetAllocateQty: number) {
  return compareDecimal(totalFinalReplenish, targetAllocateQty) !== 0;
}

/**
 * drawio P10
 * 基于单个 dealer 的中间态与 产品分类 聚合结果，组装最终结果行。
 */
export function buildDealerResultArtifacts(params: DealerQContext) {
  const { businessUnit, dealerCode, skuQState, category_fStar, category_iStar, category_jStar, category_qStar, wMap } = params;
  const results: SkuSplitResult[] = [];
  const traces: SkuSplitTraceRow[] = [];
  const rBaseByRowKey = new Map<string, number>();
  const rBaseTotalByCategory = new Map<string, number>();
  const toleranceMixTotalByCategory = new Map<string, number>();
  const categoryResultRows = new Map<string, SkuSplitResult[]>();
  const categoryTraceRows = new Map<string, SkuSplitTraceRow[]>();

  for (const [activeRowKey, v] of skuQState) {
    const w = wMap.get(toDealerCategoryKey(businessUnit, dealerCode, v.category)) ?? 0;
    const qStar = category_qStar.get(v.category) || 0;
    const rBase = calcBaseReplenish({ q: v.q, qStar, w });

    rBaseByRowKey.set(activeRowKey, rBase);
    rBaseTotalByCategory.set(v.category, add10(rBaseTotalByCategory.get(v.category) || 0, rBase));
    if (v.l) {
      toleranceMixTotalByCategory.set(v.category, add10(toleranceMixTotalByCategory.get(v.category) || 0, v.e));
    }
  }

  for (const [activeRowKey, v] of skuQState) {
    const fStar = category_fStar.get(v.category) || 0;
    const iStar = category_iStar.get(v.category) || 0;
    const jStar = category_jStar.get(v.category) || 0;
    const w = wMap.get(toDealerCategoryKey(businessUnit, dealerCode, v.category)) ?? 0;
    const q = v.q;
    const qStar = category_qStar.get(v.category) || 0;
    const x = calcXAfterAllocationDays({
      jStar,
      w,
      iStar,
      fStar,
    });

    const { m, n, o, p } = calcTargetInventories({
      x,
      f: v.f,
      k: v.k,
      l: v.l,
      i: v.i,
      j: v.j,
    });

    const rBase = rBaseByRowKey.get(activeRowKey) ?? 0;
    const sTolerance = calcToleranceReplenish({
      rBase,
      w,
      rBaseTotal: rBaseTotalByCategory.get(v.category) || 0,
      mixPortion: v.e,
      tolerance: v.l,
      toleranceMixTotal: toleranceMixTotalByCategory.get(v.category) || 0,
    });
    const tAdjusted = calcAdjustedDioh({ j: v.j, r: sTolerance, i: v.i, f: v.f });
    const currentDioh = multiply10(safeDiv(v.j, v.g), 30);
    const replenishGapTo30Qty = calcReplenishGapTo30Qty(v.g, v.j, currentDioh);
    const hasSkuM0Zero = compareDecimal(v.g, 0) === 0;
    const skuM0ZeroError =
      !v.hasQuota && hasSkuM0Zero ? getSkuSplitErrorDefinition("SKU_M0_ZERO") : null;
    const lowCurrentDiohError =
      !hasSkuM0Zero && !v.hasQuota && compareDecimal(currentDioh, 30) < 0
        ? getSkuSplitErrorDefinition("CURRENT_DIOH_LT_30_NEED_REPLENISH")
        : null;
    const primaryWarning = skuM0ZeroError ?? lowCurrentDiohError;

    const resultRow: SkuSplitResult = {
      businessUnit,
      dealer_channel_code: dealerCode,
      sku: v.sku,
      categoryCode: v.category,
      channelCode: v.channelCode,
      e_t2MixPortion: round10(v.e),
      f_t2Purchase3mAvg: round10(v.f),
      g_t2PurchaseM0: round10(v.g),
      h_t2PurchaseMtd: round10(v.h),
      i_t2PurchaseMtg: round10(v.i),
      j_openingInventory: round10(v.j),
      k_targetDays: round10(v.k),
      l_tolerance: v.l,
      iStarCategoryMtg: round10(iStar),
      jStarCategoryInventory: round10(jStar),
      x_afterAllocateDays: round10(x),
      m_originalTargetInventory: round10(m),
      n_newTargetInventory: round10(n),
      o_finalTargetInventory: round10(o),
      p_theoreticalReplenish: round10(p),
      q_actualTheoretical: round10(q),
      qStarCategoryTheoretical: round10(qStar),
      w_mtgAllocateQty: round10(w),
      r_baseReplenish: round10(rBase),
      s_toleranceReplenish: round10(sTolerance),
      t_adjustedDioh: round10(tAdjusted),
      currentDioh: round10(currentDioh),
      replenishGapTo30Qty: replenishGapTo30Qty === null ? null : round10(replenishGapTo30Qty),
      isError: Boolean(primaryWarning),
      errorCode: primaryWarning?.code,
      errorMessage: primaryWarning?.message,
    };

    const traceRow: SkuSplitTraceRow = {
      businessUnit,
      dealer_channel_code: dealerCode,
      sku: v.sku,
      categoryCode: v.category,
      channelCode: v.channelCode,
      h_t2PurchaseMtd: round10(v.h),
      e_t2MixPortion: round10(v.e),
      t_categoryPurchaseM2: round10(v.t),
      u_categoryPurchaseM1: round10(v.u),
      v_categoryPurchaseM0Fcst: round10(v.v),
      f_t2Purchase3mAvg: round10(v.f),
      g_t2PurchaseM0: round10(v.g),
      j_openingInventory: round10(v.j),
      k_targetDays: round10(v.k),
      l_tolerance: v.l,
      i_t2PurchaseMtg: round10(v.i),
      currentDioh: round10(currentDioh),
      replenishGapTo30Qty: replenishGapTo30Qty === null ? null : round10(replenishGapTo30Qty),
      w_mtgAllocateQty: round10(w),
      jStarCategoryInventory: round10(jStar),
      iStarCategoryMtg: round10(iStar),
      x_afterAllocateDays: round10(x),
      m_originalTargetInventory: round10(m),
      n_newTargetInventory: round10(n),
      o_finalTargetInventory: round10(o),
      p_theoreticalReplenish: round10(p),
      q_actualTheoretical: round10(q),
      qStarCategoryTheoretical: round10(qStar),
      r_baseReplenish: round10(rBase),
      s_toleranceReplenish: round10(sTolerance),
      t_adjustedDioh: round10(tAdjusted),
      isError: Boolean(primaryWarning),
      errorCode: primaryWarning?.code,
      errorMessage: primaryWarning?.message,
    };

    results.push(resultRow);
    traces.push(traceRow);

    if (!categoryResultRows.has(v.category)) categoryResultRows.set(v.category, []);
    categoryResultRows.get(v.category)!.push(resultRow);
    if (!categoryTraceRows.has(v.category)) categoryTraceRows.set(v.category, []);
    categoryTraceRows.get(v.category)!.push(traceRow);
  }

  const allocateMismatchError = getSkuSplitErrorDefinition("CATEGORY_ALLOCATE_MISMATCH");
  for (const [categoryCode, rows] of categoryResultRows) {
    const traceRows = categoryTraceRows.get(categoryCode) ?? [];
    const w = rows[0]?.w_mtgAllocateQty ?? 0;
    if (compareDecimal(w, 0) <= 0) continue;
    const totalFinalReplenish = rows.reduce(
      (sum, row) => add10(sum, row.s_toleranceReplenish),
      0
    );
    if (hasCategoryAllocationMismatch(totalFinalReplenish, w)) {
      const message = `${allocateMismatchError.message}（产品分类=${categoryCode}，S汇总=${totalFinalReplenish}，W=${w}）`;
      for (const row of rows) {
        row.isError = true;
        row.errorCode = row.errorCode ?? allocateMismatchError.code;
        row.errorMessage = row.errorMessage ?? message;
      }
      for (const row of traceRows) {
        row.isError = true;
        row.errorCode = row.errorCode ?? allocateMismatchError.code;
        row.errorMessage = row.errorMessage ?? message;
      }
    }
  }

  return {
    results,
    traces,
  };
}

export function buildDealerResultRows(params: DealerQContext) {
  return buildDealerResultArtifacts(params).results;
}
