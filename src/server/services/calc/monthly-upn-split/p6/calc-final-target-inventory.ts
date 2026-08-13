/**
 * 已确认口径：
 * O = IF(N > M, IF(L = false, M, N), N)
 *
 * 2026-06-28 复核结论：
 * - `drawio`
 * - `Excel` 公式文本
 * - 当前代码
 * 三者在 `O` 上一致。
 */
export function calcFinalTargetInventory(params: {
  m: number;
  n: number;
  tolerance: boolean;
}) {
  const { m, n, tolerance } = params;
  return compareDecimal(n, m) > 0 ? (tolerance === false ? m : n) : n;
}
import { compareDecimal } from "../../calculation-decimal";
