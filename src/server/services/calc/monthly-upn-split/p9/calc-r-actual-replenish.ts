import { add10, compareDecimal, max10, multiply10, subtract10 } from "../../calculation-decimal";
import { safeDiv } from "../upn-split.helpers";

/**
 * Barry 口径：
 * R = IF(Q* < W, Q, Q / (Q* / W))
 */
export function calcBaseReplenish(params: { q: number; qStar: number; w: number }) {
  const { q, qStar, w } = params;
  if (compareDecimal(qStar, w) < 0) return q;
  return multiply10(safeDiv(q, qStar), w);
}

/**
 * Barry 口径：
 * S = IF(L="N", R, R + (W - SUM(R by LP/PL5)) * E / SUMIF(L="Y", E))
 */
export function calcToleranceReplenish(params: {
  rBase: number;
  w: number;
  rBaseTotal: number;
  mixPortion: number;
  tolerance: boolean;
  toleranceMixTotal: number;
}) {
  const { rBase, w, rBaseTotal, mixPortion, tolerance, toleranceMixTotal } = params;
  if (!tolerance) return rBase;

  const surplus = max10(subtract10(w, rBaseTotal), 0);
  return add10(rBase, multiply10(surplus, safeDiv(mixPortion, toleranceMixTotal)));
}
