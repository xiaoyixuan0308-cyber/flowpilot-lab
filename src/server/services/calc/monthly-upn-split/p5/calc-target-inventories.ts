import { multiply10 } from "../../calculation-decimal";
import { calcFinalTargetInventory } from "../p6/calc-final-target-inventory";
import { calcTheoreticalReplenish } from "../p7/calc-theoretical-replenish";
import { safeDiv } from "../upn-split.helpers";

/**
 * drawio P5
 * 基于单个 UPN 的 X / F / K / L / I / J 计算：
 * M / N
 * 并串联调用 P6 / P7 得到 O / P / Q
 */
export function calcTargetInventories(params: {
  x: number;
  f: number;
  k: number;
  l: boolean;
  i: number;
  j: number;
}) {
  const { x, f, k, l, i, j } = params;
  const m = multiply10(safeDiv(k, 30), f);
  const n = multiply10(safeDiv(x, 30), f);
  const o = calcFinalTargetInventory({ m, n, tolerance: l });
  const { p, q } = calcTheoreticalReplenish({ o, i, j });

  return { x, m, n, o, p, q };
}
