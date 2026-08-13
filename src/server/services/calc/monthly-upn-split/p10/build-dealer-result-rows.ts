import { add10, compareDecimal, max10, multiply10, subtract10 } from "../../calculation-decimal";
import { round10, safeDiv } from "../upn-split.helpers";
import { calcXAfterAllocationDays } from "../p4/calc-x-after-allocation-days";
import { calcTargetInventories } from "../p5/calc-target-inventories";
import { calcBaseReplenish, calcToleranceReplenish } from "../p9/calc-r-actual-replenish";
import { calcAdjustedDioh } from "./calc-s-adjusted-dioh";
import type { UpnSplitResult, UpnSplitTraceRow } from "../upn-split.types";
import { toDealerPl5Key } from "../p1/p1-key-utils";
import type { DealerQContext } from "../p3/dealer-calc-context";
import { getUpnSplitErrorDefinition } from "@/server/constants/upn-split-error-catalog";

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

export function hasPl5AllocationMismatch(totalFinalReplenish: number, targetAllocateQty: number) {
  return compareDecimal(totalFinalReplenish, targetAllocateQty) !== 0;
}

/**
 * drawio P10
 * 基于单个 dealer 的中间态与 PL5 聚合结果，组装最终结果行。
 */
export function buildDealerResultArtifacts(params: DealerQContext) {
  const { scBu, dealerCode, upnQState, pl5_fStar, pl5_iStar, pl5_jStar, pl5_qStar, wMap } = params;
  const results: UpnSplitResult[] = [];
  const traces: UpnSplitTraceRow[] = [];
  const rBaseByRowKey = new Map<string, number>();
  const rBaseTotalByPl5 = new Map<string, number>();
  const toleranceMixTotalByPl5 = new Map<string, number>();
  const pl5ResultRows = new Map<string, UpnSplitResult[]>();
  const pl5TraceRows = new Map<string, UpnSplitTraceRow[]>();

  for (const [activeRowKey, v] of upnQState) {
    const w = wMap.get(toDealerPl5Key(scBu, dealerCode, v.pl5)) ?? 0;
    const qStar = pl5_qStar.get(v.pl5) || 0;
    const rBase = calcBaseReplenish({ q: v.q, qStar, w });

    rBaseByRowKey.set(activeRowKey, rBase);
    rBaseTotalByPl5.set(v.pl5, add10(rBaseTotalByPl5.get(v.pl5) || 0, rBase));
    if (v.l) {
      toleranceMixTotalByPl5.set(v.pl5, add10(toleranceMixTotalByPl5.get(v.pl5) || 0, v.e));
    }
  }

  for (const [activeRowKey, v] of upnQState) {
    const fStar = pl5_fStar.get(v.pl5) || 0;
    const iStar = pl5_iStar.get(v.pl5) || 0;
    const jStar = pl5_jStar.get(v.pl5) || 0;
    const w = wMap.get(toDealerPl5Key(scBu, dealerCode, v.pl5)) ?? 0;
    const q = v.q;
    const qStar = pl5_qStar.get(v.pl5) || 0;
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
      rBaseTotal: rBaseTotalByPl5.get(v.pl5) || 0,
      mixPortion: v.e,
      tolerance: v.l,
      toleranceMixTotal: toleranceMixTotalByPl5.get(v.pl5) || 0,
    });
    const tAdjusted = calcAdjustedDioh({ j: v.j, r: sTolerance, i: v.i, f: v.f });
    const currentDioh = multiply10(safeDiv(v.j, v.g), 30);
    const replenishGapTo30Qty = calcReplenishGapTo30Qty(v.g, v.j, currentDioh);
    const hasUpnM0Zero = compareDecimal(v.g, 0) === 0;
    const upnM0ZeroError =
      !v.hasQuota && hasUpnM0Zero ? getUpnSplitErrorDefinition("UPN_M0_ZERO") : null;
    const lowCurrentDiohError =
      !hasUpnM0Zero && !v.hasQuota && compareDecimal(currentDioh, 30) < 0
        ? getUpnSplitErrorDefinition("CURRENT_DIOH_LT_30_NEED_REPLENISH")
        : null;
    const primaryWarning = upnM0ZeroError ?? lowCurrentDiohError;

    const resultRow: UpnSplitResult = {
      scBu,
      dealerlpcode: dealerCode,
      upn: v.upn,
      pl5Code: v.pl5,
      lpCode: v.lpCode,
      e_t2MixPortion: round10(v.e),
      f_t2Purchase3mAvg: round10(v.f),
      g_t2PurchaseM0: round10(v.g),
      h_t2PurchaseMtd: round10(v.h),
      i_t2PurchaseMtg: round10(v.i),
      j_openingInventory: round10(v.j),
      k_targetDays: round10(v.k),
      l_tolerance: v.l,
      iStarPl5Mtg: round10(iStar),
      jStarPl5Inventory: round10(jStar),
      x_afterAllocateDays: round10(x),
      m_originalTargetInventory: round10(m),
      n_newTargetInventory: round10(n),
      o_finalTargetInventory: round10(o),
      p_theoreticalReplenish: round10(p),
      q_actualTheoretical: round10(q),
      qStarPl5Theoretical: round10(qStar),
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

    const traceRow: UpnSplitTraceRow = {
      scBu,
      dealerlpcode: dealerCode,
      upn: v.upn,
      pl5Code: v.pl5,
      lpCode: v.lpCode,
      h_t2PurchaseMtd: round10(v.h),
      e_t2MixPortion: round10(v.e),
      t_pl5PurchaseM2: round10(v.t),
      u_pl5PurchaseM1: round10(v.u),
      v_pl5PurchaseM0Fcst: round10(v.v),
      f_t2Purchase3mAvg: round10(v.f),
      g_t2PurchaseM0: round10(v.g),
      j_openingInventory: round10(v.j),
      k_targetDays: round10(v.k),
      l_tolerance: v.l,
      i_t2PurchaseMtg: round10(v.i),
      currentDioh: round10(currentDioh),
      replenishGapTo30Qty: replenishGapTo30Qty === null ? null : round10(replenishGapTo30Qty),
      w_mtgAllocateQty: round10(w),
      jStarPl5Inventory: round10(jStar),
      iStarPl5Mtg: round10(iStar),
      x_afterAllocateDays: round10(x),
      m_originalTargetInventory: round10(m),
      n_newTargetInventory: round10(n),
      o_finalTargetInventory: round10(o),
      p_theoreticalReplenish: round10(p),
      q_actualTheoretical: round10(q),
      qStarPl5Theoretical: round10(qStar),
      r_baseReplenish: round10(rBase),
      s_toleranceReplenish: round10(sTolerance),
      t_adjustedDioh: round10(tAdjusted),
      isError: Boolean(primaryWarning),
      errorCode: primaryWarning?.code,
      errorMessage: primaryWarning?.message,
    };

    results.push(resultRow);
    traces.push(traceRow);

    if (!pl5ResultRows.has(v.pl5)) pl5ResultRows.set(v.pl5, []);
    pl5ResultRows.get(v.pl5)!.push(resultRow);
    if (!pl5TraceRows.has(v.pl5)) pl5TraceRows.set(v.pl5, []);
    pl5TraceRows.get(v.pl5)!.push(traceRow);
  }

  const allocateMismatchError = getUpnSplitErrorDefinition("PL5_ALLOCATE_MISMATCH");
  for (const [pl5Code, rows] of pl5ResultRows) {
    const traceRows = pl5TraceRows.get(pl5Code) ?? [];
    const w = rows[0]?.w_mtgAllocateQty ?? 0;
    if (compareDecimal(w, 0) <= 0) continue;
    const totalFinalReplenish = rows.reduce(
      (sum, row) => add10(sum, row.s_toleranceReplenish),
      0
    );
    if (hasPl5AllocationMismatch(totalFinalReplenish, w)) {
      const message = `${allocateMismatchError.message}（PL5=${pl5Code}，S汇总=${totalFinalReplenish}，W=${w}）`;
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
